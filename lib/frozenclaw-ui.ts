import "server-only";

import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ResolvedLoginToken } from "@/lib/login-links";
import { buildDashboardSnapshot, type DashboardProvider } from "@/lib/dashboard";

const execFileAsync = promisify(execFile);
const OPENCLAW_CONFIG_PREFIX = "/home/node/.openclaw";
const MIN_FREE_TIER_CHAT_TOKENS = 12_000;
const DEFAULT_CONNECTIONS = [
  {
    id: "telegram",
    label: "Telegram",
    description: "Nachrichten direkt in Telegram senden und empfangen.",
  },
  {
    id: "discord",
    label: "Discord",
    description: "Community-Austausch und Automationen in Discord.",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Direkte Antworten und Routinen in WhatsApp.",
  },
] as const;

type SessionStoreEntry = {
  sessionId?: string;
  updatedAt?: number;
  sessionFile?: string;
  model?: string;
  modelProvider?: string;
};

type SessionStore = Record<string, SessionStoreEntry>;

type SessionListCliOutput = {
  sessions?: Array<{
    key?: string;
    sessionId?: string;
    updatedAt?: number;
    model?: string;
    modelProvider?: string;
  }>;
};

type SessionContentPart =
  | { type?: "text"; text?: string }
  | { type?: "toolCall"; name?: string }
  | { type?: "toolResult"; toolName?: string };

type SessionLine = {
  type?: string;
  timestamp?: string;
  message?: {
    role?: string;
    content?: SessionContentPart[];
    timestamp?: string;
  };
};

type CronJobSchedule =
  | {
      kind?: "every";
      everyMs?: number;
      anchorMs?: number;
    }
  | {
      kind?: "cron";
      cron?: string;
      timezone?: string;
    };

type CronJobState = {
  lastStartedAtMs?: number;
  lastFinishedAtMs?: number;
  lastSucceededAtMs?: number;
  lastFailedAtMs?: number;
  nextRunAtMs?: number;
  nextRunAt?: string;
  lastRunAt?: string;
  lastError?: string;
};

type CronJobFileEntry = {
  id?: string;
  name?: string;
  enabled?: boolean;
  createdAtMs?: number;
  updatedAtMs?: number;
  schedule?: CronJobSchedule;
  payload?: {
    kind?: string;
    message?: string;
  };
  state?: CronJobState;
};

type CronJobsFile = {
  version?: number;
  jobs?: CronJobFileEntry[];
};

type ChannelsCliOutput = {
  auth?: Array<{
    id?: string;
    provider?: string;
    type?: string;
  }>;
};

type ChannelStatusCliOutput = {
  channelOrder?: string[];
  channels?: Record<string, unknown>;
  channelAccounts?: Record<string, unknown>;
};

export type FrozenclawThreadSummary = {
  key: string;
  sessionId: string;
  title: string;
  updatedAt: string | null;
  provider: string | null;
  model: string | null;
};

export type FrozenclawMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: string | null;
};

export type FrozenclawTask = {
  id: string;
  name: string;
  message: string | null;
  schedule: string;
  status: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
};

export type FrozenclawTaskCreateInput = {
  name: string;
  message: string;
  scheduleMode: "every" | "cron";
  every?: string | null;
  cron?: string | null;
  enabled: boolean;
};

export type FrozenclawTaskAction = "enable" | "disable" | "run" | "delete";

export type FrozenclawConnection = {
  id: string;
  label: string;
  description: string;
  connected: boolean;
  authProfileId: string | null;
  statusDetail: string;
};

export type FrozenclawWorkspaceSnapshot = {
  accountLabel: string;
  planLabel: string;
  usageModeLabel: string;
  instanceStatusLabel: string;
  providers: DashboardProvider[];
  threads: FrozenclawThreadSummary[];
  selectedThreadId: string | null;
  messages: FrozenclawMessage[];
  tasks: FrozenclawTask[];
  connections: FrozenclawConnection[];
  remainingStandardTokens: number | null;
  includedStandardTokens: number | null;
  usedStandardTokens: number | null;
  modelLabel: string | null;
  instanceSlug: string | null;
};

function normalizeModelName(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.includes("/") ? normalized.split("/").pop() ?? normalized : normalized;
}

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

