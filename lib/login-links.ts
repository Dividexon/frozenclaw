import "server-only";

import crypto from "node:crypto";
import { getDb, logOrderEvent } from "@/lib/db";
import { getManagedUsageSummary } from "@/lib/managed";
import { buildAgentUrl, buildSetupUrl } from "@/lib/provisioning";

type LoginTarget = {
  id: number;
  email: string | null;
  plan: string;
  usage_mode: string;
  payment_status: string;
  instance_state: string;
  instance_slug: string | null;
  gateway_token: string | null;
  created_at: string;
  updated_at: string;
};

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function findLatestOrderByEmail(email: string) {
  return getDb()
    .prepare(`
      SELECT
        id,
        email,
        plan,
        usage_mode,
        payment_status,
        instance_state,
        instance_slug,
        gateway_token,
        created_at,
        updated_at
      FROM orders
      WHERE lower(email) = lower(?)
        AND payment_status = 'paid'
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    `)
    .get(email) as LoginTarget | undefined;
}

export function createLoginToken(orderId: number, email: string) {
  const token = crypto.randomBytes(24).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString().slice(0, 19).replace("T", " ");
  const db = getDb();

  db.prepare(`
    INSERT INTO login_tokens (order_id, email, token_hash, expires_at)
    VALUES (@orderId, @email, @tokenHash, @expiresAt)
  `).run({
    orderId,
    email,
    tokenHash,
    expiresAt,
  });

  logOrderEvent(orderId, "login_link_created", {
    email,
    expiresAt,
  });

  return token;
}

export function resolveLoginToken(rawToken: string) {
  const db = getDb();
  const tokenHash = hashToken(rawToken);

  const row = db
    .prepare(`
      SELECT
        o.id,
        o.email,
        o.plan,
        o.usage_mode,
        o.payment_status,
        o.instance_state,
        o.instance_slug,
        o.gateway_token,
        o.created_at,
        o.updated_at,
        lt.expires_at
      FROM login_tokens lt
      INNER JOIN orders o ON o.id = lt.order_id
      WHERE lt.token_hash = ?
        AND lt.expires_at >= datetime('now')
      LIMIT 1
    `)
    .get(tokenHash) as (LoginTarget & { expires_at: string }) | undefined;

  if (!row) {
    return null;
  }

  return {
    orderId: row.id,
    email: row.email,
    plan: row.plan,
    usageMode: row.usage_mode,
    paymentStatus: row.payment_status,
    instanceState: row.instance_state,
    instanceSlug: row.instance_slug,
    activationUrl: buildSetupUrl(row.instance_slug, row.gateway_token),
    agentUrl: buildAgentUrl(row.instance_slug, row.gateway_token),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    managed: row.usage_mode === "managed" ? getManagedUsageSummary(row.id) : null,
  };
}
