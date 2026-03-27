import { NextResponse } from "next/server";
import {
  createSessionForEmail,
  getSessionCookieMaxAge,
  getSessionCookieName,
  logPasswordEvent,
} from "@/lib/auth";
import { getBaseUrlFromRequest } from "@/lib/env";
import { resolveSetupAccess } from "@/lib/login-links";
import { startRuntimeRecovery } from "@/lib/provisioning";

export const runtime = "nodejs";

export async function GET(request: Request) {
  startRuntimeRecovery();
  const baseUrl = getBaseUrlFromRequest(request);

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";
  const next = searchParams.get("next")?.trim() ?? "/konto";
  const redirectTarget = next.startsWith("/") ? next : "/konto";

  if (!slug || !token) {
    return NextResponse.redirect(new URL("/anmelden", baseUrl));
  }

  const access = resolveSetupAccess(slug, token);

  if (!access?.email) {
    return NextResponse.redirect(new URL("/anmelden", baseUrl));
  }

  const session = createSessionForEmail(access.email);
  const response = NextResponse.redirect(new URL(redirectTarget, baseUrl));

  response.cookies.set(getSessionCookieName(), session.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: getSessionCookieMaxAge(),
  });

  logPasswordEvent(access.email, "setup_session_created");

  return response;
}
