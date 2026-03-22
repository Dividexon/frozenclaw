import "server-only";

import { getDb } from "@/lib/db";
import { getManagedUsageSummary, type ManagedUsageSummary } from "@/lib/managed";
import { plans, type PlanId } from "@/lib/plans";
import { buildAgentUrl, buildSetupUrl } from "@/lib/provisioning";
import { isAdminEmail } from "@/lib/admin";

type OrderRow = {
  id: number;
  email: string | null;
  plan: string;
  usage_mode: string;
  payment_status: string;
  instance_state: string;
  instance_slug: string | null;
  instance_port: number | null;
  gateway_token: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  managed_provider: string | null;
  managed_model: string | null;
  updated_at: string;
};

export type AdminOverview = {
  totalAccounts: number;
  payingAccounts: number;
  testAccounts: number;
  readyInstances: number;
  provisioningInstances: number;
  failedInstances: number;
  byokAccounts: number;
  managedAccounts: number;
  estimatedMrrCents: number;
  latestFailure: {
    createdAt: string;
    email: string | null;
    slug: string | null;
    message: string;
  } | null;
};

export type AdminCustomerRow = {
  orderId: number;
  email: string | null;
  accountType: string;
  planLabel: string;
  usageModeLabel: string;
  paymentStatus: string;
  subscriptionStatus: string | null;
  instanceState: string;
  instanceSlug: string | null;
  lastActivityAt: string | null;
  updatedAt: string;
  activationUrl: string | null;
  agentUrl: string | null;
  isAdmin: boolean;
};

export type AdminInstanceRow = {
  orderId: number;
  email: string | null;
  slug: string;
  port: number | null;
  planLabel: string;
  usageModeLabel: string;
  state: string;
  modelLabel: string;
  updatedAt: string;
  activationUrl: string | null;
  agentUrl: string | null;
};

export type AdminBillingRow = {
  orderId: number;
  email: string | null;
  planLabel: string;
  amountLabel: string;
  paymentStatus: string;
  subscriptionStatus: string | null;
  customerId: string | null;
  updatedAt: string;
};

export type AdminUsageRow = {
  orderId: number;
  email: string | null;
  planLabel: string;
  model: string;
  usedTokens: number;
  remainingTokens: number;
  topUpTokens: number;
  usedCostMicros: number;
};

export type AdminProvisioningEventRow = {
  id: number;
  createdAt: string;
  action: string;
  email: string | null;
  slug: string | null;
  details: string | null;
};

export type AdminSnapshot = {
  overview: AdminOverview;
  customers: AdminCustomerRow[];
  instances: AdminInstanceRow[];
  billing: AdminBillingRow[];
  managedUsage: AdminUsageRow[];
  provisioningEvents: AdminProvisioningEventRow[];
};

const planLabels: Record<string, string> = {
  trial: "Testzugang",
  hosted_byok: "Standardplan",
  managed_starter: "Managed Starter",
  managed_immediate: "Managed Plus",
  managed_advanced: "Managed Advanced",
};

function formatDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(parsed);
}

function getOrderRows() {
  return getDb()
    .prepare(
      `
        SELECT
          id,
          email,
          plan,
          usage_mode,
          payment_status,
          instance_state,
          instance_slug,
          instance_port,
          gateway_token,
          stripe_customer_id,
          stripe_subscription_id,
          stripe_subscription_status,
          managed_provider,
          managed_model,
          updated_at
        FROM orders
        ORDER BY updated_at DESC, id DESC
      `,
    )
    .all() as OrderRow[];
}

function getLatestPerEmail(rows: OrderRow[]) {
  const map = new Map<string, OrderRow>();

  for (const row of rows) {
    if (!row.email) {
      continue;
    }

    const key = row.email.trim().toLowerCase();

    if (!map.has(key)) {
      map.set(key, row);
    }
  }

  return Array.from(map.values());
}

