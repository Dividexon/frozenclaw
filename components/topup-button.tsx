"use client";

import { useState } from "react";

type TopUpButtonProps = {
  packageId: string;
  className: string;
  children: React.ReactNode;
};

export function TopUpButton({ packageId, className, children }: TopUpButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/billing/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packageId }),
      });

      const payload = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Nachbuchung konnte nicht gestartet werden.");
      }

      window.location.href = payload.url;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nachbuchung konnte nicht gestartet werden.";
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
