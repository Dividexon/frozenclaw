"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Bitte E-Mail-Adresse und Passwort eingeben.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/login/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as { redirectTo?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Anmeldung konnte nicht gestartet werden.");
      }

      window.location.href = payload.redirectTo ?? "/konto";
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Anmeldung konnte nicht gestartet werden.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form className="grid gap-4" onSubmit={handlePasswordLogin}>
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
            placeholder="Dein Passwort"
            autoComplete="current-password"
          />
        </label>

        {error ? <p className="text-sm text-[var(--fc-accent)]">{error}</p> : null}

        <button type="submit" className="fc-button fc-button-primary" disabled={isSubmitting}>
          {isSubmitting ? "Wird angemeldet..." : "Anmelden"}
        </button>
      </form>

      <div className="border border-[var(--fc-border)] bg-black/20 p-4">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">Hinweis</p>
        <p className="mt-3 text-sm leading-7 text-[var(--fc-text-muted)]">
          Magic Links sind deaktiviert. Bestehende Konten melden sich ausschließlich mit
          E-Mail-Adresse und Passwort an.
        </p>
      </div>
    </div>
  );
}
