import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Die direkte Registrierung ohne Plan ist deaktiviert. Bitte wähle zuerst einen bezahlten Plan aus.",
    },
    { status: 410 },
  );
}
