export type UsageMode = "byok" | "managed";

export type PlanId = "hosted_byok" | "managed_beta";

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
  topUps?: TopUpPackage[];
};

export const plans: Record<PlanId, PlanDefinition> = {
  hosted_byok: {
    id: "hosted_byok",
    name: "Hosted BYOK",
    description: "Deine gehostete OpenClaw-Instanz mit eigenem Modell-Key.",
    usageMode: "byok",
    amountCents: 1900,
    active: true,
  },
  managed_beta: {
    id: "managed_beta",
    name: "Managed Beta",
    description:
      "Begrenzter Pilot mit GPT-5.2, automatischem Verbrauchstracking und zubuchbaren Tokenpaketen.",
    usageMode: "managed",
    amountCents: 3900,
    active: false,
    managedProvider: "openai",
    managedModel: "openai/gpt-5.2",
    includedStandardTokens: 3_000_000,
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
