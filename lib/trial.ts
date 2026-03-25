import "server-only";

import crypto from "node:crypto";
import { createPasswordSession, hasPasswordForEmail, setPasswordForEmail } from "@/lib/auth";
import { getDb, logOrderEvent } from "@/lib/db";
import { getAppConfig } from "@/lib/env";
import { buildManagedOrderSeed } from "@/lib/managed";
import { queueProvisioning } from "@/lib/provisioning";

function generateTrialSessionId() {
  return `trial-${crypto.randomBytes(12).toString("hex")}`;
}

export type FreeTierAvailability = {
  currentAccounts: number;
  accountLimit: number;
  remainingAccounts: number;
  isAvailable: boolean;
};

export function getFreeTierAvailability(): FreeTierAvailability {
  const accountLimit = getAppConfig().freeTierAccountLimit;
  const row = getDb()
    .prepare(
      `
        SELECT COUNT(DISTINCT id) AS count
        FROM (
          SELECT id
          FROM orders
          WHERE plan = 'trial'
          UNION
          SELECT o.id
          FROM orders o
          INNER JOIN event_log e ON e.order_id = o.id
          WHERE e.action = 'trial_registered'
        ) AS free_accounts
      `,
    )
    .get() as { count: number | null };
  const currentAccounts = Number(row?.count ?? 0);
  const remainingAccounts = Math.max(0, accountLimit - currentAccounts);

  return {
    currentAccounts,
    accountLimit,
    remainingAccounts,
    isAvailable: accountLimit > 0 && remainingAccounts > 0,
  };
}

function hasClaimedFreeTierForEmail(email: string) {
  const row = getDb()
    .prepare(
      `
        SELECT 1
        FROM orders o
        WHERE lower(o.email) = lower(?)
          AND (
            o.plan = 'trial'
            OR EXISTS (
              SELECT 1
              FROM event_log e
              WHERE e.order_id = o.id
                AND e.action = 'trial_registered'
            )
          )
        LIMIT 1
      `,
    )
    .get(email) as { 1: number } | undefined;

  return Boolean(row);
}

export function createTrialAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const managedSeed = buildManagedOrderSeed("trial");
  const stripeSessionId = generateTrialSessionId();
  const db = getDb();
  const availability = getFreeTierAvailability();

  if (!availability.isAvailable) {
    throw new Error(
      "Der Free Tier ist aktuell ausgeschöpft. Bitte wähle direkt einen bezahlten Plan.",
    );
  }

  if (hasClaimedFreeTierForEmail(normalizedEmail)) {
    throw new Error(
      "Für diese E-Mail-Adresse wurde der Free Tier bereits genutzt. Bitte melde dich an oder wähle einen Plan.",
    );
  }

  const existing = db
    .prepare(
      `
        SELECT id
        FROM orders
        WHERE lower(email) = lower(?)
          AND payment_status = 'paid'
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
      `,
    )
    .get(normalizedEmail) as { id: number } | undefined;

  if (existing || hasPasswordForEmail(normalizedEmail)) {
    throw new Error("Für diese E-Mail-Adresse existiert bereits ein Konto. Bitte melde dich an.");
  }

  const result = db
    .prepare(
      `
        INSERT INTO orders (
          stripe_session_id,
          email,
          plan,
          usage_mode,
          payment_status,
          managed_provider,
          managed_model,
          included_standard_tokens,
          included_budget_cents,
          free_tier_locked
        )
        VALUES (
          @stripeSessionId,
          @email,
          'trial',
          'managed',
          'paid',
          @managedProvider,
          @managedModel,
          @includedStandardTokens,
          @includedBudgetCents,
          0
        )
      `,
    )
    .run({
      stripeSessionId,
      email: normalizedEmail,
      managedProvider: managedSeed.managedProvider,
      managedModel: managedSeed.managedModel,
      includedStandardTokens: managedSeed.includedStandardTokens,
      includedBudgetCents: managedSeed.includedBudgetCents,
    });

  const orderId = Number(result.lastInsertRowid);

  setPasswordForEmail(normalizedEmail, password);
  const session = createPasswordSession(normalizedEmail);

  logOrderEvent(orderId, "trial_registered", {
    email: normalizedEmail,
    managedModel: managedSeed.managedModel,
    includedStandardTokens: managedSeed.includedStandardTokens,
    freeTierAccountLimit: availability.accountLimit,
  });

  queueProvisioning(orderId);

  return {
    orderId,
    session,
  };
}
