import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getDb, logOrderEvent } from "@/lib/db";
import { getAppConfig } from "@/lib/env";

const execFileAsync = promisify(execFile);
const processingOrders = new Set<number>();
const reservedSlugs = new Set(["admin", "api", "assets", "static", "status", "webhook"]);

type ProvisionableOrder = {
  id: number;
  stripe_session_id: string;
  email: string | null;
  plan: string;
  usage_mode: string;
  payment_status: string;
  instance_state: string;
  instance_slug: string | null;
  instance_port: number | null;
  gateway_token: string | null;
};

declare global {
  var __frozenclawRuntimeStarted: boolean | undefined;
}

function formatSqliteDate(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function generateSlug() {
  return `fc-${crypto.randomBytes(5).toString("hex")}`;
}

function generateGatewayToken() {
  return crypto.randomBytes(18).toString("base64url");
}

function getActivationUrl(slug: string | null) {
  if (!slug) {
    return null;
  }

  const config = getAppConfig();

  if (!config.appBaseUrl) {
    return `${config.agentBasePath}/${slug}`;
  }

  return `${config.appBaseUrl}${config.agentBasePath}/${slug}`;
}

function getOrderById(orderId: number) {
  const db = getDb();

  return db
    .prepare(`
      SELECT
        id,
        stripe_session_id,
        email,
        plan,
        usage_mode,
        payment_status,
        instance_state,
        instance_slug,
        instance_port,
        gateway_token
      FROM orders
      WHERE id = ?
    `)
    .get(orderId) as ProvisionableOrder | undefined;
}

function pickNextPort() {
  const db = getDb();
  const config = getAppConfig();
  const rows = db
    .prepare(`
      SELECT instance_port
      FROM orders
      WHERE instance_port IS NOT NULL
      ORDER BY instance_port ASC
    `)
    .all() as Array<{ instance_port: number }>;
  const taken = new Set(rows.map((row) => row.instance_port));

  for (let port = config.provisioningPortStart; port <= config.provisioningPortEnd; port += 1) {
    if (!taken.has(port)) {
      return port;
    }
  }

  throw new Error("Kein freier Port mehr im konfigurierten Bereich verfügbar.");
}

function ensureIdentity(orderId: number) {
  const db = getDb();
  const existing = db
    .prepare(`
      SELECT instance_slug, instance_port, gateway_token
      FROM orders
      WHERE id = ?
    `)
    .get(orderId) as
    | {
        instance_slug: string | null;
        instance_port: number | null;
        gateway_token: string | null;
      }
    | undefined;

  if (!existing) {
    throw new Error("Bestellung für Provisionierung nicht gefunden.");
  }

  let slug = existing.instance_slug;

  if (!slug) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = generateSlug();

      if (reservedSlugs.has(candidate)) {
        continue;
      }

      const collision = db
        .prepare("SELECT 1 FROM orders WHERE instance_slug = ?")
        .get(candidate) as { 1: number } | undefined;

      if (!collision) {
        slug = candidate;
        break;
      }
    }
  }

  if (!slug) {
    throw new Error("Es konnte kein eindeutiger Slug erzeugt werden.");
  }

  const port = existing.instance_port ?? pickNextPort();
  const token = existing.gateway_token ?? generateGatewayToken();

  db.prepare(`
    UPDATE orders
    SET
      instance_slug = @slug,
      instance_port = @port,
      gateway_token = @token,
      updated_at = datetime('now')
    WHERE id = @orderId
  `).run({
    orderId,
    slug,
    port,
    token,
  });

  return { slug, port, token };
}

