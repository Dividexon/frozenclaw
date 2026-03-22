import { NextResponse } from "next/server";
import { resolveSessionAccessFromCookies } from "@/lib/auth";
import { getDb, logOrderEvent } from "@/lib/db";
import { getBaseUrlFromRequest } from "@/lib/env";
import { buildManagedOrderSeed } from "@/lib/managed";
import { startRuntimeRecovery } from "@/lib/provisioning";
import { getStripe } from "@/lib/stripe";
import { isPlanId, plans } from "@/lib/plans";

type Body = {
  planId?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  startRuntimeRecovery();

  const access = await resolveSessionAccessFromCookies();

  if (!access) {
    return NextResponse.json({ error: "Du bist nicht angemeldet." }, { status: 403 });
  }

  if (access.plan !== "trial") {
    return NextResponse.json(
      { error: "Der Upgrade-Flow ist aktuell nur aus dem Testzugang verfügbar." },
      { status: 409 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const planId = body.planId && isPlanId(body.planId) ? body.planId : null;

  if (!planId || planId === "trial") {
    return NextResponse.json({ error: "Bitte einen gültigen Zielplan wählen." }, { status: 400 });
  }

  const plan = plans[planId];

  if (!plan.active) {
    return NextResponse.json(
      { error: "Dieser Plan ist noch nicht buchbar." },
      { status: 409 },
    );
  }

  if (!access.email) {
    return NextResponse.json(
      { error: "Für dieses Konto ist keine E-Mail-Adresse hinterlegt." },
      { status: 409 },
    );
  }

  try {
    const stripe = getStripe();
    const baseUrl = getBaseUrlFromRequest(request);
    const managedSeed = plan.usageMode === "managed" ? buildManagedOrderSeed(plan.id) : null;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: access.email,
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
        upgradeOrderId: String(access.orderId),
      },
      subscription_data: {
        metadata: {
          planId: plan.id,
          usageMode: plan.usageMode,
          upgradeOrderId: String(access.orderId),
        },
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/konto#plan-verbrauch`,
    });

    getDb()
      .prepare(
        `
          UPDATE orders
          SET
            stripe_session_id = @sessionId,
            checkout_url = @checkoutUrl,
            payment_status = 'checkout_created',
            updated_at = datetime('now')
          WHERE id = @orderId
        `,
      )
      .run({
        orderId: access.orderId,
        sessionId: session.id,
        checkoutUrl: session.url ?? null,
      });

    logOrderEvent(access.orderId, "trial_upgrade_checkout_created", {
      stripeSessionId: session.id,
      planId: plan.id,
      usageMode: plan.usageMode,
      managedProvider: managedSeed?.managedProvider ?? null,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Upgrade-Checkout konnte nicht erstellt werden.",
      },
      { status: 500 },
    );
  }
}
