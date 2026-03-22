import { NextResponse } from "next/server";
import { getBaseUrlFromRequest } from "@/lib/env";
import { resolveLoginToken } from "@/lib/login-links";
import { getStripe } from "@/lib/stripe";
import { getDb, logOrderEvent } from "@/lib/db";
import { resolveSessionAccessFromCookies } from "@/lib/auth";

export const runtime = "nodejs";

type PortalBody = {
  token?: string;
};

function findBillingIdentity(orderId: number) {
  return getDb()
    .prepare(
      `
        SELECT
          id,
          stripe_session_id,
          stripe_customer_id,
          stripe_subscription_id
        FROM orders
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(orderId) as
    | {
        id: number;
        stripe_session_id: string;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
      }
    | undefined;
}

async function backfillStripeCustomer(orderId: number) {
  const identity = findBillingIdentity(orderId);

  if (!identity?.stripe_session_id) {
    return identity ?? null;
  }

  if (identity.stripe_customer_id) {
    return identity;
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(identity.stripe_session_id);
  const customerId = typeof session.customer === "string" ? session.customer : null;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

  if (!customerId) {
    return identity;
  }

  getDb()
    .prepare(
      `
        UPDATE orders
        SET
          stripe_customer_id = @customerId,
          stripe_subscription_id = COALESCE(@subscriptionId, stripe_subscription_id),
          updated_at = datetime('now')
        WHERE id = @orderId
      `,
    )
    .run({
      orderId,
      customerId,
      subscriptionId,
    });

  return findBillingIdentity(orderId) ?? {
    ...identity,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PortalBody;
  const loginToken = body.token?.trim();
  const access = loginToken ? resolveLoginToken(loginToken) : await resolveSessionAccessFromCookies();

  if (!access) {
    return NextResponse.json({ error: "Ungültige Sitzung oder ungültiger Login-Link." }, { status: 403 });
  }

  try {
    const identity = await backfillStripeCustomer(access.orderId);

    if (!identity?.stripe_customer_id) {
      return NextResponse.json(
        {
          error:
            "Für dieses Konto ist noch kein Stripe-Kunde hinterlegt. Das Billing-Portal ist erst nach einem echten Stripe-Checkout verfügbar.",
        },
        { status: 409 },
      );
    }

    const returnUrl =
      access.authType === "login_link" && loginToken
        ? `${getBaseUrlFromRequest(request)}/konto?token=${encodeURIComponent(loginToken)}#plan-verbrauch`
        : `${getBaseUrlFromRequest(request)}/konto#plan-verbrauch`;

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: identity.stripe_customer_id,
      return_url: returnUrl,
    });

    logOrderEvent(access.orderId, "billing_portal_opened", {
      stripeCustomerId: identity.stripe_customer_id,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Billing-Portal konnte nicht geöffnet werden.";

    if (message.includes("No such checkout.session")) {
      return NextResponse.json(
        {
          error:
            "Für dieses Konto existiert noch kein echter Stripe-Checkout. Das Billing-Portal wird verfügbar, sobald ein reales Abo über Stripe abgeschlossen wurde.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