function getLatestActivity(orderId: number) {
  const usageRow = getDb()
    .prepare(
      `
        SELECT created_at
        FROM usage_events
        WHERE order_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `,
    )
    .get(orderId) as { created_at: string } | undefined;

  if (usageRow?.created_at) {
    return usageRow.created_at;
  }

  const eventRow = getDb()
    .prepare(
      `
        SELECT created_at
        FROM event_log
        WHERE order_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `,
    )
    .get(orderId) as { created_at: string } | undefined;

  return eventRow?.created_at ?? null;
}

function formatAmountCents(amountCents: number) {
  return `${(amountCents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR`;
}

function getPlanAmount(planId: string) {
  if (planId in plans) {
    return plans[planId as PlanId].amountCents;
  }

  return 0;
}

function parseFailureMessage(details: string | null) {
  if (!details) {
    return "Kein Fehlertext gespeichert";
  }

  try {
    const payload = JSON.parse(details) as { message?: string };
    return payload.message ?? details;
  } catch {
    return details;
  }
}

function buildOverview(rows: OrderRow[]): AdminOverview {
  const latestPerEmail = getLatestPerEmail(rows);
  const payingAccounts = latestPerEmail.filter(
    (row) => row.plan !== "trial" && row.payment_status === "paid",
  );
  const testAccounts = latestPerEmail.filter((row) => row.plan === "trial");
  const estimatedMrrCents = payingAccounts.reduce(
    (sum, row) => sum + getPlanAmount(row.plan),
    0,
  );
  const latestFailureRow = getDb()
    .prepare(
      `
        SELECT
          e.created_at,
          e.details,
          o.email,
          o.instance_slug
        FROM event_log e
        LEFT JOIN orders o ON o.id = e.order_id
        WHERE e.action = 'provisioning_failed'
        ORDER BY e.created_at DESC, e.id DESC
        LIMIT 1
      `,
    )
    .get() as
    | {
        created_at: string;
        details: string | null;
        email: string | null;
        instance_slug: string | null;
      }
    | undefined;

  return {
    totalAccounts: latestPerEmail.length,
    payingAccounts: payingAccounts.length,
    testAccounts: testAccounts.length,
    readyInstances: rows.filter((row) => row.instance_state === "ready").length,
    provisioningInstances: rows.filter((row) =>
      ["pending", "provisioning"].includes(row.instance_state),
    ).length,
    failedInstances: rows.filter((row) => row.instance_state === "failed").length,
    byokAccounts: latestPerEmail.filter((row) => row.usage_mode === "byok").length,
    managedAccounts: latestPerEmail.filter((row) => row.usage_mode === "managed").length,
    estimatedMrrCents,
    latestFailure: latestFailureRow
      ? {
          createdAt: formatDateTime(latestFailureRow.created_at) ?? latestFailureRow.created_at,
          email: latestFailureRow.email,
          slug: latestFailureRow.instance_slug,
          message: parseFailureMessage(latestFailureRow.details),
        }
      : null,
  };
}

function buildCustomers(rows: OrderRow[]): AdminCustomerRow[] {
  return getLatestPerEmail(rows).map((row) => ({
    orderId: row.id,
    email: row.email,
    accountType: row.plan === "trial" ? "Testzugang" : "Kundenkonto",
    planLabel: planLabels[row.plan] ?? row.plan,
    usageModeLabel: row.usage_mode === "managed" ? "Managed" : "BYOK",
    paymentStatus: row.payment_status,
    subscriptionStatus: row.stripe_subscription_status,
    instanceState: row.instance_state,
    instanceSlug: row.instance_slug,
    lastActivityAt: formatDateTime(getLatestActivity(row.id)),
    updatedAt: formatDateTime(row.updated_at) ?? row.updated_at,
    activationUrl: buildSetupUrl(row.instance_slug, row.gateway_token),
    agentUrl: buildAgentUrl(row.instance_slug, row.gateway_token),
    isAdmin: isAdminEmail(row.email),
  }));
}