function getContainerName(slug: string) {
  return `frozenclaw-${slug}`;
}

function parseJsonDocument<T>(raw: string, fallback: T) {
  try {
    return JSON.parse(extractFirstJsonDocument(raw)) as T;
  } catch {
    return fallback;
  }
}

function cleanMessageText(raw: string) {
  return raw
    .replace(
      /^Sender \(untrusted metadata\):[\s\S]*?```\s*\n*\[[^\]]+\]\s*/u,
      "",
    )
    .replace(/^System:\s*/u, "System: ")
    .trim();
}

function extractText(parts: SessionContentPart[] | undefined) {
  if (!parts || parts.length === 0) {
    return "";
  }

  const chunks: string[] = [];

  for (const part of parts) {
    if (part.type === "text" && part.text) {
      chunks.push(part.text);
    } else if (part.type === "toolCall") {
      chunks.push(`[Tool-Aufruf: ${part.name ?? "unbekannt"}]`);
    } else if (part.type === "toolResult") {
      chunks.push(`[Tool-Ergebnis: ${part.toolName ?? "unbekannt"}]`);
    }
  }

  return cleanMessageText(chunks.join("\n\n"));
}

function buildThreadTitle(messages: FrozenclawMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.text);

  if (!firstUserMessage) {
    return "Neue Unterhaltung";
  }

  const title = firstUserMessage.text.replace(/\s+/g, " ").trim();
  return title.length > 54 ? `${title.slice(0, 54)}...` : title;
}

function extractFirstJsonDocument(raw: string) {
  const start = raw.search(/[{[]/u);

  if (start < 0) {
    throw new Error("Es wurde kein JSON-Dokument gefunden.");
  }

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === "\\") {
        escape = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{" || char === "[") {
      depth += 1;
    } else if (char === "}" || char === "]") {
      depth -= 1;

      if (depth === 0) {
        return raw.slice(start, index + 1);
      }
    }
  }

  throw new Error("Das JSON-Dokument ist unvollstaendig.");
}

function resolveInstanceSlug(access: ResolvedLoginToken) {
  if (!access.instanceSlug) {
    throw new Error("Zu diesem Konto ist keine Instanz hinterlegt.");
  }

  return access.instanceSlug;
}

function assertFreeTierCanSend(access: ResolvedLoginToken) {
  if (access.plan !== "trial") {
    return;
  }

  if (access.freeTierLocked || !access.managed || access.managed.remainingStandardTokens <= 0) {
    throw new Error(
      "Dein Free-Tier-Kontingent ist verbraucht. Bitte wähle jetzt einen bezahlten Plan, um weiterzuschreiben.",
    );
  }

  if (access.managed.remainingStandardTokens < MIN_FREE_TIER_CHAT_TOKENS) {
    const minimumTokensLabel = new Intl.NumberFormat("de-DE").format(MIN_FREE_TIER_CHAT_TOKENS);

    throw new Error(
      `Dein Free-Tier-Restkontingent reicht sehr wahrscheinlich nicht mehr für eine weitere Nachricht. ` +
        `Auf dieser Instanz braucht ein einzelner OpenClaw-Durchlauf oft mehr als ${minimumTokensLabel} Tokens. ` +
        `Bitte wähle jetzt einen bezahlten Plan, um weiterzuschreiben.`,
    );
  }
}

function formatEveryMs(everyMs: number) {
  const units = [
    { ms: 24 * 60 * 60 * 1000, label: "Tag", plural: "Tage" },
    { ms: 60 * 60 * 1000, label: "Stunde", plural: "Stunden" },
    { ms: 60 * 1000, label: "Minute", plural: "Minuten" },
  ];

  for (const unit of units) {
    if (everyMs >= unit.ms && everyMs % unit.ms === 0) {
      const amount = everyMs / unit.ms;
      return `Alle ${amount} ${amount === 1 ? unit.label : unit.plural}`;
    }
  }

  return `Alle ${Math.round(everyMs / 1000)} Sekunden`;
}

function resolveTaskScheduleLabel(job: CronJobFileEntry) {
  if (job.schedule?.kind === "every" && typeof job.schedule.everyMs === "number") {
    return formatEveryMs(job.schedule.everyMs);
  }

  if (job.schedule?.kind === "cron" && job.schedule.cron) {
    return job.schedule.cron;
  }

  return "Nicht angegeben";
}

function resolveTaskStatus(job: CronJobFileEntry) {
  if (job.enabled === false) {
    return "Pausiert";
  }

  if (job.state?.lastError) {
    return "Fehler";
  }

  return "Aktiv";
}

function getCompatibleManagedThread(
  access: ResolvedLoginToken,
  threads: FrozenclawThreadSummary[],
  preferredSessionId?: string | null,
) {
  if (access.usageMode !== "managed" || !access.managed?.model) {
    return preferredSessionId?.trim()
      ? threads.find((thread) => thread.sessionId === preferredSessionId.trim()) ?? null
      : threads[0] ?? null;
  }

  const managedModelName = normalizeModelName(access.managed.model);
  const preferredThread = preferredSessionId?.trim()
    ? threads.find((thread) => thread.sessionId === preferredSessionId.trim()) ?? null
    : null;

  const isCompatible = (thread: FrozenclawThreadSummary | null) =>
    Boolean(thread && normalizeModelName(thread.model) === managedModelName);

  if (isCompatible(preferredThread)) {
    return preferredThread;
  }

  return threads.find((thread) => normalizeModelName(thread.model) === managedModelName) ?? null;
}

async function runOpenClawCli(slug: string, args: string[], timeoutMs = 120_000) {
  const { stdout, stderr } = await execFileAsync(
    "docker",
    ["exec", getContainerName(slug), "node", "dist/index.js", ...args],
    {
      timeout: timeoutMs,
      maxBuffer: 8 * 1024 * 1024,
    },
  );

  return `${stdout}${stderr}`;
}

async function readOpenClawFile(slug: string, filePath: string) {
  const { stdout } = await execFileAsync(
    "docker",
    ["exec", getContainerName(slug), "cat", filePath],
    {
      timeout: 30_000,
      maxBuffer: 8 * 1024 * 1024,
    },
  );

  return stdout;
}

async function readSessionStore(slug: string) {
  try {
    const content = await readOpenClawFile(
      slug,
      `${OPENCLAW_CONFIG_PREFIX}/agents/main/sessions/sessions.json`,
    );
    return JSON.parse(content) as SessionStore;
  } catch {
    return {} as SessionStore;
  }
}

async function readSessionMessages(slug: string, sessionId: string) {
  const store = await readSessionStore(slug);
  const entry = Object.values(store).find((candidate) => candidate.sessionId === sessionId);
  const sessionFile =
    entry?.sessionFile ??
    `${OPENCLAW_CONFIG_PREFIX}/agents/main/sessions/${sessionId}.jsonl`;

  try {
    const content = await readOpenClawFile(slug, sessionFile);
    const lines = content
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean);
    const messages: FrozenclawMessage[] = [];

    for (const line of lines) {
      const entryLine = JSON.parse(line) as SessionLine;

      if (entryLine.type !== "message" || !entryLine.message) {
        continue;
      }

      const role = entryLine.message.role === "assistant"
        ? "assistant"
        : entryLine.message.role === "user"
          ? "user"
          : "system";
      const text = extractText(entryLine.message.content);

      if (!text) {
        continue;
      }

      messages.push({
        id: crypto.createHash("sha1").update(line).digest("hex"),
        role,
        text,
        timestamp: formatDateTime(entryLine.message.timestamp ?? entryLine.timestamp ?? null),
      });
    }

    return messages;
  } catch {
    return [] as FrozenclawMessage[];
  }
}

async function listThreads(slug: string) {
  const cliData = parseJsonDocument<SessionListCliOutput>(
    await runOpenClawCli(slug, ["sessions", "--json"]),
    {},
  );
  const store = await readSessionStore(slug);
  const cliSessions = cliData.sessions ?? [];
  const result: FrozenclawThreadSummary[] = [];

  for (const [key, entry] of Object.entries(store)) {
    if (!entry.sessionId) {
      continue;
    }

    const cliEntry = cliSessions.find(
      (candidate) => candidate.sessionId === entry.sessionId || candidate.key === key,
    );
    const messages = await readSessionMessages(slug, entry.sessionId);

    result.push({
      key,
      sessionId: entry.sessionId,
      title: buildThreadTitle(messages),
      updatedAt: formatDateTime(cliEntry?.updatedAt ?? entry.updatedAt ?? null),
      provider: cliEntry?.modelProvider ?? entry.modelProvider ?? null,
      model: cliEntry?.model ?? entry.model ?? null,
    });
  }

  result.sort((left, right) => {
    const leftDate = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
    const rightDate = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
    return rightDate - leftDate;
  });

  return result;
}

async function readCronJobsFile(slug: string) {
  try {
    const content = await readOpenClawFile(slug, `${OPENCLAW_CONFIG_PREFIX}/cron/jobs.json`);
    return JSON.parse(content) as CronJobsFile;
  } catch {
    return {
      version: 1,
      jobs: [],
    } satisfies CronJobsFile;
  }
}

async function listTasks(slug: string) {
  const file = await readCronJobsFile(slug);

  return (file.jobs ?? []).map((job, index) => ({
    id: job.id ?? `task-${index + 1}`,
    name: job.name?.trim() || `Aufgabe ${index + 1}`,
    message: job.payload?.message?.trim() || null,
    schedule: resolveTaskScheduleLabel(job),
    status: resolveTaskStatus(job),
    enabled: job.enabled !== false,
    lastRunAt: formatDateTime(
      job.state?.lastFinishedAtMs ??
        job.state?.lastSucceededAtMs ??
        job.state?.lastFailedAtMs ??
        job.state?.lastRunAt ??
        null,
    ),
    nextRunAt: formatDateTime(job.state?.nextRunAtMs ?? job.state?.nextRunAt ?? null),
  }));
}

async function listConnections(slug: string) {
  const listPayload = parseJsonDocument<ChannelsCliOutput>(
    await runOpenClawCli(slug, ["channels", "list", "--json"], 30_000),
    {},
  );
  const statusPayload = parseJsonDocument<ChannelStatusCliOutput>(
    await runOpenClawCli(slug, ["channels", "status", "--json"], 30_000),
    {},
  );
  const connectedIds = new Set<string>();

  for (const key of statusPayload.channelOrder ?? []) {
    connectedIds.add(key.toLowerCase());
  }

  for (const key of Object.keys(statusPayload.channels ?? {})) {
    connectedIds.add(key.toLowerCase());
  }

  for (const key of Object.keys(statusPayload.channelAccounts ?? {})) {
    connectedIds.add(key.toLowerCase());
  }

  for (const profile of listPayload.auth ?? []) {
    if (profile.provider) {
      connectedIds.add(profile.provider.toLowerCase());
    }
  }

  return DEFAULT_CONNECTIONS.map((connection) => {
    const authProfile = (listPayload.auth ?? []).find(
      (profile) => profile.provider?.toLowerCase() === connection.id,
    );
    const connected = connectedIds.has(connection.id);

    return {
      id: connection.id,
      label: connection.label,
      description: connection.description,
      connected,
      authProfileId: authProfile?.id ?? null,
      statusDetail: connected
        ? `Verbindung aktiv${authProfile?.id ? ` (${authProfile.id})` : ""}.`
        : "Noch nicht verbunden. Die Einrichtung folgt als naechster Schritt in der Frozenclaw UI.",
    };
  });
}

function resolveModelLabel(access: ResolvedLoginToken, threads: FrozenclawThreadSummary[]) {
  if (access.managed?.model) {
    return access.managed.model;
  }

  return threads[0]?.model ?? null;
}

function buildCronScheduleArgs(input: FrozenclawTaskCreateInput) {
  if (input.scheduleMode === "every") {
    const every = input.every?.trim();

    if (!every) {
      throw new Error("Bitte ein Intervall angeben, zum Beispiel 1h oder 30m.");
    }

    return ["--every", every];
  }

  const cron = input.cron?.trim();

  if (!cron) {
    throw new Error("Bitte einen Cron-Ausdruck angeben.");
  }

  return ["--cron", cron];
}

export async function buildFrozenclawWorkspace(
  access: ResolvedLoginToken,
  selectedSessionId?: string | null,
) {
  const dashboard = await buildDashboardSnapshot(access);
  const threads = access.instanceSlug ? await listThreads(access.instanceSlug) : [];
  const tasks = access.instanceSlug ? await listTasks(access.instanceSlug) : [];
  const connections = access.instanceSlug ? await listConnections(access.instanceSlug) : [];
  const currentThread = getCompatibleManagedThread(access, threads, selectedSessionId);
  const currentSessionId = currentThread?.sessionId ?? null;
  const messages =
    access.instanceSlug && currentSessionId
      ? await readSessionMessages(access.instanceSlug, currentSessionId)
      : [];

  return {
    accountLabel: dashboard.accountLabel,
    planLabel: dashboard.planLabel,
    usageModeLabel: dashboard.usageModeLabel,
    instanceStatusLabel: dashboard.instanceStatusLabel,
    providers: dashboard.providers,
    threads,
    selectedThreadId: currentSessionId,
    messages,
    tasks,
    connections,
    remainingStandardTokens: access.managed?.remainingStandardTokens ?? null,
    includedStandardTokens: access.managed?.includedStandardTokens ?? null,
    usedStandardTokens: access.managed?.usedStandardTokens ?? null,
    modelLabel: resolveModelLabel(access, threads),
    instanceSlug: access.instanceSlug,
  } satisfies FrozenclawWorkspaceSnapshot;
}

export async function sendFrozenclawMessage(
  access: ResolvedLoginToken,
  message: string,
  sessionId?: string | null,
) {
  assertFreeTierCanSend(access);

  const slug = resolveInstanceSlug(access);
  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    throw new Error("Bitte zuerst eine Nachricht eingeben.");
  }

  const compatibleThread = access.instanceSlug
    ? getCompatibleManagedThread(access, await listThreads(access.instanceSlug), sessionId)
    : null;
  const effectiveSessionId = compatibleThread?.sessionId ?? sessionId?.trim() ?? crypto.randomUUID();
  await runOpenClawCli(
    slug,
    ["agent", "--session-id", effectiveSessionId, "--message", trimmedMessage, "--json"],
    180_000,
  );

  return buildFrozenclawWorkspace(access, effectiveSessionId);
}

export async function createFrozenclawTask(
  access: ResolvedLoginToken,
  input: FrozenclawTaskCreateInput,
  selectedSessionId?: string | null,
) {
  const slug = resolveInstanceSlug(access);
  const name = input.name.trim();
  const message = input.message.trim();

  if (!name) {
    throw new Error("Bitte einen Namen fuer die Aufgabe eingeben.");
  }

  if (!message) {
    throw new Error("Bitte eine Anweisung fuer die Aufgabe eingeben.");
  }

  const args = [
    "cron",
    "add",
    "--name",
    name,
    "--message",
    message,
    ...buildCronScheduleArgs(input),
  ];

  if (!input.enabled) {
    args.push("--disabled");
  }

  await runOpenClawCli(slug, args, 60_000);
  return buildFrozenclawWorkspace(access, selectedSessionId);
}

export async function performFrozenclawTaskAction(
  access: ResolvedLoginToken,
  taskId: string,
  action: FrozenclawTaskAction,
  selectedSessionId?: string | null,
) {
  const slug = resolveInstanceSlug(access);
  const normalizedTaskId = taskId.trim();

  if (!normalizedTaskId) {
    throw new Error("Aufgabe nicht gefunden.");
  }

  if (action === "enable") {
    await runOpenClawCli(slug, ["cron", "enable", normalizedTaskId], 60_000);
    return buildFrozenclawWorkspace(access, selectedSessionId);
  }

  if (action === "disable") {
    await runOpenClawCli(slug, ["cron", "disable", normalizedTaskId], 60_000);
    return buildFrozenclawWorkspace(access, selectedSessionId);
  }

  if (action === "run") {
    await runOpenClawCli(slug, ["cron", "run", normalizedTaskId], 180_000);
    return buildFrozenclawWorkspace(access, selectedSessionId);
  }

  if (action === "delete") {
    await runOpenClawCli(slug, ["cron", "rm", normalizedTaskId], 60_000);
    return buildFrozenclawWorkspace(access, selectedSessionId);
  }

  throw new Error("Unbekannte Aufgabenaktion.");
}
