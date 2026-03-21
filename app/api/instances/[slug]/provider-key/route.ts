import { NextResponse } from "next/server";
import { getDb, logOrderEvent } from "@/lib/db";
import {
  type ProviderId,
  readProviderStatus,
  writeProviderKey,
} from "@/lib/customer-instances";
import { buildAgentUrl, restartProvisionedInstance, startRuntimeRecovery } from "@/lib/provisioning";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type Body = {
  token?: string;
  provider?: ProviderId;
  apiKey?: string;
};

function isProviderId(value: string | undefined): value is ProviderId {
  return value === "anthropic" || value === "openai" || value === "gemini";
}

function validateProviderKey(provider: ProviderId, apiKey: string) {
  const trimmed = apiKey.trim();

  if (!trimmed) {
    return "Bitte einen API-Key eintragen.";
  }

  if (/\s/.test(trimmed)) {
    return "Der API-Key darf keine Leerzeichen oder Zeilenumbrüche enthalten.";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return "Bitte die echte API-Key-Zeichenfolge eintragen, nicht eine URL.";
  }

  if (
    trimmed.includes("Agent failed before reply") ||
    trimmed.includes("No API key found for provider") ||
    trimmed.includes("Logs: openclaw logs --follow")
  ) {
    return "Es wurde ein Fehlertext statt eines echten API-Keys eingefügt.";
  }

  if (provider === "anthropic" && !trimmed.startsWith("sk-ant-")) {
    return "Anthropic-Keys beginnen in der Regel mit `sk-ant-`.";
  }

  if (provider === "openai" && !trimmed.startsWith("sk-")) {
    return "OpenAI-Keys beginnen in der Regel mit `sk-`.";
  }

  if (provider === "gemini" && trimmed.length < 20) {
    return "Der Gemini-Key sieht unvollständig aus.";
  }

  return null;
}

export async function POST(request: Request, context: RouteContext) {
  startRuntimeRecovery();

  const { slug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Body;
  const token = body.token?.trim();
  const apiKey = body.apiKey?.trim();

  if (!token || !apiKey || !isProviderId(body.provider)) {
    return NextResponse.json({ error: "Provider, Token oder API-Key fehlt." }, { status: 400 });
  }

  const validationError = validateProviderKey(body.provider, apiKey);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const order = getDb()
    .prepare(`
      SELECT id, gateway_token, instance_slug, usage_mode
      FROM orders
      WHERE instance_slug = ?
    `)
    .get(slug) as
    | {
        id: number;
        gateway_token: string | null;
        instance_slug: string;
        usage_mode: string;
      }
    | undefined;

  if (!order) {
    return NextResponse.json({ error: "Instanz nicht gefunden." }, { status: 404 });
  }

  if (token !== order.gateway_token) {
    return NextResponse.json({ error: "Ungültiger Zugriffstoken." }, { status: 403 });
  }

  if (order.usage_mode === "managed") {
    return NextResponse.json(
      {
        error:
          "Managed-Instanzen verwenden den zentralen Betreiber-Zugang und keinen eigenen API-Key.",
      },
      { status: 409 },
    );
  }

  await writeProviderKey(slug, body.provider, apiKey);
  await restartProvisionedInstance(slug);

  const providerStatus = await readProviderStatus(slug);

  logOrderEvent(order.id, "provider_key_updated", {
    provider: body.provider,
  });

  return NextResponse.json({
    ok: true,
    providerStatus,
    agentUrl: buildAgentUrl(order.instance_slug, order.gateway_token),
  });
}
