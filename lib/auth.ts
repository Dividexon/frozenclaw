import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb, logOrderEvent } from "@/lib/db";
import { buildAccessFromOrder, findLatestOrderByEmail, type AccountAccess } from "@/lib/login-links";

const SESSION_COOKIE_NAME = "fc_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildPasswordHash(password: string) {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

function verifyPasswordHash(password: string, storedHash: string) {
  const [algorithm, saltHex, hashHex] = storedHash.split("$");

  if (algorithm !== "scrypt" || !saltHex || !hashHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, salt, expected.length);

  return crypto.timingSafeEqual(actual, expected);
}

export function validatePassword(password: string) {
  if (password.length < 8) {
    return "Das Passwort muss mindestens 8 Zeichen lang sein.";
  }

  if (password.length > 128) {
    return "Das Passwort ist zu lang.";
  }

  return null;
}

export function hasPasswordForEmail(email: string | null) {
  if (!email) {
    return false;
  }

  const row = getDb()
    .prepare(
      `
        SELECT email
        FROM account_credentials
        WHERE lower(email) = lower(?)
        LIMIT 1
      `,
    )
    .get(normalizeEmail(email)) as { email: string } | undefined;

  return Boolean(row?.email);
}

export function setPasswordForEmail(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const validationError = validatePassword(password);

  if (validationError) {
    throw new Error(validationError);
  }

  const passwordHash = buildPasswordHash(password);
  const db = getDb();

  db.prepare(
    `
      INSERT INTO account_credentials (email, password_hash)
      VALUES (@email, @passwordHash)
      ON CONFLICT(email) DO UPDATE SET
        password_hash = excluded.password_hash,
        updated_at = datetime('now')
    `,
  ).run({
    email: normalizedEmail,
    passwordHash,
  });
}

export function authenticateWithPassword(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const row = getDb()
    .prepare(
      `
        SELECT email, password_hash
        FROM account_credentials
        WHERE lower(email) = lower(?)
        LIMIT 1
      `,
    )
    .get(normalizedEmail) as { email: string; password_hash: string } | undefined;

  if (!row || !verifyPasswordHash(password, row.password_hash)) {
    return null;
  }

  return row.email;
}

export function createPasswordSession(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  getDb()
    .prepare(
      `
        INSERT INTO auth_sessions (email, token_hash, expires_at)
        VALUES (@email, @tokenHash, @expiresAt)
      `,
    )
    .run({
      email: normalizedEmail,
      tokenHash,
      expiresAt,
    });

  return {
    token,
    expiresAt,
  };
}

export function revokePasswordSession(rawToken: string | null | undefined) {
  if (!rawToken) {
    return;
  }

  getDb()
    .prepare(
      `
        DELETE FROM auth_sessions
        WHERE token_hash = ?
      `,
    )
    .run(hashToken(rawToken));
}

export function resolvePasswordSession(rawToken: string | null | undefined): AccountAccess | null {
  if (!rawToken) {
    return null;
  }

  const row = getDb()
    .prepare(
      `
        SELECT email, expires_at
        FROM auth_sessions
        WHERE token_hash = ?
          AND expires_at >= datetime('now')
        LIMIT 1
      `,
    )
    .get(hashToken(rawToken)) as { email: string; expires_at: string } | undefined;

  if (!row) {
    return null;
  }

  const order = findLatestOrderByEmail(row.email);

  if (!order) {
    return null;
  }

  return buildAccessFromOrder(order, "password_session", row.expires_at);
}

export async function resolveSessionAccessFromCookies() {
  const cookieStore = await cookies();
  return resolvePasswordSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieMaxAge() {
  return SESSION_MAX_AGE_SECONDS;
}

export function logPasswordEvent(email: string, action: string) {
  const order = findLatestOrderByEmail(email);
  logOrderEvent(order?.id ?? null, action, {
    email: normalizeEmail(email),
  });
}
