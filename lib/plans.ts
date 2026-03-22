export type UsageMode = "byok" | "managed";

export type PlanId =
  | "trial"
  | "hosted_byok"
  | "managed_starter"
  | "managed_immediate"
  | "managed_advanced";

export type TopUpPackage = {
  id: string;
  label: string;
  standardTokens: number;
  amountCents: number;
};

export type PlanDefinition = {
  id: PlanId;
  name: string;
  description: string;
  usageMode: UsageMode;
  amountCents: number;
  active: boolean;
  managedProvider?: "openai";
  managedModel?: string;
  includedStandardTokens?: number;
  includedBudgetCents?: number;
  topUps?: TopUpPackage[];
};

export const plans: Record<PlanId, PlanDefinition> = {
  trial: {
    id: "trial",
    name: "Interner Altzugang",
    description: "Interner Altzugang für bestehende Testkonten.",
    usageMode: "managed",
    amountCents: 0,
    active: false,
    managedProvider: "openai",
    managedModel: "openai/gpt-5.2",
    includedStandardTokens: 100_000,
    includedBudgetCents: 50,
  },
  hosted_byok: {
    id: "hosted_byok",
    name: "Hosted BYOK",
    description: "Deine gehostete OpenClaw-Instanz mit eigenem Modell-Key.",
    usageMode: "byok",
    amountCents: 1900,
    active: true,
  },
  managed_starter: {
    id: "managed_starter",
    name: "Managed Starter",
    description:
      "Einstieg in Managed mit GPT-5.2, automatischem Verbrauchstracking und zubuchbaren Tokenpaketen.",
    usageMode: "managed",
    amountCents: 990,
    active: true,
    managedProvider: "openai",
    managedModel: "openai/gpt-5.2",
    includedStandardTokens: 500_000,
    includedBudgetCents: 250,
    topUps: [
      {
        id: "managed_topup_1m",
        label: "1 Mio. Standard-Tokens",
        standardTokens: 1_000_000,
        amountCents: 900,
      },
      {
        id: "managed_topup_2_5m",
        label: "2,5 Mio. Standard-Tokens",
        standardTokens: 2_500_000,
        amountCents: 1900,
      },
    ],
  },
  managed_immediate: {
    id: "managed_immediate",
    name: "Managed Plus",
    description:
      "Managed mit GPT-5.2, klarem Monatskontingent und zubuchbaren Tokenpaketen.",
    usageMode: "managed",
    amountCents: 3900,
    active: true,
    managedProvider: "openai",
    managedModel: "openai/gpt-5.2",
    includedStandardTokens: 3_000_000,
    includedBudgetCents: 1500,
    topUps: [
      {
        id: "managed_topup_1m",
        label: "1 Mio. Standard-Tokens",
        standardTokens: 1_000_000,
        amountCents: 900,
      },
      {
        id: "managed_topup_2_5m",
        label: "2,5 Mio. Standard-Tokens",
        standardTokens: 2_500_000,
        amountCents: 1900,
      },
    ],
  },
  managed_advanced: {
    id: "managed_advanced",
    name: "Managed Advanced",
    description:
      "Managed mit GPT-5.2, größerem Monatskontingent und zubuchbaren Tokenpaketen.",
    usageMode: "managed",
    amountCents: 5900,
    active: true,
    managedProvider: "openai",
    managedModel: "openai/gpt-5.2",
    includedStandardTokens: 5_000_000,
    includedBudgetCents: 2500,
    topUps: [
      {
        id: "managed_topup_1m",
        label: "1 Mio. Standard-Tokens",
        standardTokens: 1_000_000,
        amountCents: 900,
      },
      {
        id: "managed_topup_2_5m",
        label: "2,5 Mio. Standard-Tokens",
        standardTokens: 2_500_000,
        amountCents: 1900,
      },
    ],
  },
};

export function isPlanId(value: string): value is PlanId {
  return value in plans;
}
