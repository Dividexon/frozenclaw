import "server-only";

export type ProvisioningMode = "mock" | "script";

export type AppConfig = {
  appBaseUrl: string | null;
  provisioningMode: ProvisioningMode;
  provisioningScript: string | null;
  provisioningPortStart: number;
  provisioningPortEnd: number;
  staleProvisioningMinutes: number;
  agentBasePath: string;
};

let cachedConfig: AppConfig | null = null;

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
      provisioningScript: process.env.PROVISIONING_SCRIPT ?? null,
      provisioningPortStart,
      provisioningPortEnd,
      staleProvisioningMinutes: parsePositiveInt(
        process.env.PROVISIONING_STALE_MINUTES,
        5,
        "PROVISIONING_STALE_MINUTES"
      ),
      agentBasePath: process.env.AGENT_BASE_PATH ?? "/agent",
    };
  }

  return cachedConfig;
}

export function getBaseUrlFromRequest(request: Request) {
  return getAppConfig().appBaseUrl ?? new URL(request.url).origin;
}
