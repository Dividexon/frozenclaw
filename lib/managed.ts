import "server-only";

import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { getAppConfig } from "@/lib/env";
import { plans, type PlanId, type UsageMode } from "@/lib/plans";

export type ManagedUsageSummary = {
  provider: string;
  model: string;
  includedStandardTokens: number;
  topUpStandardTokens: number;
  usedStandardTokens: number;
  remainingStandardTokens: number;
  includedBudgetCents: number;
  topUpBudgetCents: number;
  usedCostMicros: number;
  managedApiKeyConfigured: boolean;
};

export type BillingPeriodUpdate = {
  orderId: number;
  planId: PlanId;
  usageMode: UsageMode;
  customerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
};

export type ManagedUsageEvent = {
  usageKey: string;
  orderId: number;
  provider: string;
  model: string;
  source: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens?: number;
};

export function isManagedApiKeyConfigured() {
  return Boolean(getAppConfig().managedOpenAiApiKey);
}

function getManagedPlanDefinition(planId?: string | null) {
  if (planId === "trial") {
    return plans.trial;
  }

  if (planId === "managed_starter") {
    return plans.managed_starter;
  }

  if (planId === "managed_immediate") {
    return plans.managed_immediate;
  }

  return plans.managed_advanced;
}

export function getManagedDefaults(planId?: string | null) {
  const managedPlan = getManagedPlanDefinition(planId);

  return {
    provider: managedPlan.managedProvider ?? "openai",
    model: managedPlan.managedModel ?? "openai/gpt-5.2",
    includedStandardTokens: managedPlan.includedStandardTokens ?? 5_000_000,
    includedBudgetCents: managedPlan.includedBudgetCents ?? 2500,
  };
}

export function getManagedTopUps(planId?: string | null) {
  return getManagedPlanDefinition(planId).topUps ?? [];
}

export function getManagedTopUpPackage(planId: string | null | undefined, packageId: string) {
  return getManagedTopUps(planId).find((entry) => entry.id === packageId) ?? null;
}

export function buildManagedOrderSeed(planId: PlanId) {
  const defaults = getManagedDefaults(planId);

  return {
    managedProvider: defaults.provider,
    managedModel: defaults.model,
    includedStandardTokens: defaults.includedStandardTokens,
    includedBudgetCents: defaults.includedBudgetCents,
  };
}

export function getManagedUsageSummary(orderId: number): ManagedUsageSummary {
  const db = getDb();

  const order = db
    .prepare(`
      SELECT
        plan,
        managed_provider,
        managed_model,
        included_standard_tokens,
        included_budget_cents,
        current_period_used_standard_tokens,
        current_period_used_cost_micros,
        topup_balance_standard_tokens
      FROM orders
      WHERE id = ?
    `)
    .get(orderId) as
    | {
        plan: string;
        managed_provider: string | null;
        managed_model: string | null;
        included_standard_tokens: number | null;
        included_budget_cents: number | null;
        current_period_used_standard_tokens: number | null;
        current_period_used_cost_micros: number | null;
        topup_balance_standard_tokens: number | null;
      }
    | undefined;

  const topUps = db
    .prepare(`
      SELECT
        COALESCE(SUM(amount_cents), 0) AS topup_budget_cents
      FROM topup_purchases
      WHERE order_id = ?
        AND status = 'paid'
    `)
    .get(orderId) as {
      topup_budget_cents: number;
    };

  const defaults = getManagedDefaults(order?.plan);
  const includedStandardTokens = order?.included_standard_tokens ?? defaults.includedStandardTokens;
  const includedBudgetCents = order?.included_budget_cents ?? defaults.includedBudgetCents;
  const topUpStandardTokens = order?.topup_balance_standard_tokens ?? 0;
  const usedStandardTokens = order?.current_period_used_standard_tokens ?? 0;

  return {
    provider: order?.managed_provider ?? defaults.provider,
    model: order?.managed_model ?? defaults.model,
    includedStandardTokens,
    topUpStandardTokens,
    usedStandardTokens,
    remainingStandardTokens: Math.max(
      0,
      includedStandardTokens + topUpStandardTokens - usedStandardTokens,
    ),
    includedBudgetCents,
    topUpBudgetCents: topUps.topup_budget_cents ?? 0,
    usedCostMicros: order?.current_period_used_cost_micros ?? 0,
    managedApiKeyConfigured: isManagedApiKeyConfigured(),
  };
}

