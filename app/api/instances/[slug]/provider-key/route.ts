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

export async function POST(request: Request, context: RouteContext) {
  startRuntimeRecovery();

  const { slug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Body;
  const token = body.token?.trim();
  const apiKey = body.apiKey?.trim();

  if (!token || !apiKey || !isProviderId(body.provider)) {
    return NextResponse.json({ error: "Provider, Token oder API-Key fehlt." }, { status: 400 });
  }

  const order = getDb()
    .prepare(`
      SELECT id, gateway_token, instance_slug
      FROM orders
      WHERE instance_slug = ?
    `)
    .get(slug) as
    | {
        id: number;
        gateway_token: string | null;
        instance_slug: string;
      }
    | undefined;

  if (!order) {
    return NextResponse.json({ error: "Instanz nicht gefunden." }, { status: 404 });
  }

  if (token !== order.gateway_token) {
    return NextResponse.json({ error: "Ungültiger Zugriffstoken." }, { status: 403 });
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
