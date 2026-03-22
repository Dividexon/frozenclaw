import { NextResponse } from "next/server";
import { getDb, logOrderEvent } from "@/lib/db";
import { buildManagedOrderSeed } from "@/lib/managed";
import { queueProvisioning, startRuntimeRecovery } from "@/lib/provisioning";
import { getStripe } from "@/lib/stripe";
import { isPlanId, plans, type UsageMode } from "@/lib/plans";

export const runtime = "nodejs";

function updateSubscriptionState(
  subscriptionId: string,
  next: {
    customerId: string | null;
    status: string | null;
  },
) {
  getDb()
    .prepare(
      `
        UPDATE orders
        SET
          stripe_customer_id = COALESCE(@customerId, stripe_customer_id),
          stripe_subscription_id = @subscriptionId,
          stripe_subscription_status = @status,
          updated_at = datetime('now')
        WHERE stripe_subscription_id = @subscriptionId
           OR stripe_session_id IN (
             SELECT stripe_session_id
             FROM orders
             WHERE stripe_subscription_id = @subscriptionId
           )
      `,
    )
    .run({
      customerId: next.customerId,
      subscriptionId,
      status: next.status,
    });
}

export async function POST(request: Request) {
  startRuntimeRecovery();

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
      const managedSeed = usageMode === "managed" ? buildManagedOrderSeed(planId) : null;

      db.prepare(`
        INSERT INTO orders (
          stripe_event_id,
          stripe_session_id,
          stripe_customer_id,
          stripe_subscription_id,
          stripe_subscription_status,
          email,
          plan,
          usage_mode,
          payment_status,
          instance_state,
          managed_provider,
          managed_model,
          included_standard_tokens,
          included_budget_cents
        )
        VALUES (
          @eventId,
          @sessionId,
          @customerId,
          @subscriptionId,
          @subscriptionStatus,
          @email,
          @plan,
          @usageMode,
          'paid',
          'pending',
          @managedProvider,
          @managedModel,
          @includedStandardTokens,
          @includedBudgetCents
        )
        ON CONFLICT(stripe_session_id) DO UPDATE SET
          stripe_event_id = excluded.stripe_event_id,
          stripe_customer_id = COALESCE(excluded.stripe_customer_id, orders.stripe_customer_id),
          stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, orders.stripe_subscription_id),
          stripe_subscription_status = COALESCE(excluded.stripe_subscription_status, orders.stripe_subscription_status),
          email = COALESCE(excluded.email, orders.email),
          plan = excluded.plan,
          usage_mode = excluded.usage_mode,
          managed_provider = excluded.managed_provider,
          managed_model = excluded.managed_model,
          included_standard_tokens = excluded.included_standard_tokens,
          included_budget_cents = excluded.included_budget_cents,
          payment_status = 'paid',
          updated_at = datetime('now')
      `).run({
        eventId: event.id,
        sessionId: session.id,
        customerId: typeof session.customer === "string" ? session.customer : null,
        subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
        subscriptionStatus:
          session.mode === "subscription" ? session.status ?? session.payment_status ?? null : null,
        email,
        plan: planId,
        usageMode,
        managedProvider: managedSeed?.managedProvider ?? null,
        managedModel: managedSeed?.managedModel ?? null,
        includedStandardTokens: managedSeed?.includedStandardTokens ?? 0,
        includedBudgetCents: managedSeed?.includedBudgetCents ?? 0,
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

      if (order?.id) {
        queueProvisioning(order.id);
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      updateSubscriptionState(subscription.id, {
        customerId: typeof subscription.customer === "string" ? subscription.customer : null,
        status: subscription.status,
      });

      logOrderEvent(null, "subscription_updated", {
        stripeEventId: event.id,
        subscriptionId: subscription.id,
        status: subscription.status,
      });
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      updateSubscriptionState(subscription.id, {
        customerId: typeof subscription.customer === "string" ? subscription.customer : null,
        status: subscription.status,
      });

      logOrderEvent(null, "subscription_deleted", {
        stripeEventId: event.id,
        subscriptionId: subscription.id,
        status: subscription.status,
      });
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      logOrderEvent(null, event.type === "invoice.paid" ? "invoice_paid" : "invoice_payment_failed", {
        stripeEventId: event.id,
        invoiceId: invoice.id,
        customerId: typeof invoice.customer === "string" ? invoice.customer : null,
        status: invoice.status ?? null,
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
