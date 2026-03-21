import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { getAppConfig } from "@/lib/env";

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

export async function ensureCustomerDirectories(slug: string) {
  await fs.mkdir(getCustomerDir(slug), { recursive: true });
  await fs.mkdir(getCustomerConfigDir(slug), { recursive: true });
  await fs.mkdir(getCustomerWorkspaceDir(slug), { recursive: true });
}

export async function readProviderStatus(slug: string): Promise<ProviderStatus> {
  const values = await readEnvFile(getCustomerProviderEnvPath(slug));

  return {
    anthropic: Boolean(values.get(providerEnvMap.anthropic)),
    openai: Boolean(values.get(providerEnvMap.openai)),
    gemini: Boolean(values.get(providerEnvMap.gemini)),
  };
}

export async function writeProviderKey(slug: string, provider: ProviderId, apiKey: string) {
  await ensureCustomerDirectories(slug);

  const filePath = getCustomerProviderEnvPath(slug);
  const current = await readEnvFile(filePath);
  current.set(providerEnvMap[provider], apiKey.trim());

  const content = `${Array.from(current.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")}\n`;

  await fs.writeFile(filePath, content, "utf8");
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
