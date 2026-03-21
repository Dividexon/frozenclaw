import { NextResponse } from "next/server";
import { getDb, logOrderEvent } from "@/lib/db";
import { getBaseUrlFromRequest } from "@/lib/env";
import { buildManagedOrderSeed } from "@/lib/managed";
import { startRuntimeRecovery } from "@/lib/provisioning";
import { getStripe } from "@/lib/stripe";
import { isPlanId, plans } from "@/lib/plans";

type CheckoutBody = {
  planId?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  startRuntimeRecovery();

  let body: CheckoutBody = {};

  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    // An empty body should still fall back to the default plan.
  }

  const planId = body.planId && isPlanId(body.planId) ? body.planId : "hosted_byok";
  const plan = plans[planId];
  const managedSeed = plan.usageMode === "managed" ? buildManagedOrderSeed() : null;

  if (!plan.active) {
    return NextResponse.json(
      {
        error:
          "Dieser Plan ist noch nicht aktiv. Managed bleibt gesperrt, bis Usage-Tracking verifiziert ist.",
      },
      { status: 409 }
    );
  }

  try {
    const stripe = getStripe();
    const baseUrl = getBaseUrlFromRequest(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        planId: plan.id,
        usageMode: plan.usageMode,
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/#preise`,
    });

    const db = getDb();
    db.prepare(`
      INSERT INTO orders (
        stripe_session_id,
        plan,
        usage_mode,
        payment_status,
        checkout_url,
        managed_provider,
        managed_model,
        included_standard_tokens,
        included_budget_cents
      )
      VALUES (
        @sessionId,
        @plan,
        @usageMode,
        'checkout_created',
        @checkoutUrl,
        @managedProvider,
        @managedModel,
        @includedStandardTokens,
        @includedBudgetCents
      )
      ON CONFLICT(stripe_session_id) DO UPDATE SET
        plan = excluded.plan,
        usage_mode = excluded.usage_mode,
        checkout_url = excluded.checkout_url,
        managed_provider = excluded.managed_provider,
        managed_model = excluded.managed_model,
        included_standard_tokens = excluded.included_standard_tokens,
        included_budget_cents = excluded.included_budget_cents,
        updated_at = datetime('now')
    `).run({
      sessionId: session.id,
      plan: plan.id,
      usageMode: plan.usageMode,
      checkoutUrl: session.url ?? null,
      managedProvider: managedSeed?.managedProvider ?? null,
      managedModel: managedSeed?.managedModel ?? null,
      includedStandardTokens: managedSeed?.includedStandardTokens ?? 0,
      includedBudgetCents: managedSeed?.includedBudgetCents ?? 0,
    });

    const order = db
      .prepare("SELECT id FROM orders WHERE stripe_session_id = ?")
      .get(session.id) as { id: number } | undefined;

    logOrderEvent(order?.id ?? null, "checkout_created", {
      planId: plan.id,
      usageMode: plan.usageMode,
      stripeSessionId: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout konnte nicht erstellt werden.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
