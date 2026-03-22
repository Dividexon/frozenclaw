import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getAppConfig } from "@/lib/env";

type DbInstance = Database.Database;

declare global {
  var __frozenclawDb: DbInstance | undefined;
}

function migrate(db: DbInstance) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stripe_event_id TEXT UNIQUE,
      stripe_session_id TEXT UNIQUE NOT NULL,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      stripe_subscription_status TEXT,
      email TEXT,
      plan TEXT NOT NULL,
      usage_mode TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'checkout_created',
      instance_slug TEXT UNIQUE,
      instance_port INTEGER UNIQUE,
      instance_state TEXT NOT NULL DEFAULT 'pending',
      gateway_token TEXT,
      managed_tracking_token TEXT,
      checkout_url TEXT,
      managed_provider TEXT,
      managed_model TEXT,
      included_standard_tokens INTEGER NOT NULL DEFAULT 0,
      included_budget_cents INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS usage_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      source TEXT NOT NULL,
      usage_key TEXT UNIQUE,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      credits_charged INTEGER NOT NULL DEFAULT 0,
      standard_tokens_charged INTEGER NOT NULL DEFAULT 0,
      cost_input_micros INTEGER NOT NULL DEFAULT 0,
      cost_output_micros INTEGER NOT NULL DEFAULT 0,
      cost_total_micros INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS topup_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      package_id TEXT NOT NULL,
      standard_tokens INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'paid',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS login_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
    CREATE INDEX IF NOT EXISTS idx_orders_instance_state ON orders(instance_state);
    CREATE INDEX IF NOT EXISTS idx_usage_events_order_id ON usage_events(order_id);
    CREATE INDEX IF NOT EXISTS idx_topup_purchases_order_id ON topup_purchases(order_id);
    CREATE INDEX IF NOT EXISTS idx_login_tokens_order_id ON login_tokens(order_id);
    CREATE INDEX IF NOT EXISTS idx_login_tokens_email ON login_tokens(email);
  `);

  const orderColumns = db.prepare("PRAGMA table_info(orders)").all() as Array<{ name: string }>;
  const usageColumns = db
    .prepare("PRAGMA table_info(usage_events)")
    .all() as Array<{ name: string }>;
  const orderColumnSet = new Set(orderColumns.map((column) => column.name));
  const usageColumnSet = new Set(usageColumns.map((column) => column.name));

  if (!orderColumnSet.has("managed_provider")) {
    db.exec("ALTER TABLE orders ADD COLUMN managed_provider TEXT");
  }

  if (!orderColumnSet.has("stripe_customer_id")) {
    db.exec("ALTER TABLE orders ADD COLUMN stripe_customer_id TEXT");
  }

  if (!orderColumnSet.has("stripe_subscription_id")) {
    db.exec("ALTER TABLE orders ADD COLUMN stripe_subscription_id TEXT");
  }

  if (!orderColumnSet.has("stripe_subscription_status")) {
    db.exec("ALTER TABLE orders ADD COLUMN stripe_subscription_status TEXT");
  }

  if (!orderColumnSet.has("managed_tracking_token")) {
    db.exec("ALTER TABLE orders ADD COLUMN managed_tracking_token TEXT");
  }

  if (!orderColumnSet.has("managed_model")) {
    db.exec("ALTER TABLE orders ADD COLUMN managed_model TEXT");
  }

  if (!orderColumnSet.has("included_standard_tokens")) {
    db.exec("ALTER TABLE orders ADD COLUMN included_standard_tokens INTEGER NOT NULL DEFAULT 0");
  }

  if (!orderColumnSet.has("included_budget_cents")) {
    db.exec("ALTER TABLE orders ADD COLUMN included_budget_cents INTEGER NOT NULL DEFAULT 0");
  }

  if (!usageColumnSet.has("standard_tokens_charged")) {
    db.exec(
      "ALTER TABLE usage_events ADD COLUMN standard_tokens_charged INTEGER NOT NULL DEFAULT 0"
    );
  }

  if (!usageColumnSet.has("cost_input_micros")) {
    db.exec("ALTER TABLE usage_events ADD COLUMN cost_input_micros INTEGER NOT NULL DEFAULT 0");
  }

  if (!usageColumnSet.has("cost_output_micros")) {
    db.exec("ALTER TABLE usage_events ADD COLUMN cost_output_micros INTEGER NOT NULL DEFAULT 0");
  }

  if (!usageColumnSet.has("cost_total_micros")) {
    db.exec("ALTER TABLE usage_events ADD COLUMN cost_total_micros INTEGER NOT NULL DEFAULT 0");
  }

  if (!usageColumnSet.has("usage_key")) {
    db.exec("ALTER TABLE usage_events ADD COLUMN usage_key TEXT");
  }

  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_events_usage_key ON usage_events(usage_key)");
}

export function getDb() {
  if (!global.__frozenclawDb) {
    const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
    const dbFile = path.join(dataDir, "frozenclaw.db");
    getAppConfig();
    fs.mkdirSync(dataDir, { recursive: true });
    global.__frozenclawDb = new Database(dbFile);
    migrate(global.__frozenclawDb);
  }

  return global.__frozenclawDb;
}

export function logOrderEvent(orderId: number | null, action: string, details?: unknown) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO event_log (order_id, action, details)
    VALUES (@orderId, @action, @details)
  `);

  insert.run({
    orderId,
    action,
    details: details ? JSON.stringify(details) : null,
  });
}
