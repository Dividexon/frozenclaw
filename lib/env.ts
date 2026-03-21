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
  openClawRepoDir: string;
  serverTimezone: string;
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
      openClawRepoDir: process.env.OPENCLAW_REPO_DIR ?? "/opt/frozenclaw/vendor/openclaw",
      serverTimezone: process.env.SERVER_TIMEZONE ?? "Europe/Berlin",
    };
  }

  return cachedConfig;
}

export function getBaseUrlFromRequest(request: Request) {
  return getAppConfig().appBaseUrl ?? new URL(request.url).origin;
}
