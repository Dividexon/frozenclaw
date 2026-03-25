import { NextResponse } from "next/server";
import { createTrialAccount } from "@/lib/trial";

export const runtime = "nodejs";

type RegisterPayload = {
  email?: string;
  password?: string;
  passwordConfirm?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as RegisterPayload | null;

  const email = payload?.email?.trim().toLowerCase() ?? "";
  const password = payload?.password ?? "";
  const passwordConfirm = payload?.passwordConfirm ?? "";

  if (!email || !password || !passwordConfirm) {
    return NextResponse.json(
      {
        error: "Bitte E-Mail-Adresse und Passwort vollständig eingeben.",
      },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      {
        error: "Bitte eine gültige E-Mail-Adresse eingeben.",
      },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      {
        error: "Das Passwort muss mindestens 8 Zeichen lang sein.",
      },
      { status: 400 },
    );
  }

  if (password !== passwordConfirm) {
    return NextResponse.json(
      {
        error: "Die Passwörter stimmen nicht überein.",
      },
      { status: 400 },
    );
  }

  try {
    const { session } = createTrialAccount(email, password);
    const response = NextResponse.json({
      redirectTo: "/konto",
    });
    response.cookies.set("fc_session", session.token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(session.expiresAt),
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Der Free Tier konnte nicht erstellt werden.",
      },
      { status: 400 },
    );
  }
}
