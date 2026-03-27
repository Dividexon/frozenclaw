import "server-only";

import path from "node:path";

export type ProvisioningMode = "mock" | "script";

export type AppConfig = {
  appBaseUrl: string | null;
  provisioningMode: ProvisioningMode;
  provisioningUseSudo: boolean;
  provisioningScript: string | null;
  restartScript: string | null;
  deprovisionScript: string | null;
  provisioningPortStart: number;
  provisioningPortEnd: number;
  staleProvisioningMinutes: number;
  agentBasePath: string;
  setupBasePath: string;
  customerRootDir: string;
  openClawImage: string;
  openwebuiImage: string;
  openClawRepoDir: string;
  serverTimezone: string;
  smtpHost: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPass: string | null;
  mailFrom: string | null;
  supportEmail: string | null;
  managedOpenAiApiKey: string | null;
  piperEnabled: boolean;
  piperCommand: string | null;
  piperModelPath: string | null;
  piperConfigPath: string | null;
  piperMaxTextLength: number;
  piperTimeoutMs: number;
  freeTierAccountLimit: number;
};

let cachedConfig: AppConfig | null = null;

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  throw new Error("Boolesche Umgebungswerte müssen true/false, 1/0, yes/no oder on/off sein.");
}

function parsePort(value: string | undefined, fallback: number, name: string) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`${name} muss ein gÃ¼ltiger Port sein.`);
  }

  return parsed;
}

function parsePositiveInt(value: string | undefined, fallback: number, name: string) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} muss eine positive Zahl sein.`);
  }

  return parsed;
}

function parseNonNegativeInt(value: string | undefined, fallback: number, name: string) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} muss eine Zahl >= 0 sein.`);
  }

  return parsed;
}

function parseProvisioningMode(value: string | undefined): ProvisioningMode {
  if (!value || value === "mock" || value === "script") {
    return (value ?? "mock") as ProvisioningMode;
  }

  throw new Error("PROVISIONING_MODE muss 'mock' oder 'script' sein.");
}

export function getAppConfig() {
  if (!cachedConfig) {
    const provisioningPortStart = parsePositiveInt(
      process.env.PROVISIONING_PORT_START,
      45000,
      "PROVISIONING_PORT_START"
    );
    const provisioningPortEnd = parsePositiveInt(
      process.env.PROVISIONING_PORT_END,
      45999,
      "PROVISIONING_PORT_END"
    );

    if (provisioningPortEnd <= provisioningPortStart) {
      throw new Error("PROVISIONING_PORT_END muss größer als PROVISIONING_PORT_START sein.");
    }

    cachedConfig = {
      appBaseUrl: process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_URL ?? null,
      provisioningMode: parseProvisioningMode(process.env.PROVISIONING_MODE),
      provisioningUseSudo: parseBoolean(process.env.PROVISIONING_USE_SUDO, false),
      provisioningScript: process.env.PROVISIONING_SCRIPT ?? null,
      restartScript: process.env.RESTART_INSTANCE_SCRIPT ?? null,
      deprovisionScript: process.env.DEPROVISION_SCRIPT ?? null,
      provisioningPortStart,
      provisioningPortEnd,
      staleProvisioningMinutes: parsePositiveInt(
        process.env.PROVISIONING_STALE_MINUTES,
        5,
        "PROVISIONING_STALE_MINUTES"
      ),
      agentBasePath: process.env.AGENT_BASE_PATH ?? "/agent",
      setupBasePath: process.env.SETUP_BASE_PATH ?? "/zugang",
      customerRootDir:
        process.env.CUSTOMER_ROOT_DIR ?? path.join(process.cwd(), "data", "customers"),
      openClawImage: process.env.OPENCLAW_IMAGE ?? "frozenclaw/openclaw:latest",
      openwebuiImage: process.env.OPENWEBUI_IMAGE ?? "ghcr.io/open-webui/open-webui:main",
      openClawRepoDir: process.env.OPENCLAW_REPO_DIR ?? "/opt/frozenclaw/vendor/openclaw",
      serverTimezone: process.env.SERVER_TIMEZONE ?? "Europe/Berlin",
      smtpHost: process.env.SMTP_HOST ?? null,
      smtpPort: parsePort(process.env.SMTP_PORT, 587, "SMTP_PORT"),
      smtpSecure: parseBoolean(process.env.SMTP_SECURE, false),
      smtpUser: process.env.SMTP_USER ?? null,
      smtpPass: process.env.SMTP_PASS ?? null,
      mailFrom: process.env.MAIL_FROM ?? null,
      supportEmail: process.env.SUPPORT_EMAIL ?? null,
      managedOpenAiApiKey: process.env.OPENAI_MANAGED_API_KEY ?? null,
      piperEnabled: parseBoolean(process.env.PIPER_ENABLED, false),
      piperCommand: process.env.PIPER_COMMAND ?? null,
      piperModelPath: process.env.PIPER_MODEL_PATH ?? null,
      piperConfigPath: process.env.PIPER_CONFIG_PATH ?? null,
      piperMaxTextLength: parsePositiveInt(
        process.env.PIPER_MAX_TEXT_LENGTH,
        800,
        "PIPER_MAX_TEXT_LENGTH"
      ),
      piperTimeoutMs: parsePositiveInt(process.env.PIPER_TIMEOUT_MS, 20000, "PIPER_TIMEOUT_MS"),
      freeTierAccountLimit: parseNonNegativeInt(
        process.env.FREE_TIER_ACCOUNT_LIMIT,
        100,
        "FREE_TIER_ACCOUNT_LIMIT"
      ),
    };
  }

  return cachedConfig;
}

export function getBaseUrlFromRequest(request: Request) {
  return getAppConfig().appBaseUrl ?? new URL(request.url).origin;
}
