import { NextResponse } from "next/server";
import { getDb, logOrderEvent } from "@/lib/db";
import { recordManagedUsage } from "@/lib/managed";
import { startRuntimeRecovery } from "@/lib/provisioning";

export const runtime = "nodejs";

type Body = {
  slug?: string;
  usageKey?: string;
  provider?: string;
  model?: string;
  source?: string;
  usage?: {
    input?: number;
    output?: number;
    total?: number;
  };
};

export async function POST(request: Request) {
  startRuntimeRecovery();

  const authHeader = request.headers.get("authorization")?.trim() ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  const body = (await request.json().catch(() => ({}))) as Body;

  if (!token || !body.slug || !body.usageKey || !body.provider || !body.model || !body.usage) {
    return NextResponse.json({ error: "Managed-Usage-Payload ist unvollständig." }, { status: 400 });
  }

  const order = getDb()
    .prepare(`
      SELECT id, usage_mode
      FROM orders
      WHERE instance_slug = ?
        AND managed_tracking_token = ?
      LIMIT 1
    `)
    .get(body.slug, token) as
    | {
        id: number;
        usage_mode: string;
      }
    | undefined;

  if (!order) {
    return NextResponse.json({ error: "Managed-Usage-Token ist ungültig." }, { status: 403 });
  }

  if (order.usage_mode !== "managed") {
    return NextResponse.json({ error: "Nur Managed-Instanzen dürfen Usage melden." }, { status: 409 });
  }

  const inputTokens = Number.isFinite(body.usage.input) ? Math.max(0, Math.round(body.usage.input ?? 0)) : 0;
  const outputTokens = Number.isFinite(body.usage.output) ? Math.max(0, Math.round(body.usage.output ?? 0)) : 0;
  const totalTokens = Number.isFinite(body.usage.total)
    ? Math.max(0, Math.round(body.usage.total ?? 0))
    : inputTokens + outputTokens;

  const recorded = recordManagedUsage({
    usageKey: `${order.id}:${body.usageKey}`,
    orderId: order.id,
    provider: body.provider,
    model: body.model,
    source: body.source ?? "llm_output",
    inputTokens,
    outputTokens,
    totalTokens,
  });

  logOrderEvent(order.id, "managed_usage_recorded", {
    usageKey: body.usageKey,
    provider: body.provider,
    model: body.model,
    inputTokens,
    outputTokens,
    totalTokens,
    costTotalMicros: recorded.costTotalMicros,
    standardTokensCharged: recorded.standardTokensCharged,
  });

  return NextResponse.json({ ok: true });
}
