import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { getAppConfig } from "@/lib/env";
import { getDb } from "@/lib/db";

export type ProviderId = "anthropic" | "openai" | "gemini";

export type ProviderStatus = {
  anthropic: boolean;
  openai: boolean;
  gemini: boolean;
};

const providerEnvMap: Record<ProviderId, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
};

const authStoreVersion = 1;

type AuthProfileStore = {
  version: number;
  profiles: Record<
    string,
    {
      type: "api_key";
      provider: string;
      key?: string;
    }
  >;
  order?: Record<string, string[]>;
  lastGood?: Record<string, string>;
  usageStats?: Record<string, unknown>;
};

type OpenClawConfig = {
  gateway?: {
    controlUi?: {
      allowedOrigins?: string[];
      dangerouslyDisableDeviceAuth?: boolean;
    };
  };
  agents?: {
    defaults?: {
      model?: {
        primary?: string;
      };
      models?: Record<string, { alias?: string }>;
    };
  };
};

const providerAllowedModels: Record<ProviderId, string[]> = {
  anthropic: [
    "anthropic/claude-opus-4-6",
    "anthropic/claude-sonnet-4-6",
    "anthropic/claude-sonnet-4-5",
    "anthropic/claude-haiku-3-5",
  ],
  openai: [
    "openai/gpt-5.2",
    "openai/gpt-5.1",
    "openai/gpt-4.1",
    "openai/gpt-4o",
  ],
  gemini: [
    "google/gemini-3-pro",
    "google/gemini-3-flash",
    "google/gemini-2.5-pro",
    "google/gemini-2.5-flash",
  ],
};

function parseEnv(content: string) {
  const values = new Map<string, string>();

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    values.set(trimmed.slice(0, separatorIndex), trimmed.slice(separatorIndex + 1));
  }

  return values;
}

async function readEnvFile(filePath: string) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return parseEnv(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Map<string, string>();
    }

    throw error;
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

export function getCustomerDir(slug: string) {
  return path.join(getAppConfig().customerRootDir, slug);
}

export function getCustomerConfigDir(slug: string) {
  return path.join(getCustomerDir(slug), "config");
}

export function getCustomerWorkspaceDir(slug: string) {
  return path.join(getCustomerDir(slug), "workspace");
}

export function getCustomerInstanceEnvPath(slug: string) {
  return path.join(getCustomerDir(slug), "instance.env");
}

export function getCustomerProviderEnvPath(slug: string) {
  return path.join(getCustomerConfigDir(slug), ".env");
}

export function getCustomerOpenClawConfigPath(slug: string) {
  return path.join(getCustomerConfigDir(slug), "openclaw.json");
}

export function getCustomerAgentDir(slug: string) {
  return path.join(getCustomerConfigDir(slug), "agents", "main", "agent");
}

export function getCustomerAuthProfilesPath(slug: string) {
  return path.join(getCustomerAgentDir(slug), "auth-profiles.json");
}

export async function ensureCustomerDirectories(slug: string) {
  await fs.mkdir(getCustomerDir(slug), { recursive: true });
  await fs.mkdir(getCustomerConfigDir(slug), { recursive: true });
  await fs.mkdir(getCustomerWorkspaceDir(slug), { recursive: true });
  await fs.mkdir(getCustomerAgentDir(slug), { recursive: true });
}

function getDefaultProfileId(provider: ProviderId) {
  return `${provider}:default`;
}

async function readAuthProfileStore(slug: string): Promise<AuthProfileStore> {
  return readJsonFile<AuthProfileStore>(getCustomerAuthProfilesPath(slug), {
    version: authStoreVersion,
    profiles: {},
  });
}

async function writeAuthProfileStore(slug: string, store: AuthProfileStore) {
  const content = `${JSON.stringify(store, null, 2)}\n`;
  await fs.writeFile(getCustomerAuthProfilesPath(slug), content, "utf8");
}

async function readOpenClawConfig(slug: string): Promise<OpenClawConfig> {
  return readJsonFile<OpenClawConfig>(getCustomerOpenClawConfigPath(slug), {});
}

async function writeOpenClawConfig(slug: string, config: OpenClawConfig) {
  const content = `${JSON.stringify(config, null, 2)}\n`;
  await fs.writeFile(getCustomerOpenClawConfigPath(slug), content, "utf8");
}

function hasProviderProfile(store: AuthProfileStore, provider: ProviderId) {
  return Object.values(store.profiles).some(
    (profile) => profile.provider === provider && profile.type === "api_key" && Boolean(profile.key),
  );
}

