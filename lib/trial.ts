import "server-only";

import crypto from "node:crypto";
import { createPasswordSession, hasPasswordForEmail, setPasswordForEmail } from "@/lib/auth";
import { getDb, logOrderEvent } from "@/lib/db";
import { buildManagedOrderSeed } from "@/lib/managed";
import { queueProvisioning } from "@/lib/provisioning";

function generateTrialSessionId() {
  return `trial-${crypto.randomBytes(12).toString("hex")}`;
}

export function createTrialAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const managedSeed = buildManagedOrderSeed("trial");
  const stripeSessionId = generateTrialSessionId();
  const db = getDb();

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
          included_budget_cents
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
          @includedBudgetCents
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
  });

  queueProvisioning(orderId);

  return {
    orderId,
    session,
  };
}
