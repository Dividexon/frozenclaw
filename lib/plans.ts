export type UsageMode = "byok" | "managed";

export type PlanId = "hosted_byok" | "managed_beta";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  description: string;
  usageMode: UsageMode;
  amountCents: number;
  active: boolean;
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
      "Begrenzter Pilot mit von uns gestelltem Modell-Key. Erst nach aktivem Usage-Tracking.",
    usageMode: "managed",
    amountCents: 3900,
    active: false,
  },
};

export function isPlanId(value: string): value is PlanId {
  return value in plans;
}
