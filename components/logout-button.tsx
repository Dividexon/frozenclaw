"use client";

import { useState } from "react";

type LogoutButtonProps = {
  className: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      await fetch("/api/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/anmelden";
    }
  }

  return (
    <button type="button" className={className} onClick={handleClick} disabled={isLoading}>
      {isLoading ? "Wird abgemeldet..." : "Abmelden"}
    </button>
  );
}
