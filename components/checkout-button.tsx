"use client";

import { useState } from "react";

type CheckoutButtonProps = {
  planId: "hosted_byok" | "managed_starter" | "managed_immediate" | "managed_advanced";
  children: React.ReactNode;
  className: string;
};

export function CheckoutButton({ planId, children, className }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const payload = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Checkout konnte nicht gestartet werden.");
      }

      window.location.href = payload.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout konnte nicht gestartet werden.";
      window.alert(message);
      setIsLoading(false);
    }
  }

  return (
    <button type="button" className={className} onClick={handleClick} disabled={isLoading}>
      {isLoading ? "Wird geladen..." : children}
    </button>
  );
}
