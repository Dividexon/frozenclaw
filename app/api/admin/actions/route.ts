import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { resolveSessionAccessFromCookies } from "@/lib/auth";
import { getDb, logOrderEvent } from "@/lib/db";
import { getBaseUrlFromRequest } from "@/lib/env";
import { queueProvisioning, restartProvisionedInstance } from "@/lib/provisioning";

export const runtime = "nodejs";

function buildRedirectUrl(request: Request, key: "adminMessage" | "adminError", value: string) {
  const target = new URL("/admin", getBaseUrlFromRequest(request));
  target.searchParams.set(key, value);
  return target;
}

function findOrder(orderId: number) {
  return getDb()
    .prepare(
      `
        SELECT id, email, instance_slug, usage_mode
        FROM orders
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(orderId) as
    | {
        id: number;
        email: string | null;
        instance_slug: string | null;
        usage_mode: string;
      }
    | undefined;
}

export async function POST(request: Request) {
  const access = await resolveSessionAccessFromCookies();

  if (!access?.isAdmin) {
    return NextResponse.json({ error: "Nur für Admin-Konten verfügbar." }, { status: 403 });
  }

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const orderId = Number.parseInt(String(formData.get("orderId") ?? ""), 10);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return NextResponse.redirect(
      buildRedirectUrl(request, "adminError", "Ungültige Bestellung."),
      { status: 303 },
    );
  }

  const order = findOrder(orderId);

  if (!order) {
    return NextResponse.redirect(
      buildRedirectUrl(request, "adminError", "Bestellung nicht gefunden."),
      { status: 303 },
    );
  }

  try {
    if (action === "restart_instance") {
      if (!order.instance_slug) {
        throw new Error("Für diese Bestellung existiert noch keine Instanz.");
      }

      await restartProvisionedInstance(order.instance_slug);
      logOrderEvent(order.id, "admin_instance_restart_requested", {
        adminEmail: access.email,
        slug: order.instance_slug,
      });

      return NextResponse.redirect(
        buildRedirectUrl(request, "adminMessage", `Instanz ${order.instance_slug} wurde neu gestartet.`),
        { status: 303 },
      );
    }

    if (action === "reprovision_instance") {
      getDb()
        .prepare(
          `
            UPDATE orders
            SET
              instance_state = 'pending',
              updated_at = datetime('now')
            WHERE id = ?
          `,
        )
        .run(order.id);

      queueProvisioning(order.id);
      logOrderEvent(order.id, "admin_reprovision_requested", {
        adminEmail: access.email,
        slug: order.instance_slug,
      });

      return NextResponse.redirect(
        buildRedirectUrl(
          request,
          "adminMessage",
          `Provisionierung für Bestellung ${order.id} wurde erneut angestoßen.`,
        ),
        { status: 303 },
      );
    }

    if (action === "rotate_gateway_token") {
      const newToken = crypto.randomBytes(18).toString("base64url");

      getDb()
        .prepare(
          `
            UPDATE orders
            SET
              gateway_token = @token,
              instance_state = 'pending',
              updated_at = datetime('now')
            WHERE id = @orderId
          `,
        )
        .run({
          orderId: order.id,
          token: newToken,
        });

      queueProvisioning(order.id);
      logOrderEvent(order.id, "admin_gateway_token_rotated", {
        adminEmail: access.email,
        slug: order.instance_slug,
      });

      return NextResponse.redirect(
        buildRedirectUrl(request, "adminMessage", `Gateway-Token für Bestellung ${order.id} wurde rotiert.`),
        { status: 303 },
      );
    }

    return NextResponse.redirect(
      buildRedirectUrl(request, "adminError", "Unbekannte Admin-Aktion."),
      { status: 303 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin-Aktion fehlgeschlagen.";

    return NextResponse.redirect(buildRedirectUrl(request, "adminError", message), {
      status: 303,
    });
  }
}
