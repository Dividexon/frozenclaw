"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Bitte eine E-Mail-Adresse eingeben.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/login/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Anmeldung konnte nicht gestartet werden.");
      }

      setMessage(payload.message ?? "Wenn ein Zugang für diese E-Mail existiert, wurde ein Link verschickt.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Anmeldung konnte nicht gestartet werden."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
          E-Mail-Adresse
        </span>
        <input
          type="email"
          className="rounded-none border border-[var(--fc-border)] bg-black/30 px-4 py-3 text-[var(--fc-text)]"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="dein.name@beispiel.de"
          autoComplete="email"
        />
      </label>

      {message ? <p className="text-sm text-[var(--fc-text)]">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--fc-accent)]">{error}</p> : null}

      <button type="submit" className="fc-button fc-button-primary" disabled={isSubmitting}>
        {isSubmitting ? "Wird gesendet..." : "Login-Link anfordern"}
      </button>
    </form>
  );
}
