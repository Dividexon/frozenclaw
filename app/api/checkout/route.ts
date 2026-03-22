import { NextResponse } from "next/server";
import { getDb, logOrderEvent } from "@/lib/db";
import { getBaseUrlFromRequest } from "@/lib/env";
import { buildManagedOrderSeed } from "@/lib/managed";
import type { PlanId } from "@/lib/plans";
import { startRuntimeRecovery } from "@/lib/provisioning";
import { getStripe } from "@/lib/stripe";
import { isPlanId, plans } from "@/lib/plans";

type CheckoutBody = {
  planId?: string;
};

export const runtime = "nodejs";

async function createCheckoutSession(request: Request, planId: PlanId) {
  startRuntimeRecovery();
  const plan = plans[planId];
  const managedSeed = plan.usageMode === "managed" ? buildManagedOrderSeed(plan.id) : null;

  if (!plan.active) {
    throw new Error(
      "Dieser Plan ist noch nicht aktiv. Managed bleibt gesperrt, bis Usage-Tracking verifiziert ist.",
    );
  }

  const stripe = getStripe();
  const baseUrl = getBaseUrlFromRequest(request);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          recurring: {
            interval: "month",
          },
          unit_amount: plan.amountCents,
        },
        quantity: 1,
      },
    ],
    billing_address_collection: "auto",
    allow_promotion_codes: true,
    metadata: {
      planId: plan.id,
      usageMode: plan.usageMode,
    },
    subscription_data: {
      metadata: {
        planId: plan.id,
        usageMode: plan.usageMode,
      },
    },
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/#preise`,
  });

  if (!session.url) {
    throw new Error("Stripe hat keine Checkout-URL zurückgegeben.");
  }

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
    checkoutUrl: session.url,
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

  return session.url;
}

export async function POST(request: Request) {
  let body: CheckoutBody = {};

  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    // An empty body should still fall back to the default plan.
  }

  const planId = body.planId && isPlanId(body.planId) ? body.planId : "hosted_byok";

  try {
    const url = await createCheckoutSession(request, planId);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout konnte nicht erstellt werden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPlanId = searchParams.get("planId");
  const planId = rawPlanId && isPlanId(rawPlanId) ? rawPlanId : "hosted_byok";

  try {
    const url = await createCheckoutSession(request, planId);
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout konnte nicht erstellt werden.";
    const baseUrl = getBaseUrlFromRequest(request);
    const fallbackUrl = new URL("/registrieren", baseUrl);
    fallbackUrl.searchParams.set("checkoutError", message);
    return NextResponse.redirect(fallbackUrl, 303);
  }
}
