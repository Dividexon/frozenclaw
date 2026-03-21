"use client";

import { useState } from "react";

type ProviderStatus = {
  anthropic: boolean;
  openai: boolean;
  gemini: boolean;
};

type SetupState = {
  slug: string;
  usageMode: string;
  instanceState: string;
  providerStatus: ProviderStatus;
  agentUrl: string | null;
} | null;

type SetupPanelProps = {
  slug: string;
  token: string;
  initialState: SetupState;
};

type SaveResponse = {
  ok: boolean;
  providerStatus: ProviderStatus;
  agentUrl: string | null;
};

export function SetupPanel({ slug, token, initialState }: SetupPanelProps) {
  const [provider, setProvider] = useState<"anthropic" | "openai" | "gemini">("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [state, setState] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyGatewayToken() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!apiKey.trim()) {
      setError("Bitte einen API-Key eintragen.");
      setSuccess(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/instances/${slug}/provider-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          provider,
          apiKey,
        }),
      });

      const payload = (await response.json()) as SaveResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Der API-Key konnte nicht gespeichert werden.");
      }

      setState((current) =>
        current
          ? {
              ...current,
              instanceState: "ready",
              providerStatus: payload.providerStatus,
              agentUrl: payload.agentUrl,
            }
          : current
      );
      setApiKey("");
      setSuccess(
        "API-Key gespeichert. Deine Instanz wurde neu gestartet. Du kannst OpenClaw jetzt öffnen."
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Der API-Key konnte nicht gespeichert werden."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="signal-row">
          <span className="signal-index">+</span>
          <span>{state ? `Instanzstatus: ${state.instanceState}` : "Status wird geladen"}</span>
        </div>
        <div className="signal-row">
          <span className="signal-index">+</span>
          <span>
            {state?.providerStatus.anthropic
              ? "Anthropic-Key vorhanden"
              : "Noch kein Anthropic-Key hinterlegt"}
          </span>
        </div>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
            Provider
          </span>
          <select
            className="rounded-none border border-[var(--fc-border)] bg-black/30 px-4 py-3 text-[var(--fc-text)]"
            value={provider}
            onChange={(event) =>
              setProvider(event.target.value as "anthropic" | "openai" | "gemini")
            }
          >
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
            API-Key
          </span>
          <input
            type="password"
            className="rounded-none border border-[var(--fc-border)] bg-black/30 px-4 py-3 text-[var(--fc-text)]"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-ant-..."
            autoComplete="off"
          />
          <span className="text-xs text-[var(--fc-text-muted)]">
            Für Anthropic bitte den echten Schlüssel einfügen, der mit <code>sk-ant-</code>{" "}
            beginnt. Keine URL und keinen Fehlertext.
          </span>
        </label>

        {success ? (
          <p className="rounded-none border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </p>
        ) : null}
        {error ? <p className="text-sm text-[var(--fc-accent)]">{error}</p> : null}

        <button type="submit" className="fc-button fc-button-primary" disabled={isSaving}>
          {isSaving ? "Wird gespeichert..." : "API-Key speichern und Instanz neu starten"}
        </button>
      </form>

      <div className="rounded-none border border-[var(--fc-border)] bg-black/20 p-5">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
          OpenClaw-Verbindung
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--fc-text-muted)]">
          OpenClaw verlangt beim ersten Browser-Zugriff den Gateway-Token manuell. Die
          WebSocket-URL lässt du unverändert. Das Passwort-Feld bleibt leer.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-[var(--fc-border)] bg-black/30 px-4 py-3">
          <code className="break-all text-sm text-[var(--fc-text)]">{token}</code>
          <button
            type="button"
            className="fc-button fc-button-secondary"
            onClick={copyGatewayToken}
          >
            {copied ? "Kopiert" : "Gateway-Token kopieren"}
          </button>
        </div>
        <ol className="mt-4 space-y-2 text-sm leading-7 text-[var(--fc-text-muted)]">
          <li>1. OpenClaw öffnen.</li>
          <li>2. WebSocket-URL unverändert lassen.</li>
          <li>3. Gateway-Token einfügen.</li>
          <li>4. Passwort leer lassen.</li>
          <li>5. Auf Verbinden klicken.</li>
        </ol>
      </div>

      {state?.agentUrl ? (
        <a
          href={state.agentUrl}
          className="fc-button fc-button-secondary"
          target="_blank"
          rel="noreferrer"
        >
          OpenClaw öffnen
        </a>
      ) : null}
    </div>
  );
}
