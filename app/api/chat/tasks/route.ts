import { NextResponse } from "next/server";
import { resolveSessionAccessFromCookies } from "@/lib/auth";
import { createFrozenclawTask } from "@/lib/frozenclaw-ui";
import { startRuntimeRecovery } from "@/lib/provisioning";

export const runtime = "nodejs";

export async function POST(request: Request) {
  startRuntimeRecovery();

  const access = await resolveSessionAccessFromCookies();

  if (!access) {
    return NextResponse.json({ error: "Sitzung abgelaufen." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    name?: string;
    message?: string;
    scheduleMode?: "every" | "cron";
    every?: string | null;
    cron?: string | null;
    enabled?: boolean;
    sessionId?: string | null;
  };

  try {
    const snapshot = await createFrozenclawTask(access, {
      name: payload.name ?? "",
      message: payload.message ?? "",
      scheduleMode: payload.scheduleMode === "cron" ? "cron" : "every",
      every: payload.every ?? null,
      cron: payload.cron ?? null,
      enabled: payload.enabled !== false,
    }, payload.sessionId ?? null);

    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Die Aufgabe konnte nicht erstellt werden.",
      },
      { status: 400 },
    );
  }
}
