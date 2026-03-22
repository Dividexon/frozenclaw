import { NextResponse } from "next/server";
import {
  authenticateWithPassword,
  createPasswordSession,
  getSessionCookieMaxAge,
  getSessionCookieName,
  logPasswordEvent,
} from "@/lib/auth";
import { startRuntimeRecovery } from "@/lib/provisioning";

type Body = {
  email?: string;
  password?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  startRuntimeRecovery();

  const body = (await request.json().catch(() => ({}))) as Body;
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !email.includes("@") || !password) {
    return NextResponse.json(
      { error: "Bitte E-Mail-Adresse und Passwort eingeben." },
      { status: 400 },
    );
  }

  const authenticatedEmail = authenticateWithPassword(email, password);

  if (!authenticatedEmail) {
    return NextResponse.json(
      { error: "E-Mail-Adresse oder Passwort sind nicht korrekt." },
      { status: 403 },
    );
  }

  const session = createPasswordSession(authenticatedEmail);
  const response = NextResponse.json({
    ok: true,
    redirectTo: "/konto",
  });

  response.cookies.set(getSessionCookieName(), session.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: getSessionCookieMaxAge(),
  });

  logPasswordEvent(authenticatedEmail, "password_login_succeeded");

  return response;
}