async function runMockProvisioning(order: ProvisionableOrder) {
  const identity = ensureIdentity(order.id);
  const customerDir = path.join(process.cwd(), "data", "customers", identity.slug);

  await fs.mkdir(customerDir, { recursive: true });
  await fs.writeFile(
    path.join(customerDir, "instance.json"),
    JSON.stringify(
      {
        orderId: order.id,
        email: order.email,
        plan: order.plan,
        usageMode: order.usage_mode,
        port: identity.port,
        activationUrl: getActivationUrl(identity.slug),
        createdAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );
}

async function runScriptProvisioning(order: ProvisionableOrder) {
  const config = getAppConfig();

  if (!config.provisioningScript) {
    throw new Error("PROVISIONING_SCRIPT fehlt für PROVISIONING_MODE=script.");
  }

  const identity = ensureIdentity(order.id);

  await execFileAsync(config.provisioningScript, [
    "--order-id",
    String(order.id),
    "--slug",
    identity.slug,
    "--port",
    String(identity.port),
    "--token",
    identity.token,
  ]);
}

async function runProvisioningDriver(order: ProvisionableOrder) {
  if (getAppConfig().provisioningMode === "script") {
    await runScriptProvisioning(order);
    return;
  }

  await runMockProvisioning(order);
}

function claimOrder(orderId: number) {
  const db = getDb();
  const staleBefore = formatSqliteDate(
    new Date(Date.now() - getAppConfig().staleProvisioningMinutes * 60_000)
  );

  return db
    .prepare(`
      UPDATE orders
      SET
        instance_state = 'provisioning',
        updated_at = datetime('now')
      WHERE id = @orderId
        AND payment_status = 'paid'
        AND (
          instance_state = 'pending'
          OR (instance_state = 'provisioning' AND updated_at < @staleBefore)
        )
    `)
    .run({ orderId, staleBefore }).changes;
}

function markReady(orderId: number) {
  getDb()
    .prepare(`
      UPDATE orders
      SET
        instance_state = 'ready',
        updated_at = datetime('now')
      WHERE id = ?
    `)
    .run(orderId);
}

function markFailed(orderId: number) {
  getDb()
    .prepare(`
      UPDATE orders
      SET
        instance_state = 'failed',
        updated_at = datetime('now')
      WHERE id = ?
    `)
    .run(orderId);
}

export async function provisionOrder(orderId: number) {
  if (processingOrders.has(orderId)) {
    return;
  }

  processingOrders.add(orderId);

  try {
    const initialOrder = getOrderById(orderId);

    if (!initialOrder || initialOrder.payment_status !== "paid") {
      return;
    }

    if (initialOrder.instance_state === "ready") {
      return;
    }

    const claimed = claimOrder(orderId);

    if (!claimed) {
      return;
    }

    logOrderEvent(orderId, "provisioning_started", {
      mode: getAppConfig().provisioningMode,
    });

    const claimedOrder = getOrderById(orderId);

    if (!claimedOrder) {
      throw new Error("Bestellung ist während der Provisionierung verschwunden.");
    }

    await runProvisioningDriver(claimedOrder);
    const readyOrder = getOrderById(orderId);

    markReady(orderId);
    logOrderEvent(orderId, "provisioning_ready", {
      activationUrl: getActivationUrl(readyOrder?.instance_slug ?? null),
      slug: readyOrder?.instance_slug ?? null,
      port: readyOrder?.instance_port ?? null,
    });
  } catch (error) {
    markFailed(orderId);
    logOrderEvent(orderId, "provisioning_failed", {
      message: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
  } finally {
    processingOrders.delete(orderId);
  }
}

export function queueProvisioning(orderId: number) {
  setImmediate(() => {
    void provisionOrder(orderId);
  });
}

export function startRuntimeRecovery() {
  if (global.__frozenclawRuntimeStarted) {
    return;
  }

  global.__frozenclawRuntimeStarted = true;

  const db = getDb();
  const staleBefore = formatSqliteDate(
    new Date(Date.now() - getAppConfig().staleProvisioningMinutes * 60_000)
  );
  const rows = db
    .prepare(`
      SELECT id
      FROM orders
      WHERE payment_status = 'paid'
        AND (
          instance_state = 'pending'
          OR (instance_state = 'provisioning' AND updated_at < ?)
        )
    `)
    .all(staleBefore) as Array<{ id: number }>;

  for (const row of rows) {
    queueProvisioning(row.id);
  }
}

export function buildActivationUrl(slug: string | null) {
  return getActivationUrl(slug);
}
