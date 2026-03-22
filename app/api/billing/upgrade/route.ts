import { NextResponse } from "next/server";
import { resolveSessionAccessFromCookies } from "@/lib/auth";
import { getDb, logOrderEvent } from "@/lib/db";
import { getBaseUrlFromRequest } from "@/lib/env";
import { buildManagedOrderSeed } from "@/lib/managed";
import { startRuntimeRecovery } from "@/lib/provisioning";
import { getStripe } from "@/lib/stripe";
import { isPlanId, plans, type PlanId } from "@/lib/plans";

type Body = {
  planId?: string;
};

export const runtime = "nodejs";

async function createUpgradeCheckout(request: Request, planId: PlanId | null) {
  startRuntimeRecovery();

  const access = await resolveSessionAccessFromCookies();

  if (!access) {
    return { error: "Du bist nicht angemeldet.", status: 403 as const };
  }

  if (access.plan !== "trial") {
    return {
      error: "Der Upgrade-Flow ist aktuell nur aus bestehenden Alt-Testkonten verfügbar.",
      status: 409 as const,
    };
  }

  if (!planId || planId === "trial") {
    return { error: "Bitte einen gültigen Zielplan wählen.", status: 400 as const };
  }

  const plan = plans[planId];

  if (!plan.active) {
    return { error: "Dieser Plan ist noch nicht buchbar.", status: 409 as const };
  }

  if (!access.email) {
    return { error: "Für dieses Konto ist keine E-Mail-Adresse hinterlegt.", status: 409 as const };
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

    return { url: session.url ?? null };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Upgrade-Checkout konnte nicht erstellt werden.",
      status: 500 as const,
    };
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const planId = body.planId && isPlanId(body.planId) ? body.planId : null;
  const result = await createUpgradeCheckout(request, planId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ url: result.url });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawPlanId = url.searchParams.get("planId");
  const planId = rawPlanId && isPlanId(rawPlanId) ? rawPlanId : null;
  const result = await createUpgradeCheckout(request, planId);

  if ("error" in result || !result.url) {
    const target = new URL("/konto#plan-verbrauch", request.url);
    target.searchParams.set(
      "billingError",
      "error" in result
        ? (result.error ?? "Upgrade-Checkout konnte nicht erstellt werden.")
        : "Upgrade-Checkout konnte nicht erstellt werden.",
    );
    return NextResponse.redirect(target, { status: 303 });
  }

  return NextResponse.redirect(result.url, { status: 303 });
}
