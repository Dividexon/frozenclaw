import "server-only";

import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ResolvedLoginToken } from "@/lib/login-links";
import { buildDashboardSnapshot, type DashboardProvider } from "@/lib/dashboard";

const execFileAsync = promisify(execFile);
const OPENCLAW_CONFIG_PREFIX = "/home/node/.openclaw";
const DEFAULT_CONNECTIONS = [
  { id: "telegram", label: "Telegram", description: "Nachrichten direkt in Telegram senden und empfangen." },
  { id: "discord", label: "Discord", description: "Community-Austausch und Automationen in Discord." },
  { id: "whatsapp", label: "WhatsApp", description: "Direkte Antworten und Routinen in WhatsApp." },
] as const;

type SessionStoreEntry = {
  sessionId?: string;
  updatedAt?: number;
  sessionFile?: string;
  model?: string;
  modelProvider?: string;
  chatType?: string;
  kind?: string;
};

type SessionStore = Record<string, SessionStoreEntry>;

type CronCliOutput = {
  jobs?: Array<{
    id?: string;
    name?: string;
    cron?: string;
    schedule?: string;
    enabled?: boolean;
    paused?: boolean;
    lastRunAt?: string;
    nextRunAt?: string;
  }>;
};

type ChannelsCliOutput = {
  chat?: Record<string, unknown>;
  auth?: Array<{
    id?: string;
    provider?: string;
    type?: string;
  }>;
};

type SessionListCliOutput = {
  sessions?: Array<{
    key?: string;
    sessionId?: string;
    updatedAt?: number;
    model?: string;
    modelProvider?: string;
    kind?: string;
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
    usage?: {
      input?: number;
      output?: number;
      totalTokens?: number;
    };
    provider?: string;
    model?: string;
  };
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
  schedule: string;
  status: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
};

export type FrozenclawConnection = {
  id: string;
  label: string;
  description: string;
  connected: boolean;
  authProfileId: string | null;
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
  let cliData: SessionListCliOutput = {};

  try {
    cliData = JSON.parse(extractFirstJsonDocument(await runOpenClawCli(slug, ["sessions", "--json"]))) as SessionListCliOutput;
  } catch {
    cliData = {};
  }

  const store = await readSessionStore(slug);
  const cliSessions = cliData.sessions ?? [];
  const result: FrozenclawThreadSummary[] = [];

  for (const [key, entry] of Object.entries(store)) {
    if (!entry.sessionId) {
      continue;
    }

    const cliEntry = cliSessions.find((candidate) => candidate.sessionId === entry.sessionId || candidate.key === key);
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

async function listTasks(slug: string) {
  try {
    const payload = JSON.parse(
      extractFirstJsonDocument(await runOpenClawCli(slug, ["cron", "list", "--json"], 30_000)),
    ) as CronCliOutput;

    return (payload.jobs ?? []).map((job, index) => ({
      id: job.id ?? `job-${index + 1}`,
      name: job.name ?? `Aufgabe ${index + 1}`,
      schedule: job.schedule ?? job.cron ?? "Nicht angegeben",
      status: job.paused || job.enabled === false ? "Pausiert" : "Aktiv",
      lastRunAt: formatDateTime(job.lastRunAt ?? null),
      nextRunAt: formatDateTime(job.nextRunAt ?? null),
    }));
  } catch {
    return [] as FrozenclawTask[];
  }
}

async function listConnections(slug: string) {
  try {
    const payload = JSON.parse(
      extractFirstJsonDocument(await runOpenClawCli(slug, ["channels", "list", "--json"], 30_000)),
    ) as ChannelsCliOutput;
    const connectedIds = new Set<string>();

    for (const key of Object.keys(payload.chat ?? {})) {
      connectedIds.add(key.toLowerCase());
    }

    for (const profile of payload.auth ?? []) {
      if (profile.provider) {
        connectedIds.add(profile.provider.toLowerCase());
      }
    }

    return DEFAULT_CONNECTIONS.map((connection) => {
      const authProfile = (payload.auth ?? []).find(
        (profile) => profile.provider?.toLowerCase() === connection.id,
      );

      return {
        id: connection.id,
        label: connection.label,
        description: connection.description,
        connected: connectedIds.has(connection.id),
        authProfileId: authProfile?.id ?? null,
      };
    });
  } catch {
    return DEFAULT_CONNECTIONS.map((connection) => ({
      ...connection,
      connected: false,
      authProfileId: null,
    }));
  }
}

function resolveModelLabel(access: ResolvedLoginToken, threads: FrozenclawThreadSummary[]) {
  if (access.managed?.model) {
    return access.managed.model;
  }

  return threads[0]?.model ?? null;
}

export async function buildFrozenclawWorkspace(access: ResolvedLoginToken, selectedSessionId?: string | null) {
  const dashboard = await buildDashboardSnapshot(access);
  const threads = access.instanceSlug ? await listThreads(access.instanceSlug) : [];
  const tasks = access.instanceSlug ? await listTasks(access.instanceSlug) : [];
  const connections = access.instanceSlug ? await listConnections(access.instanceSlug) : [];
  const currentSessionId =
    selectedSessionId ??
    threads[0]?.sessionId ??
    null;
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

export async function sendFrozenclawMessage(access: ResolvedLoginToken, message: string, sessionId?: string | null) {
  if (!access.instanceSlug) {
    throw new Error("Zu diesem Konto ist keine Instanz hinterlegt.");
  }

  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    throw new Error("Bitte zuerst eine Nachricht eingeben.");
  }

  const effectiveSessionId = sessionId?.trim() || crypto.randomUUID();
  await runOpenClawCli(
    access.instanceSlug,
    ["agent", "--session-id", effectiveSessionId, "--message", trimmedMessage, "--json"],
    180_000,
  );

  return buildFrozenclawWorkspace(access, effectiveSessionId);
}
