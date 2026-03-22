import { NextResponse } from "next/server";
import {
  createPasswordSession,
  getSessionCookieMaxAge,
  getSessionCookieName,
  hasPasswordForEmail,
  setPasswordForEmail,
} from "@/lib/auth";
import { getDb, logOrderEvent } from "@/lib/db";
import { startRuntimeRecovery } from "@/lib/provisioning";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type Body = {
  token?: string;
  password?: string;
  passwordConfirm?: string;
};

export async function POST(request: Request, context: RouteContext) {
  startRuntimeRecovery();

  const { slug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Body;
  const token = body.token?.trim();
  const password = body.password ?? "";
  const passwordConfirm = body.passwordConfirm ?? "";

  if (!token || !password || !passwordConfirm) {
    return NextResponse.json(
      { error: "Token, Passwort oder Passwortbestätigung fehlen." },
      { status: 400 },
    );
  }

  if (password !== passwordConfirm) {
    return NextResponse.json(
      { error: "Die beiden Passwörter stimmen nicht überein." },
      { status: 400 },
    );
  }

  const order = getDb()
    .prepare(
      `
        SELECT id, email, gateway_token
        FROM orders
        WHERE instance_slug = ?
        LIMIT 1
      `,
    )
    .get(slug) as
    | {
        id: number;
        email: string | null;
        gateway_token: string | null;
      }
    | undefined;

  if (!order) {
    return NextResponse.json({ error: "Instanz nicht gefunden." }, { status: 404 });
  }

  if (token !== order.gateway_token) {
    return NextResponse.json({ error: "Ungültiger Zugriffstoken." }, { status: 403 });
  }

  if (!order.email) {
    return NextResponse.json(
      { error: "Für diese Instanz ist keine E-Mail-Adresse hinterlegt." },
      { status: 409 },
    );
  }

  const hadPassword = hasPasswordForEmail(order.email);

  try {
    setPasswordForEmail(order.email, password);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Das Passwort konnte nicht gespeichert werden.",
      },
      { status: 400 },
    );
  }

  const session = createPasswordSession(order.email);
  const response = NextResponse.json({
    ok: true,
    passwordConfigured: true,
    message: hadPassword
      ? "Passwort aktualisiert. Du bist jetzt mit dieser Sitzung angemeldet."
      : "Passwort gespeichert. Du bist jetzt mit dieser Sitzung angemeldet.",
  });

  response.cookies.set(getSessionCookieName(), session.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: getSessionCookieMaxAge(),
  });

  logOrderEvent(order.id, hadPassword ? "password_updated" : "password_created", {
    email: order.email,
  });

  return response;
}
