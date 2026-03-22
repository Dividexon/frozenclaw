"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingLink, setIsRequestingLink] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Bitte E-Mail-Adresse und Passwort eingeben.");
      setMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

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

  async function handleRequestLink() {
    if (!email.trim()) {
      setError("Bitte zuerst deine E-Mail-Adresse eingeben.");
      setMessage(null);
      return;
    }

    setIsRequestingLink(true);
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
        throw new Error(payload.error ?? "Der Login-Link konnte nicht angefordert werden.");
      }

      setMessage(
        payload.message ??
          "Wenn ein Zugang für diese E-Mail existiert, wurde ein Link verschickt.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Der Login-Link konnte nicht angefordert werden.",
      );
    } finally {
      setIsRequestingLink(false);
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

        {message ? <p className="text-sm text-[var(--fc-text)]">{message}</p> : null}
        {error ? <p className="text-sm text-[var(--fc-accent)]">{error}</p> : null}

        <button type="submit" className="fc-button fc-button-primary" disabled={isSubmitting}>
          {isSubmitting ? "Wird angemeldet..." : "Anmelden"}
        </button>
      </form>

      <div className="border border-[var(--fc-border)] bg-black/20 p-4">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
          Passwort noch nicht gesetzt?
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--fc-text-muted)]">
          Nutze einmalig deinen Zugangslink oder fordere einen E-Mail-Link an. Über die
          Zugangsseite kannst du danach direkt ein Passwort für künftige Logins festlegen.
        </p>
        <div className="mt-4">
          <button
            type="button"
            className="fc-button fc-button-secondary"
            onClick={handleRequestLink}
            disabled={isRequestingLink}
          >
            {isRequestingLink ? "Wird gesendet..." : "E-Mail-Link anfordern"}
          </button>
        </div>
      </div>
    </div>
  );
}
