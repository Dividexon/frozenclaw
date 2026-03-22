import type { ReactNode } from "react";

type CheckoutButtonProps = {
  planId: "hosted_byok" | "managed_starter" | "managed_immediate" | "managed_advanced";
  children: ReactNode;
  className: string;
};

export function CheckoutButton({ planId, children, className }: CheckoutButtonProps) {
  return (
    <a href={`/api/checkout?planId=${encodeURIComponent(planId)}`} className={className}>
      {children}
    </a>
  );
}
