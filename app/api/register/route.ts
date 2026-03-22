import { NextResponse } from "next/server";
import {
  getSessionCookieMaxAge,
  getSessionCookieName,
  validatePassword,
} from "@/lib/auth";
import { startRuntimeRecovery } from "@/lib/provisioning";
import { createTrialAccount } from "@/lib/trial";

type Body = {
  email?: string;
  password?: string;
  passwordConfirm?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  startRuntimeRecovery();

  const body = (await request.json().catch(() => ({}))) as Body;
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const passwordConfirm = body.passwordConfirm ?? "";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Bitte eine gültige E-Mail-Adresse eingeben." },
      { status: 400 },
    );
  }

  const passwordError = validatePassword(password);

  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  if (password !== passwordConfirm) {
    return NextResponse.json(
      { error: "Die beiden Passwörter stimmen nicht überein." },
      { status: 400 },
    );
  }

  try {
    const trial = createTrialAccount(email, password);
    const response = NextResponse.json({
      ok: true,
      redirectTo: "/konto",
    });

    response.cookies.set(getSessionCookieName(), trial.session.token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: getSessionCookieMaxAge(),
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Der Testzugang konnte nicht erstellt werden.",
      },
      { status: 409 },
    );
  }
}
