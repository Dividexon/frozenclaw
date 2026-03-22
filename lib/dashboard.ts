import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { getDb } from "@/lib/db";
import { getAppConfig } from "@/lib/env";
import type { ResolvedLoginToken } from "@/lib/login-links";

type ProviderId = "anthropic" | "openai" | "gemini";

type AuthStore = {
  version?: number;
  profiles?: Record<
    string,
    {
      type?: string;
      provider?: string;
      key?: string;
    }
  >;
  usageStats?: Record<
    string,
    {
      lastUsed?: number;
      errorCount?: number;
    }
  >;
};

type CronJobsFile = {
  version?: number;
  jobs?: Array<Record<string, unknown>>;
};

export type DashboardProvider = {
  id: ProviderId;
  label: string;
  configured: boolean;
  maskedKey: string | null;
  lastUsedAt: string | null;
};

export type DashboardCronJob = {
  id: string;
  name: string;
  schedule: string;
  status: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
};

export type DashboardNextAction = {
  title: string;
  description: string;
  label: string;
  href: string | null;
};

export type DashboardSnapshot = {
  planLabel: string;
  usageModeLabel: string;
  instanceStatusLabel: string;
  instanceStatusTone: "online" | "warning" | "critical";
  providerStatusSummary: string;
  lastActivityAt: string | null;
  providers: DashboardProvider[];
  cronJobs: DashboardCronJob[];
  nextAction: DashboardNextAction;
};

function toTimestamp(value: Date | number | string | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

const providerLabels: Record<ProviderId, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Gemini",
};

const planLabels: Record<string, string> = {
  trial: "Testzugang",
  hosted_byok: "Standardplan",
  managed_starter: "Managed Starter",
  managed_immediate: "Managed Plus",
  managed_advanced: "Managed Advanced",
};

function formatDateTime(value: Date | number | string | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function maskKey(rawKey: string | undefined) {
  if (!rawKey) {
    return null;
  }

  const visibleTail = rawKey.slice(-4);
  return `••••${visibleTail}`;
}

function getInstanceStatus(access: ResolvedLoginToken) {
  if (access.instanceState === "ready") {
    return {
      label: "Online",
      tone: "online" as const,
    };
  }

  if (access.instanceState === "pending" || access.instanceState === "provisioning") {
    return {
      label: "Bereitstellung läuft",
      tone: "warning" as const,
    };
  }

  return {
    label: "Handlungsbedarf",
    tone: "critical" as const,
  };
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return fallback;
    }

    return fallback;
  }
}

function getCustomerConfigDir(slug: string) {
  return path.join(getAppConfig().customerRootDir, slug, "config");
}

async function readAuthStore(slug: string) {
  return readJsonFile<AuthStore>(
    path.join(getCustomerConfigDir(slug), "agents", "main", "agent", "auth-profiles.json"),
    {},
  );
}

async function readCronJobs(slug: string) {
  const file = await readJsonFile<CronJobsFile>(
    path.join(getCustomerConfigDir(slug), "cron", "jobs.json"),
    {
      version: 1,
      jobs: [],
    },
  );

  return (file.jobs ?? []).map((job, index) => {
    const name =
      String(job.name ?? job.title ?? job.id ?? `Cronjob ${index + 1}`) || `Cronjob ${index + 1}`;
    const schedule = String(job.schedule ?? job.cron ?? job.interval ?? "Nicht angegeben");
    const isEnabled = job.enabled !== false && job.active !== false;
    const lastRunRaw =
      typeof job.lastRunAt === "string"
        ? job.lastRunAt
        : typeof job.lastRun === "string"
          ? job.lastRun
          : typeof job.last_run === "string"
            ? job.last_run
            : null;
    const nextRunRaw =
      typeof job.nextRunAt === "string"
        ? job.nextRunAt
        : typeof job.nextRun === "string"
          ? job.nextRun
          : typeof job.next_run === "string"
            ? job.next_run
            : null;

    return {
      id: String(job.id ?? `cron-${index + 1}`),
      name,
      schedule,
      status: isEnabled ? "Aktiv" : "Pausiert",
      lastRunAt: formatDateTime(lastRunRaw),
      nextRunAt: formatDateTime(nextRunRaw),
    };
  });
}

