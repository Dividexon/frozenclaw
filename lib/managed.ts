import "server-only";

import { getDb } from "@/lib/db";
import { getAppConfig } from "@/lib/env";
import { plans } from "@/lib/plans";

const managedPlan = plans.managed_beta;

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

export function isManagedApiKeyConfigured() {
  return Boolean(getAppConfig().managedOpenAiApiKey);
}

export function getManagedDefaults() {
  return {
    provider: managedPlan.managedProvider ?? "openai",
    model: managedPlan.managedModel ?? "openai/gpt-5.2",
    includedStandardTokens: managedPlan.includedStandardTokens ?? 3_000_000,
    includedBudgetCents: 2000,
  };
}

export function getManagedTopUps() {
  return managedPlan.topUps ?? [];
}

export function buildManagedOrderSeed() {
  const defaults = getManagedDefaults();

  return {
    managedProvider: defaults.provider,
    managedModel: defaults.model,
    includedStandardTokens: defaults.includedStandardTokens,
    includedBudgetCents: defaults.includedBudgetCents,
  };
}

export function getManagedUsageSummary(orderId: number): ManagedUsageSummary {
  const db = getDb();
  const defaults = getManagedDefaults();

  const order = db
    .prepare(`
      SELECT
        managed_provider,
        managed_model,
        included_standard_tokens,
        included_budget_cents
      FROM orders
      WHERE id = ?
    `)
    .get(orderId) as
    | {
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
