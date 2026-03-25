"use client";

import { useState } from "react";

export function RegisterForm({
  disabled = false,
  disabledReason,
}: {
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) {
      setError(disabledReason ?? "Der Free Tier ist aktuell nicht verfügbar.");
      return;
    }

    if (!email.trim() || !password || !passwordConfirm) {
      setError("Bitte E-Mail-Adresse und Passwort vollständig eingeben.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          passwordConfirm,
        }),
      });

      const payload = (await response.json()) as { redirectTo?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Der Testzugang konnte nicht erstellt werden.");
      }

      window.location.href = payload.redirectTo ?? "/konto";
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Der Testzugang konnte nicht erstellt werden.",
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

      <label className="grid gap-2">
        <span className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
          Passwort
        </span>
        <input
          type="password"
          className="rounded-none border border-[var(--fc-border)] bg-black/30 px-4 py-3 text-[var(--fc-text)]"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mindestens 8 Zeichen"
          autoComplete="new-password"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
          Passwort wiederholen
        </span>
        <input
          type="password"
          className="rounded-none border border-[var(--fc-border)] bg-black/30 px-4 py-3 text-[var(--fc-text)]"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          placeholder="Passwort bestätigen"
          autoComplete="new-password"
        />
      </label>

      {error ? <p className="text-sm text-[var(--fc-accent)]">{error}</p> : null}

      {disabledReason ? (
        <p className="text-sm text-[var(--fc-text-muted)]">{disabledReason}</p>
      ) : null}

      <button
        type="submit"
        className="fc-button fc-button-primary"
        disabled={isSubmitting || disabled}
      >
        {disabled ? "Free Tier aktuell voll" : isSubmitting ? "Konto wird erstellt..." : "Konto erstellen"}
      </button>
    </form>
  );
}
