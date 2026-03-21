import { NextResponse } from "next/server";
import { getDb, logOrderEvent } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { isPlanId, plans, type UsageMode } from "@/lib/plans";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe-Signatur oder Webhook-Secret fehlt." },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const payload = await request.text();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    const db = getDb();

    const existingOrder = db
      .prepare("SELECT id FROM orders WHERE stripe_event_id = ?")
      .get(event.id) as { id: number } | undefined;

    if (existingOrder) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const rawPlanId = session.metadata?.planId ?? "hosted_byok";
      const planId = isPlanId(rawPlanId) ? rawPlanId : "hosted_byok";
      const usageMode = (session.metadata?.usageMode as UsageMode | undefined) ?? plans[planId].usageMode;
      const email = session.customer_details?.email ?? session.customer_email ?? null;

      db.prepare(`
        INSERT INTO orders (
          stripe_event_id,
          stripe_session_id,
          email,
          plan,
          usage_mode,
          payment_status,
          instance_state
        )
        VALUES (
          @eventId,
          @sessionId,
          @email,
          @plan,
          @usageMode,
          'paid',
          'pending'
        )
        ON CONFLICT(stripe_session_id) DO UPDATE SET
          stripe_event_id = excluded.stripe_event_id,
          email = COALESCE(excluded.email, orders.email),
          plan = excluded.plan,
          usage_mode = excluded.usage_mode,
          payment_status = 'paid',
          updated_at = datetime('now')
      `).run({
        eventId: event.id,
        sessionId: session.id,
        email,
        plan: planId,
        usageMode,
      });

      const order = db
        .prepare("SELECT id FROM orders WHERE stripe_session_id = ?")
        .get(session.id) as { id: number } | undefined;

      logOrderEvent(order?.id ?? null, "checkout_completed", {
        stripeEventId: event.id,
        stripeSessionId: session.id,
        email,
        planId,
        usageMode,
      });
    } else {
      logOrderEvent(null, "webhook_ignored", {
        stripeEventId: event.id,
        type: event.type,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook konnte nicht verarbeitet werden.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
