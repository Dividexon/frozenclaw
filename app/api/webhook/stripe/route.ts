import { NextResponse } from "next/server";
import { clearProviderKeys } from "@/lib/customer-instances";
import { getDb, logOrderEvent } from "@/lib/db";
import { buildManagedOrderSeed } from "@/lib/managed";
import { queueProvisioning, startRuntimeRecovery } from "@/lib/provisioning";
import { getStripe } from "@/lib/stripe";
import { isPlanId, plans, type UsageMode } from "@/lib/plans";

export const runtime = "nodejs";

function findOrderById(orderId: number) {
  return getDb()
    .prepare(
      `
        SELECT id, plan, usage_mode, instance_slug
        FROM orders
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(orderId) as
    | {
        id: number;
        plan: string;
        usage_mode: string;
        instance_slug: string | null;
      }
    | undefined;
}

function findProcessedTopUpEvent(eventId: string) {
  return getDb()
    .prepare("SELECT id FROM topup_purchases WHERE stripe_event_id = ? LIMIT 1")
    .get(eventId) as { id: number } | undefined;
}

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

    if (existingOrder || findProcessedTopUpEvent(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const topUpOrderId = Number(session.metadata?.topUpOrderId ?? "");
      const topUpPackageId = session.metadata?.topUpPackageId?.trim() ?? "";

      if (Number.isInteger(topUpOrderId) && topUpOrderId > 0 && topUpPackageId) {
        const standardTokens = Number(session.metadata?.standardTokens ?? "0");
        const amountCents = Number(session.metadata?.amountCents ?? "0");

        db.prepare(
          `
            UPDATE topup_purchases
            SET
              stripe_event_id = @eventId,
              status = 'paid'
            WHERE stripe_session_id = @sessionId
          `,
        ).run({
          eventId: event.id,
          sessionId: session.id,
        });

        const existingTopUp = db
          .prepare("SELECT id FROM topup_purchases WHERE stripe_session_id = ? LIMIT 1")
          .get(session.id) as { id: number } | undefined;

        if (!existingTopUp) {
          db.prepare(
            `
              INSERT INTO topup_purchases (
                order_id,
                stripe_event_id,
                stripe_session_id,
                package_id,
                standard_tokens,
                amount_cents,
                status
              )
              VALUES (
                @orderId,
                @eventId,
                @sessionId,
                @packageId,
                @standardTokens,
                @amountCents,
                'paid'
              )
            `,
          ).run({
            orderId: topUpOrderId,
            eventId: event.id,
            sessionId: session.id,
            packageId: topUpPackageId,
            standardTokens,
            amountCents,
          });
        }

        logOrderEvent(topUpOrderId, "topup_checkout_completed", {
          stripeEventId: event.id,
          stripeSessionId: session.id,
          packageId: topUpPackageId,
          standardTokens,
          amountCents,
        });

        return NextResponse.json({ received: true });
      }

      const rawPlanId = session.metadata?.planId ?? "hosted_byok";
      const planId = isPlanId(rawPlanId) ? rawPlanId : "hosted_byok";
      const usageMode = (session.metadata?.usageMode as UsageMode | undefined) ?? plans[planId].usageMode;
      const upgradeOrderId = Number(session.metadata?.upgradeOrderId ?? "");
      const email = session.customer_details?.email ?? session.customer_email ?? null;
      const managedSeed = usageMode === "managed" ? buildManagedOrderSeed(planId) : null;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
      const subscriptionStatus =
        session.mode === "subscription" ? session.status ?? session.payment_status ?? null : null;

      if (Number.isInteger(upgradeOrderId) && upgradeOrderId > 0) {
        const currentOrder = findOrderById(upgradeOrderId);

        db.prepare(`
          UPDATE orders
          SET
            stripe_event_id = @eventId,
            stripe_session_id = @sessionId,
            stripe_customer_id = COALESCE(@customerId, stripe_customer_id),
            stripe_subscription_id = COALESCE(@subscriptionId, stripe_subscription_id),
            stripe_subscription_status = COALESCE(@subscriptionStatus, stripe_subscription_status),
            email = COALESCE(@email, email),
            plan = @plan,
            usage_mode = @usageMode,
            payment_status = 'paid',
            instance_state = 'pending',
            managed_provider = @managedProvider,
            managed_model = @managedModel,
            included_standard_tokens = @includedStandardTokens,
            included_budget_cents = @includedBudgetCents,
            updated_at = datetime('now')
          WHERE id = @orderId
        `).run({
          orderId: upgradeOrderId,
          eventId: event.id,
          sessionId: session.id,
          customerId,
          subscriptionId,
          subscriptionStatus,
          email,
          plan: planId,
          usageMode,
          managedProvider: managedSeed?.managedProvider ?? null,
          managedModel: managedSeed?.managedModel ?? null,
          includedStandardTokens: managedSeed?.includedStandardTokens ?? 0,
          includedBudgetCents: managedSeed?.includedBudgetCents ?? 0,
        });

        if (currentOrder?.usage_mode === "managed" && usageMode === "byok" && currentOrder.instance_slug) {
          await clearProviderKeys(currentOrder.instance_slug);
        }

        logOrderEvent(upgradeOrderId, "checkout_completed_upgrade", {
          stripeEventId: event.id,
          stripeSessionId: session.id,
          email,
          previousPlan: currentOrder?.plan ?? null,
          nextPlan: planId,
          previousUsageMode: currentOrder?.usage_mode ?? null,
          usageMode,
        });

        queueProvisioning(upgradeOrderId);
      } else {
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
          customerId,
          subscriptionId,
          subscriptionStatus,
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
