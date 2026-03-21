import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAppConfig } from "@/lib/env";
import { startRuntimeRecovery } from "@/lib/provisioning";

export const runtime = "nodejs";

export async function GET() {
  startRuntimeRecovery();

  const db = getDb();
  const orderCount = db.prepare("SELECT COUNT(*) AS count FROM orders").get() as { count: number };
  const config = getAppConfig();

  return NextResponse.json({
    ok: true,
    provisioningMode: config.provisioningMode,
    staleProvisioningMinutes: config.staleProvisioningMinutes,
    orders: orderCount.count,
    timestamp: new Date().toISOString(),
  });
}