async function migrateLegacyProviderEnvToAuthStore(slug: string) {
  const envValues = await readEnvFile(getCustomerProviderEnvPath(slug));
  const store = await readAuthProfileStore(slug);
  let changed = false;

  for (const provider of Object.keys(providerEnvMap) as ProviderId[]) {
    const legacyKey = envValues.get(providerEnvMap[provider])?.trim();
    const profileId = getDefaultProfileId(provider);

    if (!legacyKey || store.profiles[profileId]?.key) {
      continue;
    }

    store.profiles[profileId] = {
      type: "api_key",
      provider,
      key: legacyKey,
    };
    changed = true;
  }

  if (changed) {
    await writeAuthProfileStore(slug, store);
  }
}

async function syncOpenClawModelAllowlist(slug: string) {
  const authStore = await readAuthProfileStore(slug);
  const allowedModels = new Set<string>();
  const order = getDb()
    .prepare(`
      SELECT usage_mode, managed_provider, managed_model
      FROM orders
      WHERE instance_slug = ?
      LIMIT 1
    `)
    .get(slug) as
    | {
        usage_mode: string;
        managed_provider: string | null;
        managed_model: string | null;
      }
    | undefined;

  if (
    order?.usage_mode === "managed" &&
    order.managed_provider === "openai" &&
    order.managed_model &&
    hasProviderProfile(authStore, "openai")
  ) {
    allowedModels.add(order.managed_model);
  } else {
    for (const provider of Object.keys(providerEnvMap) as ProviderId[]) {
      if (!hasProviderProfile(authStore, provider)) {
        continue;
      }

      for (const model of providerAllowedModels[provider]) {
        allowedModels.add(model);
      }
    }
  }

  const config = await readOpenClawConfig(slug);
  const nextConfig: OpenClawConfig = {
    ...config,
    agents: {
      ...config.agents,
      defaults: {
        ...config.agents?.defaults,
      },
    },
  };
  const primaryModel =
    order?.usage_mode === "managed" && order.managed_model
      ? order.managed_model
      : Array.from(allowedModels)[0];

  if (allowedModels.size > 0) {
    nextConfig.agents!.defaults!.model = {
      primary: primaryModel,
    };
    nextConfig.agents!.defaults!.models = Object.fromEntries(
      Array.from(allowedModels).map((model) => [
        model,
        {
          alias: model.includes("/") ? model.split("/").slice(1).join("/") : model,
        },
      ]),
    );
  } else if (nextConfig.agents?.defaults?.models) {
    delete nextConfig.agents.defaults.models;
    if (nextConfig.agents.defaults.model) {
      delete nextConfig.agents.defaults.model;
    }
  }

  await writeOpenClawConfig(slug, nextConfig);
}

export async function readProviderStatus(slug: string): Promise<ProviderStatus> {
  await ensureCustomerDirectories(slug);
  await migrateLegacyProviderEnvToAuthStore(slug);
  await syncOpenClawModelAllowlist(slug);

  const values = await readEnvFile(getCustomerProviderEnvPath(slug));
  const authStore = await readAuthProfileStore(slug);

  return {
    anthropic:
      hasProviderProfile(authStore, "anthropic") || Boolean(values.get(providerEnvMap.anthropic)),
    openai: hasProviderProfile(authStore, "openai") || Boolean(values.get(providerEnvMap.openai)),
    gemini: hasProviderProfile(authStore, "gemini") || Boolean(values.get(providerEnvMap.gemini)),
  };
}

export async function writeProviderKey(slug: string, provider: ProviderId, apiKey: string) {
  await ensureCustomerDirectories(slug);

  const trimmedApiKey = apiKey.trim();
  const authStore = await readAuthProfileStore(slug);
  authStore.profiles[getDefaultProfileId(provider)] = {
    type: "api_key",
    provider,
    key: trimmedApiKey,
  };
  await writeAuthProfileStore(slug, authStore);
  await syncOpenClawModelAllowlist(slug);

  const providerEnvPath = getCustomerProviderEnvPath(slug);
  const currentEnv = await readEnvFile(providerEnvPath);
  currentEnv.set(providerEnvMap[provider], trimmedApiKey);

  const envContent = `${Array.from(currentEnv.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")}\n`;

  await fs.writeFile(providerEnvPath, envContent, "utf8");
}

export async function readInstanceMetadata(slug: string) {
  const values = await readEnvFile(getCustomerInstanceEnvPath(slug));

  return {
    orderId: values.get("ORDER_ID") ?? null,
    slug: values.get("INSTANCE_SLUG") ?? slug,
    port: values.get("INSTANCE_PORT") ?? null,
    token: values.get("GATEWAY_TOKEN") ?? null,
    containerName: values.get("CONTAINER_NAME") ?? null,
    image: values.get("OPENCLAW_IMAGE") ?? null,
  };
}