async function readProviders(slug: string): Promise<DashboardProvider[]> {
  const store = await readAuthStore(slug);
  const profiles = store.profiles ?? {};
  const usageStats = store.usageStats ?? {};

  return (Object.keys(providerLabels) as ProviderId[]).map((providerId) => {
    const profileEntry = Object.entries(profiles).find(
      ([, profile]) => profile.provider === providerId && profile.type === "api_key" && profile.key,
    );
    const usageEntry = Object.entries(usageStats).find(([profileId]) => {
      const profile = profiles[profileId];
      return profile?.provider === providerId;
    });

    return {
      id: providerId,
      label: providerLabels[providerId],
      configured: Boolean(profileEntry?.[1]?.key),
      maskedKey: maskKey(profileEntry?.[1]?.key),
      lastUsedAt: formatDateTime(usageEntry?.[1]?.lastUsed ?? null),
    };
  });
}

function readLastUsageEvent(orderId: number) {
  const row = getDb()
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

  return row?.created_at ?? null;
}

function readLastEventLog(orderId: number) {
  const row = getDb()
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

  return row?.created_at ?? null;
}

function buildNextAction(access: ResolvedLoginToken, providerCount: number) {
  if (access.instanceState !== "ready") {
    return {
      title: "Bereitstellung läuft noch",
      description:
        "Deine Instanz ist noch nicht vollständig bereit. Sobald der Status auf online steht, kannst du direkt in OpenClaw arbeiten.",
      label: "Status aktualisieren",
      href: access.activationUrl,
    };
  }

  if (access.usageMode === "byok" && providerCount === 0) {
    return {
      title: "API-Key hinterlegen",
      description:
        "Dein Agent ist bereit, aber noch kein eigener Provider ist konfiguriert. Ohne Key kann OpenClaw keine Modellanfragen senden.",
      label: "Provider verwalten",
      href: access.activationUrl,
    };
  }

  if (
    access.usageMode === "managed" &&
    access.managed &&
    access.managed.remainingStandardTokens <= Math.max(50_000, access.managed.includedStandardTokens * 0.2)
  ) {
    return {
      title: "Kontingent im Blick behalten",
      description:
        "Dein aktuelles Kontingent geht dem Ende entgegen. Prüfe deinen Plan oder bereite eine Nachbuchung vor.",
      label: "Plan & Verbrauch öffnen",
      href: "#plan-verbrauch",
    };
  }

  return {
    title: "Agent öffnen",
    description:
      "Deine Instanz ist bereit. Du kannst direkt in OpenClaw weiterarbeiten oder im Dashboard die nächsten Schritte prüfen.",
    label: "OpenClaw öffnen",
    href: access.agentUrl,
  };
}

export async function buildDashboardSnapshot(access: ResolvedLoginToken): Promise<DashboardSnapshot> {
  const instanceStatus = getInstanceStatus(access);
  const providers = access.instanceSlug ? await readProviders(access.instanceSlug) : [];
  const cronJobs = access.instanceSlug ? await readCronJobs(access.instanceSlug) : [];
  const providerCount = providers.filter((provider) => provider.configured).length;
  const lastUsageEvent = readLastUsageEvent(access.orderId);
  const lastEventLog = readLastEventLog(access.orderId);
  const providerLastUsedTimestamp = providers
    .map((provider) => toTimestamp(provider.lastUsedAt))
    .filter((value): value is number => value !== null)
    .sort((left, right) => right - left)[0];
  const usageTimestamp = toTimestamp(lastUsageEvent);
  const eventTimestamp = toTimestamp(lastEventLog);
  const lastActivityTimestamp = [providerLastUsedTimestamp, usageTimestamp, eventTimestamp]
    .filter((value): value is number => value !== null)
    .sort((left, right) => right - left)[0] ?? null;

  return {
    planLabel: planLabels[access.plan] ?? access.plan,
    usageModeLabel: access.usageMode === "managed" ? "Managed" : "BYOK",
    instanceStatusLabel: instanceStatus.label,
    instanceStatusTone: instanceStatus.tone,
    providerStatusSummary:
      access.usageMode === "managed"
        ? "Frozenclaw stellt den Modellzugang zentral bereit."
        : providerCount > 0
          ? `${providerCount} Provider aktiv`
          : "Noch kein Provider konfiguriert",
    lastActivityAt: formatDateTime(lastActivityTimestamp),
    providers,
    cronJobs,
    nextAction: buildNextAction(access, providerCount),
  };
}
