import { NextResponse } from "next/server";
import { resolveSessionAccessFromCookies } from "@/lib/auth";
import { performFrozenclawTaskAction, type FrozenclawTaskAction } from "@/lib/frozenclaw-ui";
import { startRuntimeRecovery } from "@/lib/provisioning";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  startRuntimeRecovery();

  const access = await resolveSessionAccessFromCookies();

  if (!access) {
    return NextResponse.json({ error: "Sitzung abgelaufen." }, { status: 401 });
  }

  const { taskId } = await context.params;
  const payload = (await request.json()) as {
    action?: FrozenclawTaskAction;
    sessionId?: string | null;
  };

  try {
    const snapshot = await performFrozenclawTaskAction(
      access,
      taskId,
      payload.action ?? "run",
      payload.sessionId ?? null,
    );
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Die Aufgabenaktion konnte nicht ausgefuehrt werden.",
      },
      { status: 400 },
    );
  }
}
