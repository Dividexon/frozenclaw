import "server-only";

import crypto from "node:crypto";
import { getDb, logOrderEvent } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";
import { getManagedUsageSummary, type ManagedUsageSummary } from "@/lib/managed";
import { buildAgentUrl, buildSetupUrl } from "@/lib/provisioning";

export type LoginTarget = {
  id: number;
  email: string | null;
  plan: string;
  usage_mode: string;
  free_tier_locked: number;
  payment_status: string;
  instance_state: string;
  instance_slug: string | null;
  gateway_token: string | null;
  created_at: string;
  updated_at: string;
};

export type AccountAccess = {
  orderId: number;
  email: string | null;
  isAdmin: boolean;
  plan: string;
  usageMode: string;
  paymentStatus: string;
  instanceState: string;
  instanceSlug: string | null;
  activationUrl: string | null;
  agentUrl: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  authType: "login_link" | "password_session" | "setup_token";
  managed: ManagedUsageSummary | null;
  freeTierLocked: boolean;
};

export type ResolvedLoginToken = AccountAccess;

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
        free_tier_locked,
        payment_status,
        instance_state,
        instance_slug,
        gateway_token,
        created_at,
        updated_at
      FROM orders
      WHERE lower(email) = lower(?)
        AND (
          payment_status = 'paid'
          OR plan = 'trial'
        )
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

export function buildAccessFromOrder(
  row: LoginTarget,
  authType: "login_link" | "password_session" | "setup_token",
  expiresAt: string | null,
): AccountAccess {
  return {
    orderId: row.id,
    email: row.email,
    isAdmin: isAdminEmail(row.email),
    plan: row.plan,
    usageMode: row.usage_mode,
    freeTierLocked: Boolean(row.free_tier_locked),
    paymentStatus: row.payment_status,
    instanceState: row.instance_state,
    instanceSlug: row.instance_slug,
    activationUrl: buildSetupUrl(row.instance_slug, row.gateway_token),
    agentUrl: buildAgentUrl(row.instance_slug, row.gateway_token),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt,
    authType,
    managed: row.usage_mode === "managed" ? getManagedUsageSummary(row.id) : null,
  };
}

export function resolveLoginToken(rawToken: string): ResolvedLoginToken | null {
  const db = getDb();
  const tokenHash = hashToken(rawToken);

  const row = db
    .prepare(`
      SELECT
        o.id,
        o.email,
        o.plan,
        o.usage_mode,
        o.free_tier_locked,
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

  return buildAccessFromOrder(row, "login_link", row.expires_at);
}

export function resolveSetupAccess(slug: string, rawToken: string): AccountAccess | null {
  const row = getDb()
    .prepare(`
      SELECT
        id,
        email,
        plan,
        usage_mode,
        free_tier_locked,
        payment_status,
        instance_state,
        instance_slug,
        gateway_token,
        created_at,
        updated_at
      FROM orders
      WHERE instance_slug = ?
        AND gateway_token = ?
      LIMIT 1
    `)
    .get(slug, rawToken) as LoginTarget | undefined;

  if (!row) {
    return null;
  }

  return buildAccessFromOrder(row, "setup_token", null);
}