function buildInstances(rows: OrderRow[]): AdminInstanceRow[] {
  return rows
    .filter((row) => row.instance_slug)
    .map((row) => ({
      orderId: row.id,
      email: row.email,
      slug: row.instance_slug!,
      port: row.instance_port,
      planLabel: planLabels[row.plan] ?? row.plan,
      usageModeLabel: row.usage_mode === "managed" ? "Managed" : "BYOK",
      state: row.instance_state,
      modelLabel:
        row.usage_mode === "managed"
          ? row.managed_model ?? "openai/gpt-5.2"
          : "Vom Kunden konfigurierte Provider",
      updatedAt: formatDateTime(row.updated_at) ?? row.updated_at,
      activationUrl: buildSetupUrl(row.instance_slug, row.gateway_token),
      agentUrl: buildAgentUrl(row.instance_slug, row.gateway_token),
    }));
}

function buildBilling(rows: OrderRow[]): AdminBillingRow[] {
  return rows
    .filter((row) => row.plan !== "trial")
    .slice(0, 20)
    .map((row) => ({
      orderId: row.id,
      email: row.email,
      planLabel: planLabels[row.plan] ?? row.plan,
      amountLabel: formatAmountCents(getPlanAmount(row.plan)),
      paymentStatus: row.payment_status,
      subscriptionStatus: row.stripe_subscription_status,
      customerId: row.stripe_customer_id,
      updatedAt: formatDateTime(row.updated_at) ?? row.updated_at,
    }));
}

function buildManagedUsage(rows: OrderRow[]): AdminUsageRow[] {
  return rows
    .filter((row) => row.usage_mode === "managed")
    .map((row) => {
      const summary: ManagedUsageSummary = getManagedUsageSummary(row.id);

      return {
        orderId: row.id,
        email: row.email,
        planLabel: planLabels[row.plan] ?? row.plan,
        model: summary.model,
        usedTokens: summary.usedStandardTokens,
        remainingTokens: summary.remainingStandardTokens,
        topUpTokens: summary.topUpStandardTokens,
        usedCostMicros: summary.usedCostMicros,
      };
    })
    .sort((left, right) => right.usedTokens - left.usedTokens)
    .slice(0, 20);
}

function buildProvisioningEvents(): AdminProvisioningEventRow[] {
  const rows = getDb()
    .prepare(
      `
        SELECT
          e.id,
          e.created_at,
          e.action,
          e.details,
          o.email,
          o.instance_slug
        FROM event_log e
        LEFT JOIN orders o ON o.id = e.order_id
        WHERE e.action IN (
          'provisioning_started',
          'provisioning_ready',
          'provisioning_failed',
          'admin_reprovision_requested',
          'admin_instance_restart_requested',
          'admin_gateway_token_rotated'
        )
        ORDER BY e.created_at DESC, e.id DESC
        LIMIT 20
      `,
    )
    .all() as Array<{
      id: number;
      created_at: string;
      action: string;
      details: string | null;
      email: string | null;
      instance_slug: string | null;
    }>;

  return rows.map((row) => ({
    id: row.id,
    createdAt: formatDateTime(row.created_at) ?? row.created_at,
    action: row.action,
    email: row.email,
    slug: row.instance_slug,
    details: parseFailureMessage(row.details),
  }));
}

export function formatMicrosAsEuro(value: number) {
  const euros = value / 1_000_000;

  return `${euros.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR`;
}

export function buildAdminSnapshot(): AdminSnapshot {
  const rows = getOrderRows();

  return {
    overview: buildOverview(rows),
    customers: buildCustomers(rows),
    instances: buildInstances(rows),
    billing: buildBilling(rows),
    managedUsage: buildManagedUsage(rows),
    provisioningEvents: buildProvisioningEvents(),
  };
}
