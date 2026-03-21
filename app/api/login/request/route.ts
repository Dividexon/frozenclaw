import { NextResponse } from "next/server";
import { getBaseUrlFromRequest } from "@/lib/env";
import { findLatestOrderByEmail, createLoginToken } from "@/lib/login-links";
import { isMailConfigured, sendLoginLinkMail } from "@/lib/mail";
import { startRuntimeRecovery } from "@/lib/provisioning";

type Body = {
  email?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  startRuntimeRecovery();

  const body = (await request.json().catch(() => ({}))) as Body;
  const email = body.email?.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Bitte eine gültige E-Mail-Adresse eingeben." }, { status: 400 });
  }

  if (!isMailConfigured()) {
    return NextResponse.json({ error: "Mailversand ist aktuell nicht aktiviert." }, { status: 503 });
  }

  const order = findLatestOrderByEmail(email);

  if (!order?.email) {
    return NextResponse.json({
      ok: true,
      message: "Wenn ein Zugang für diese E-Mail existiert, wurde ein Link verschickt.",
    });
  }

  const token = createLoginToken(order.id, order.email);
  const loginUrl = `${getBaseUrlFromRequest(request)}/konto?token=${encodeURIComponent(token)}`;

  await sendLoginLinkMail({
    to: order.email,
    loginUrl,
  });

  return NextResponse.json({
    ok: true,
    message: "Wenn ein Zugang für diese E-Mail existiert, wurde ein Link verschickt.",
  });
}
