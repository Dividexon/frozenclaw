import { NextResponse } from "next/server";
import { resolveSessionAccessFromCookies } from "@/lib/auth";
import { getAppConfig } from "@/lib/env";
import { resolveSetupAccess } from "@/lib/login-links";
import { synthesizePiperSpeech } from "@/lib/tts";

type Body = {
  text?: string;
  slug?: string;
};

export const runtime = "nodejs";

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function canAccessSlug(slug: string, sessionAccess: Awaited<ReturnType<typeof resolveSessionAccessFromCookies>>) {
  return Boolean(sessionAccess?.instanceSlug && sessionAccess.instanceSlug === slug);
}

export async function POST(request: Request) {
  const config = getAppConfig();

  if (!config.piperEnabled) {
    return NextResponse.json(
      { error: "Die serverseitige Sprachausgabe ist aktuell nicht aktiviert." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const slug = body?.slug?.trim() ?? "";
  const text = cleanText(body?.text ?? "");

  if (!slug || !text) {
    return NextResponse.json({ error: "Text und Instanz-Slug sind erforderlich." }, { status: 400 });
  }

  if (text.length > config.piperMaxTextLength) {
    return NextResponse.json(
      { error: `Die Sprachausgabe ist aktuell auf ${config.piperMaxTextLength} Zeichen begrenzt.` },
      { status: 400 },
    );
  }

  const sessionAccess = await resolveSessionAccessFromCookies();
  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  const setupAccess = bearerToken ? resolveSetupAccess(slug, bearerToken) : null;

  if (!canAccessSlug(slug, sessionAccess) && !setupAccess) {
    return NextResponse.json({ error: "Kein Zugriff auf diese Instanz." }, { status: 403 });
  }

  try {
    const audio = await synthesizePiperSpeech(text);

    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Die Sprachausgabe konnte nicht erzeugt werden.",
      },
      { status: 500 },
    );
  }
}
