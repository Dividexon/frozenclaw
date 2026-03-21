import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const db = getDb();

  const order = db
    .prepare(`
      SELECT
        stripe_session_id,
        email,
        plan,
        usage_mode,
        payment_status,
        instance_state,
        instance_slug,
        created_at,
        updated_at
      FROM orders
      WHERE stripe_session_id = ?
    `)
    .get(sessionId) as
    | {
        stripe_session_id: string;
        email: string | null;
        plan: string;
        usage_mode: string;
        payment_status: string;
        instance_state: string;
        instance_slug: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!order) {
    return NextResponse.json({ error: "Bestellung nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({
    sessionId: order.stripe_session_id,
    email: order.email,
    plan: order.plan,
    usageMode: order.usage_mode,
    paymentStatus: order.payment_status,
    instanceState: order.instance_state,
    instanceSlug: order.instance_slug,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  });
}