export function formatStandardTokens(tokens: number) {
  return new Intl.NumberFormat("de-DE").format(tokens);
}

export function generateManagedTrackingToken() {
  return crypto.randomBytes(24).toString("base64url");
}

function roundToInt(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function resolveChargedStandardTokens(event: ManagedUsageEvent) {
  const perTurnTotal = roundToInt(event.inputTokens + event.outputTokens);
  const reportedTotal = roundToInt(event.totalTokens ?? 0);

  if (!reportedTotal) {
    return perTurnTotal;
  }

  // OpenClaw can report `usage.total` as a cumulative session figure while
  // `input` and `output` describe the current turn. For billing/counting we only
  // want the current turn, otherwise short prompts can consume an entire quota.
  if (Math.abs(reportedTotal - perTurnTotal) > 64) {
    return perTurnTotal;
  }

  return reportedTotal;
}

function getOpenAiTokenRatesMicros(model: string) {
  if (model === "openai/gpt-4o-mini" || model === "gpt-4o-mini") {
    return {
      inputMicrosPerToken: 0.15,
      outputMicrosPerToken: 0.6,
    };
  }

  if (model === "openai/gpt-4o" || model === "gpt-4o") {
    return {
      inputMicrosPerToken: 2.5,
      outputMicrosPerToken: 10,
    };
  }

  if (model === "openai/gpt-5.2" || model === "gpt-5.2") {
    return {
      inputMicrosPerToken: 1.75,
      outputMicrosPerToken: 14,
    };
  }

  return {
    inputMicrosPerToken: 1.75,
    outputMicrosPerToken: 14,
  };
}

export function calculateManagedUsage(event: ManagedUsageEvent) {
  const rates = getOpenAiTokenRatesMicros(event.model);
  const costInputMicros = roundToInt(event.inputTokens * rates.inputMicrosPerToken);
  const costOutputMicros = roundToInt(event.outputTokens * rates.outputMicrosPerToken);
  const costTotalMicros = costInputMicros + costOutputMicros;

  return {
    standardTokensCharged: resolveChargedStandardTokens(event),
    costInputMicros,
    costOutputMicros,
    costTotalMicros,
  };
}

export function recordManagedUsage(event: ManagedUsageEvent) {
  const usage = calculateManagedUsage(event);
  const db = getDb();

  db.transaction(() => {
    const order = db
      .prepare(
        `
          SELECT
            plan,
            included_standard_tokens,
            current_period_used_standard_tokens,
            current_period_used_cost_micros,
            topup_balance_standard_tokens
          FROM orders
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(event.orderId) as
      | {
          plan: string;
          included_standard_tokens: number;
          current_period_used_standard_tokens: number;
          current_period_used_cost_micros: number;
          topup_balance_standard_tokens: number;
        }
      | undefined;

    if (!order) {
      throw new Error(`Managed-Order ${event.orderId} nicht gefunden.`);
    }

    const insertResult = db
      .prepare(`
        INSERT INTO usage_events (
          order_id,
          provider,
          model,
          source,
          usage_key,
          input_tokens,
          output_tokens,
          standard_tokens_charged,
          cost_input_micros,
          cost_output_micros,
          cost_total_micros
        )
        VALUES (
          @orderId,
          @provider,
          @model,
          @source,
          @usageKey,
          @inputTokens,
          @outputTokens,
          @standardTokensCharged,
          @costInputMicros,
          @costOutputMicros,
          @costTotalMicros
        )
        ON CONFLICT(usage_key) DO NOTHING
      `)
      .run({
        orderId: event.orderId,
        provider: event.provider,
        model: event.model,
        source: event.source,
        usageKey: event.usageKey,
        inputTokens: event.inputTokens,
        outputTokens: event.outputTokens,
        standardTokensCharged: usage.standardTokensCharged,
        costInputMicros: usage.costInputMicros,
        costOutputMicros: usage.costOutputMicros,
        costTotalMicros: usage.costTotalMicros,
      });

    if (!insertResult.changes) {
      return;
    }

    const currentUsed = order.current_period_used_standard_tokens ?? 0;
    const included = order.included_standard_tokens ?? 0;
    const remainingIncluded = Math.max(0, included - currentUsed);
    const topupToConsume =
      order.plan === "trial"
        ? 0
        : Math.max(0, usage.standardTokensCharged - remainingIncluded);

    db.prepare(
      `
        UPDATE orders
        SET
          current_period_used_standard_tokens = current_period_used_standard_tokens + @chargedTokens,
          current_period_used_cost_micros = current_period_used_cost_micros + @costMicros,
          topup_balance_standard_tokens = CASE
            WHEN topup_balance_standard_tokens - @topupToConsume < 0 THEN 0
            ELSE topup_balance_standard_tokens - @topupToConsume
          END,
          updated_at = datetime('now')
        WHERE id = @orderId
      `,
    ).run({
      orderId: event.orderId,
      chargedTokens: usage.standardTokensCharged,
      costMicros: usage.costTotalMicros,
      topupToConsume,
    });
  })();

  return usage;
}

export function applyPaidTopUp(orderId: number, standardTokens: number) {
  getDb()
    .prepare(
      `
        UPDATE orders
        SET
          topup_balance_standard_tokens = topup_balance_standard_tokens + @standardTokens,
          updated_at = datetime('now')
        WHERE id = @orderId
      `,
    )
    .run({
      orderId,
      standardTokens,
    });
}

export function syncBillingPeriod(update: BillingPeriodUpdate) {
  const db = getDb();
  const managedSeed = update.usageMode === "managed" ? buildManagedOrderSeed(update.planId) : null;

  db.transaction(() => {
    const current = db
      .prepare(
        `
          SELECT billing_period_start, usage_mode
          FROM orders
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(update.orderId) as
      | {
          billing_period_start: string | null;
          usage_mode: string;
        }
      | undefined;

    const shouldResetCurrentPeriod =
      update.periodStart !== undefined &&
      update.periodStart !== null &&
      current?.billing_period_start !== null &&
      current?.billing_period_start !== update.periodStart;

    db.prepare(
      `
        UPDATE orders
        SET
          plan = @planId,
          usage_mode = @usageMode,
          managed_provider = @managedProvider,
          managed_model = @managedModel,
          included_standard_tokens = @includedStandardTokens,
          included_budget_cents = @includedBudgetCents,
          stripe_customer_id = COALESCE(@customerId, stripe_customer_id),
          stripe_subscription_id = COALESCE(@subscriptionId, stripe_subscription_id),
          stripe_subscription_status = COALESCE(@subscriptionStatus, stripe_subscription_status),
          billing_period_start = COALESCE(@periodStart, billing_period_start),
          billing_period_end = COALESCE(@periodEnd, billing_period_end),
          current_period_used_standard_tokens = CASE
            WHEN @shouldReset = 1 THEN 0
            ELSE current_period_used_standard_tokens
          END,
          current_period_used_cost_micros = CASE
            WHEN @shouldReset = 1 THEN 0
            ELSE current_period_used_cost_micros
          END,
          updated_at = datetime('now')
        WHERE id = @orderId
      `,
    ).run({
      orderId: update.orderId,
      planId: update.planId,
      usageMode: update.usageMode,
      managedProvider: managedSeed?.managedProvider ?? null,
      managedModel: managedSeed?.managedModel ?? null,
      includedStandardTokens: managedSeed?.includedStandardTokens ?? 0,
      includedBudgetCents: managedSeed?.includedBudgetCents ?? 0,
      customerId: update.customerId ?? null,
      subscriptionId: update.subscriptionId ?? null,
      subscriptionStatus: update.subscriptionStatus ?? null,
      periodStart: update.periodStart ?? null,
      periodEnd: update.periodEnd ?? null,
      shouldReset: shouldResetCurrentPeriod ? 1 : 0,
    });
  })();
}
