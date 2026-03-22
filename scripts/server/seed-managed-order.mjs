#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

function parseArgs(argv) {
  const args = {
    email: "",
    slug: "",
    plan: "managed_advanced",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--email") {
      args.email = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (value === "--slug") {
      args.slug = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (value === "--plan") {
      args.plan = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    throw new Error(`Unbekanntes Argument: ${value}`);
  }

  if (!args.email.trim()) {
    throw new Error("Bitte --email <adresse> angeben.");
  }

  return {
    email: args.email.trim(),
    slug: args.slug.trim(),
    plan: args.plan.trim() || "managed_advanced",
  };
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function formatSqliteDate(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildSetupUrl(baseUrl, slug, token) {
  if (!slug || !token) {
    return null;
  }

  return `${baseUrl}/zugang/${slug}?token=${encodeURIComponent(token)}`;
}

function buildAgentUrl(baseUrl, slug, token) {
  if (!slug) {
    return null;
  }

  const fragment = token ? `#token=${encodeURIComponent(token)}` : "";
  return `${baseUrl}/agent/${slug}/${fragment}`;
}

function buildLoginUrl(baseUrl, token) {
  return `${baseUrl}/konto?token=${encodeURIComponent(token)}`;
}

function printLine(label, value) {
  process.stdout.write(`${label}: ${value}\n`);
}

const args = parseArgs(process.argv.slice(2));
loadEnvFile("/etc/frozenclaw/frozenclaw.env");
loadEnvFile(path.join(process.cwd(), ".env.local"));

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "frozenclaw.db");
const appBaseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
const managedPlans = {
  managed_starter: {
    name: "Managed Starter",
    includedStandardTokens: 500_000,
    includedBudgetCents: 250,
  },
  managed_advanced: {
    name: "Managed Advanced",
    includedStandardTokens: 5_000_000,
    includedBudgetCents: 2500,
  },
};
const managedProvider = "openai";
const managedModel = "openai/gpt-5.2";
const selectedPlan = managedPlans[args.plan] || managedPlans.managed_advanced;
const includedStandardTokens = selectedPlan.includedStandardTokens;
const includedBudgetCents = selectedPlan.includedBudgetCents;
const managedApiKeyConfigured = Boolean(process.env.OPENAI_MANAGED_API_KEY);

if (!fs.existsSync(dbFile)) {
  throw new Error(`Datenbank nicht gefunden: ${dbFile}`);
}

const db = new Database(dbFile);
const now = formatSqliteDate(new Date());
const sessionId = `managed-seed-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const order = args.slug
  ? db
      .prepare(`
        SELECT id, email, instance_slug, gateway_token
        FROM orders
        WHERE instance_slug = ?
        LIMIT 1
      `)
      .get(args.slug)
  : db
      .prepare(`
        SELECT id, email, instance_slug, gateway_token
        FROM orders
        WHERE lower(email) = lower(?)
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
      `)
      .get(args.email);

let orderId;
let instanceSlug = null;
let gatewayToken = null;
let action;

if (order) {
  orderId = order.id;
  instanceSlug = order.instance_slug;
  gatewayToken = order.gateway_token;
  action = "managed_seed_updated";

  db.prepare(`
    UPDATE orders
    SET
      email = @email,
      plan = @plan,
      usage_mode = 'managed',
      payment_status = 'paid',
      instance_state = 'pending',
      managed_provider = @managedProvider,
      managed_model = @managedModel,
      included_standard_tokens = @includedStandardTokens,
      included_budget_cents = @includedBudgetCents,
      managed_tracking_token = NULL,
      updated_at = @updatedAt
    WHERE id = @orderId
  `).run({
    orderId,
    email: args.email,
    plan: args.plan,
    managedProvider,
    managedModel,
    includedStandardTokens,
    includedBudgetCents,
    updatedAt: now,
  });
} else {
  action = "managed_seed_created";

  const result = db.prepare(`
    INSERT INTO orders (
      stripe_session_id,
      email,
      plan,
      usage_mode,
      payment_status,
      instance_state,
      managed_provider,
      managed_model,
      included_standard_tokens,
      included_budget_cents,
      created_at,
      updated_at
    )
    VALUES (
      @sessionId,
      @email,
      @plan,
      'managed',
      'paid',
      'pending',
      @managedProvider,
      @managedModel,
      @includedStandardTokens,
      @includedBudgetCents,
      @createdAt,
      @updatedAt
    )
  `).run({
    sessionId,
    email: args.email,
    plan: args.plan,
    managedProvider,
    managedModel,
    includedStandardTokens,
    includedBudgetCents,
    createdAt: now,
    updatedAt: now,
  });

  orderId = Number(result.lastInsertRowid);
}

db.prepare(`
  INSERT INTO event_log (order_id, action, details, created_at)
  VALUES (?, ?, ?, ?)
`).run(
  orderId,
  action,
  JSON.stringify({
    email: args.email,
    managedProvider,
    managedModel,
    includedStandardTokens,
  }),
  now,
);

const loginToken = crypto.randomBytes(24).toString("base64url");
const loginTokenHash = hashToken(loginToken);
const expiresAt = formatSqliteDate(new Date(Date.now() + 30 * 60_000));

db.prepare(`
  INSERT INTO login_tokens (order_id, email, token_hash, expires_at, created_at)
  VALUES (?, ?, ?, ?, ?)
`).run(orderId, args.email, loginTokenHash, expiresAt, now);

printLine("Order", orderId);
printLine("E-Mail", args.email);
printLine("Plan", selectedPlan.name);
printLine("Modus", "managed");
printLine("Modell", managedModel);
printLine("Inklusive Tokens", includedStandardTokens.toLocaleString("de-DE"));
printLine("Managed-Key gesetzt", managedApiKeyConfigured ? "ja" : "nein");
printLine("Login-Link", buildLoginUrl(appBaseUrl, loginToken));

if (instanceSlug && gatewayToken) {
  printLine("Setup-Link", buildSetupUrl(appBaseUrl, instanceSlug, gatewayToken));
  printLine("OpenClaw", buildAgentUrl(appBaseUrl, instanceSlug, gatewayToken));
}

process.stdout.write(
  "Hinweis: Die App greift pending-Auftraege automatisch auf. Die Bereitstellung startet in der Regel innerhalb von 30 Sekunden.\n",
);
