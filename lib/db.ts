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
      email TEXT,
      plan TEXT NOT NULL,
      usage_mode TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'checkout_created',
      instance_slug TEXT UNIQUE,
      instance_port INTEGER UNIQUE,
      instance_state TEXT NOT NULL DEFAULT 'pending',
      gateway_token TEXT,
      checkout_url TEXT,
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
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      credits_charged INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
    CREATE INDEX IF NOT EXISTS idx_orders_instance_state ON orders(instance_state);
    CREATE INDEX IF NOT EXISTS idx_usage_events_order_id ON usage_events(order_id);
  `);
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
