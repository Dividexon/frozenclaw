type UpgradePlanButtonProps = {
  planId: "hosted_byok" | "managed_starter" | "managed_immediate" | "managed_advanced";
  className: string;
  children: React.ReactNode;
};

export function UpgradePlanButton({ planId, className, children }: UpgradePlanButtonProps) {
  return (
    <a href={`/api/billing/upgrade?planId=${encodeURIComponent(planId)}`} className={className}>
      {children}
    </a>
  );
}
