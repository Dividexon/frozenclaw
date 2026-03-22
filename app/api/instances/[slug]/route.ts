import { NextResponse } from "next/server";
import { hasPasswordForEmail } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getManagedUsageSummary } from "@/lib/managed";
import { readProviderStatus } from "@/lib/customer-instances";
import { buildAgentUrl, buildSetupUrl, startRuntimeRecovery } from "@/lib/provisioning";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function findOrderBySlug(slug: string) {
  return getDb()
    .prepare(`
      SELECT
      id,
      email,
      instance_slug,
      gateway_token,
      usage_mode,
      instance_state
      FROM orders
      WHERE instance_slug = ?
    `)
    .get(slug) as
    | {
        id: number;
        email: string | null;
        instance_slug: string;
        gateway_token: string | null;
        usage_mode: string;
        instance_state: string;
      }
    | undefined;
}

export async function GET(request: Request, context: RouteContext) {
  startRuntimeRecovery();

  const { slug } = await context.params;
  const token = new URL(request.url).searchParams.get("token");
  const order = findOrderBySlug(slug);

  if (!order) {
    return NextResponse.json({ error: "Instanz nicht gefunden." }, { status: 404 });
  }

  if (!token || token !== order.gateway_token) {
    return NextResponse.json({ error: "Ungültiger Zugriffstoken." }, { status: 403 });
  }

  const providerStatus = await readProviderStatus(slug);
  const managed =
    order.usage_mode === "managed" ? getManagedUsageSummary(order.id) : null;

  return NextResponse.json({
    slug,
    usageMode: order.usage_mode,
    instanceState: order.instance_state,
    providerStatus,
    managed,
    passwordConfigured: hasPasswordForEmail(order.email),
    setupUrl: buildSetupUrl(order.instance_slug, order.gateway_token),
    agentUrl: buildAgentUrl(order.instance_slug, order.gateway_token),
  });
}
