"use client";

import { useState } from "react";

type BillingPortalButtonProps = {
  token: string;
  children: React.ReactNode;
  className: string;
};

export function BillingPortalButton({
  token,
  children,
  className,
}: BillingPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const payload = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Billing-Portal konnte nicht geöffnet werden.");
      }

      window.location.href = payload.url;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Billing-Portal konnte nicht geöffnet werden.";
      window.alert(message);
      setIsLoading(false);
    }
  }

  return (
    <button type="button" className={className} onClick={handleClick} disabled={isLoading}>
      {isLoading ? "Wird geöffnet..." : children}
    </button>
  );
}
