import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "E-Mail-Links sind deaktiviert. Bitte melde dich mit E-Mail-Adresse und Passwort an oder registriere dich zuerst.",
    },
    { status: 410 },
  );
}
