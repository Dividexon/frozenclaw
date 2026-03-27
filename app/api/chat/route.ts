import { NextResponse } from "next/server";
import { resolveSessionAccessFromCookies } from "@/lib/auth";
import { buildFrozenclawWorkspace, sendFrozenclawMessage } from "@/lib/frozenclaw-ui";
import { startRuntimeRecovery } from "@/lib/provisioning";

export const runtime = "nodejs";

export async function GET(request: Request) {
  startRuntimeRecovery();

  const access = await resolveSessionAccessFromCookies();

  if (!access) {
    return NextResponse.json({ error: "Sitzung abgelaufen." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const snapshot = await buildFrozenclawWorkspace(access, sessionId);

    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Der Chat konnte nicht geladen werden.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  startRuntimeRecovery();

  const access = await resolveSessionAccessFromCookies();

  if (!access) {
    return NextResponse.json({ error: "Sitzung abgelaufen." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    message?: string;
    sessionId?: string | null;
  };

  try {
    const snapshot = await sendFrozenclawMessage(
      access,
      payload.message ?? "",
      payload.sessionId ?? null,
    );
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Die Nachricht konnte nicht gesendet werden.",
      },
      { status: 400 },
    );
  }
}
