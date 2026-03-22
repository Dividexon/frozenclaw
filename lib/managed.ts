import "server-only";

import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { getAppConfig } from "@/lib/env";
import { plans, type PlanId } from "@/lib/plans";

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
        included_budget_cents
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
      }
    | undefined;

  const usage = db
    .prepare(`
      SELECT
        COALESCE(SUM(standard_tokens_charged), 0) AS used_standard_tokens,
        COALESCE(SUM(cost_total_micros), 0) AS used_cost_micros
      FROM usage_events
      WHERE order_id = ?
    `)
    .get(orderId) as {
      used_standard_tokens: number;
      used_cost_micros: number;
    };

  const topUps = db
    .prepare(`
      SELECT
        COALESCE(SUM(standard_tokens), 0) AS topup_standard_tokens,
        COALESCE(SUM(amount_cents), 0) AS topup_budget_cents
      FROM topup_purchases
      WHERE order_id = ?
        AND status = 'paid'
    `)
    .get(orderId) as {
      topup_standard_tokens: number;
      topup_budget_cents: number;
    };

  const defaults = getManagedDefaults(order?.plan);
  const includedStandardTokens = order?.included_standard_tokens ?? defaults.includedStandardTokens;
  const includedBudgetCents = order?.included_budget_cents ?? defaults.includedBudgetCents;
  const topUpStandardTokens = topUps.topup_standard_tokens ?? 0;
  const usedStandardTokens = usage.used_standard_tokens ?? 0;

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
    usedCostMicros: usage.used_cost_micros ?? 0,
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

function getOpenAiTokenRatesMicros(model: string) {
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
    standardTokensCharged: roundToInt(event.totalTokens ?? event.inputTokens + event.outputTokens),
    costInputMicros,
    costOutputMicros,
    costTotalMicros,
  };
}

export function recordManagedUsage(event: ManagedUsageEvent) {
  const usage = calculateManagedUsage(event);
  const db = getDb();

  db.prepare(`
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
  `).run({
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

  return usage;
}
