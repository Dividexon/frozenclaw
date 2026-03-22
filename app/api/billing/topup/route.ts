import { NextResponse } from "next/server";
import { resolveSessionAccessFromCookies } from "@/lib/auth";
import { getDb, logOrderEvent } from "@/lib/db";
import { getBaseUrlFromRequest } from "@/lib/env";
import { getManagedTopUpPackage } from "@/lib/managed";
import { getStripe } from "@/lib/stripe";

type Body = {
  packageId?: string;
};

export const runtime = "nodejs";

function getBillingIdentity(orderId: number) {
  return getDb()
    .prepare(
      `
        SELECT
          id,
          email,
          plan,
          usage_mode,
          stripe_customer_id
        FROM orders
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(orderId) as
    | {
        id: number;
        email: string | null;
        plan: string;
        usage_mode: string;
        stripe_customer_id: string | null;
      }
    | undefined;
}

export async function POST(request: Request) {
  const access = await resolveSessionAccessFromCookies();

  if (!access) {
    return NextResponse.json({ error: "Du bist nicht angemeldet." }, { status: 403 });
  }

  if (access.plan === "trial") {
    return NextResponse.json(
      { error: "Nachbuchungen sind erst in einem bezahlten Managed-Plan verfügbar." },
      { status: 409 },
    );
  }

  if (access.usageMode !== "managed") {
    return NextResponse.json(
      { error: "Nachbuchungen sind nur für Managed-Pläne verfügbar." },
      { status: 409 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const packageId = body.packageId?.trim() ?? "";
  const topUpPackage = getManagedTopUpPackage(access.plan, packageId);

  if (!topUpPackage) {
    return NextResponse.json({ error: "Ungültiges Nachbuchungs-Paket." }, { status: 400 });
  }

  const billing = getBillingIdentity(access.orderId);

  if (!billing) {
    return NextResponse.json({ error: "Konto konnte nicht geladen werden." }, { status: 404 });
  }

  try {
    const stripe = getStripe();
    const baseUrl = getBaseUrlFromRequest(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      ...(billing.stripe_customer_id
        ? { customer: billing.stripe_customer_id }
        : billing.email
          ? { customer_email: billing.email }
          : {}),
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Frozenclaw Nachbuchung ${topUpPackage.label}`,
              description: `Einmaliger Kauf für ${topUpPackage.label} im Managed-Plan.`,
            },
            unit_amount: topUpPackage.amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        topUpOrderId: String(access.orderId),
        topUpPackageId: topUpPackage.id,
        standardTokens: String(topUpPackage.standardTokens),
        amountCents: String(topUpPackage.amountCents),
      },
      success_url: `${baseUrl}/konto#plan-verbrauch`,
      cancel_url: `${baseUrl}/konto#plan-verbrauch`,
    });

    getDb()
      .prepare(
        `
          INSERT INTO topup_purchases (
            order_id,
            stripe_session_id,
            package_id,
            standard_tokens,
            amount_cents,
            status
          )
          VALUES (
            @orderId,
            @sessionId,
            @packageId,
            @standardTokens,
            @amountCents,
            'checkout_created'
          )
          ON CONFLICT(stripe_session_id) DO UPDATE SET
            package_id = excluded.package_id,
            standard_tokens = excluded.standard_tokens,
            amount_cents = excluded.amount_cents,
            status = 'checkout_created'
        `,
      )
      .run({
        orderId: access.orderId,
        sessionId: session.id,
        packageId: topUpPackage.id,
        standardTokens: topUpPackage.standardTokens,
        amountCents: topUpPackage.amountCents,
      });

    logOrderEvent(access.orderId, "topup_checkout_created", {
      stripeSessionId: session.id,
      packageId: topUpPackage.id,
      standardTokens: topUpPackage.standardTokens,
      amountCents: topUpPackage.amountCents,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Nachbuchung konnte nicht gestartet werden.",
      },
      { status: 500 },
    );
  }
}
