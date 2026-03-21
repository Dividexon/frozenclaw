"use client";

import { useState } from "react";

type ProviderStatus = {
  anthropic: boolean;
  openai: boolean;
  gemini: boolean;
};

type ManagedState = {
  provider: string;
  model: string;
  includedStandardTokens: number;
  topUpStandardTokens: number;
  usedStandardTokens: number;
  remainingStandardTokens: number;
  includedBudgetCents: number;
  topUpBudgetCents: number;
  usedCostMicros: number;
  managedApiKeyConfigured: boolean;
};

type SetupState = {
  slug: string;
  usageMode: string;
  instanceState: string;
  providerStatus: ProviderStatus;
  managed: ManagedState | null;
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

const providerMeta = {
  anthropic: {
    label: "Anthropic",
    placeholder: "sk-ant-...",
    hint: "Anthropic-Keys beginnen in der Regel mit sk-ant-.",
    models: [
      "claude-opus-4-6",
      "claude-sonnet-4-6",
      "claude-sonnet-4-5",
      "claude-haiku-3-5",
    ],
  },
  openai: {
    label: "OpenAI",
    placeholder: "sk-...",
    hint: "OpenAI-Keys beginnen in der Regel mit sk- oder sk-proj-.",
    models: ["gpt-5.2", "gpt-5.1", "gpt-4.1", "gpt-4o"],
  },
  gemini: {
    label: "Gemini",
    placeholder: "AIza...",
    hint: "Gemini schaltet die freigegebenen Gemini-Modelle in OpenClaw frei.",
    models: ["gemini-3-pro", "gemini-3-flash", "gemini-2.5-pro", "gemini-2.5-flash"],
  },
} as const;

function formatStandardTokens(value: number) {
  return new Intl.NumberFormat("de-DE").format(value);
}

export function SetupPanel({ slug, token, initialState }: SetupPanelProps) {
  const [provider, setProvider] = useState<"anthropic" | "openai" | "gemini">("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [state, setState] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const activeProviders = (Object.keys(providerMeta) as Array<keyof typeof providerMeta>).filter(
    (providerKey) => Boolean(state?.providerStatus[providerKey]),
  );
  const selectedProviderMeta = providerMeta[provider];
  const isManaged = state?.usageMode === "managed";

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
          : current,
      );
      setApiKey("");
      setSuccess(
        "API-Key gespeichert. Deine Instanz wurde neu gestartet. Du kannst OpenClaw jetzt öffnen.",
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Der API-Key konnte nicht gespeichert werden.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="signal-row">
          <span className="signal-index">+</span>
          <span>{state ? `Instanzstatus: ${state.instanceState}` : "Status wird geladen"}</span>
        </div>
        <div className="signal-row">
          <span className="signal-index">+</span>
          <span>
            {isManaged
              ? "Managed-Betrieb aktiv"
              : activeProviders.length > 0
                ? `${activeProviders.length} Provider aktiv`
                : "Noch kein Provider aktiv"}
          </span>
        </div>
        <div className="signal-row">
          <span className="signal-index">+</span>
          <span>
            {isManaged
              ? `${formatStandardTokens(state?.managed?.remainingStandardTokens ?? 0)} Tokens frei`
              : activeProviders.length > 1
                ? "Multi-Provider-Modus aktiv"
                : "Ein Provider aktiv"}
          </span>
        </div>
        <div className="signal-row">
          <span className="signal-index">+</span>
          <span>
            {isManaged
              ? state?.managed?.model ?? "openai/gpt-5.2"
              : activeProviders.length > 0
                ? `${activeProviders.map((providerKey) => providerMeta[providerKey].label).join(", ")}`
                : "Modelle werden nach dem ersten Key freigeschaltet"}
          </span>
        </div>
      </div>

      {isManaged ? (
        <div className="grid gap-4 border border-[var(--fc-border)] bg-black/20 p-5">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
            Managed-Konfiguration
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>{state?.managed?.model ?? "openai/gpt-5.2"}</span>
            </div>
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>
                {formatStandardTokens(state?.managed?.remainingStandardTokens ?? 0)} Standard-Tokens
                verbleibend
              </span>
            </div>
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>
                {formatStandardTokens(state?.managed?.includedStandardTokens ?? 0)} inklusive Tokens
              </span>
            </div>
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>
                {formatStandardTokens(state?.managed?.topUpStandardTokens ?? 0)} Tokens nachgebucht
              </span>
            </div>
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>
                {state?.managed?.managedApiKeyConfigured
                  ? "Betreiber-Key ist serverseitig gesetzt"
                  : "Betreiber-Key fehlt noch serverseitig"}
              </span>
            </div>
          </div>
          <p className="text-sm leading-7 text-[var(--fc-text-muted)]">
            Für Managed-Instanzen wird kein eigener API-Key hinterlegt. Frozenclaw stellt den
            Modellzugang zentral bereit und rechnet den Verbrauch gegen dein Tokenkontingent.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(providerMeta) as Array<keyof typeof providerMeta>).map((providerKey) => {
              const meta = providerMeta[providerKey];
              const isActive = Boolean(state?.providerStatus[providerKey]);

              return (
                <article
                  key={providerKey}
                  className={`border px-5 py-5 ${
                    isActive
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-[var(--fc-border)] bg-black/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                      {meta.label}
                    </p>
                    <span
                      className={`text-xs uppercase tracking-[0.18em] ${
                        isActive ? "text-emerald-200" : "text-[var(--fc-text-muted)]"
                      }`}
                    >
                      {isActive ? "Aktiv" : "Nicht hinterlegt"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--fc-text-muted)]">{meta.hint}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {meta.models.map((model) => (
                      <span
                        key={model}
                        className="border border-[var(--fc-border)] bg-black/30 px-3 py-1 text-xs text-[var(--fc-text-muted)]"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
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
                placeholder={selectedProviderMeta.placeholder}
                autoComplete="off"
              />
              <span className="text-xs text-[var(--fc-text-muted)]">
                {selectedProviderMeta.hint} Keine URL und keinen Fehlertext einfügen.
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
        </>
      )}

      <div className="rounded-none border border-[var(--fc-border)] bg-black/20 p-5">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
          {isManaged ? "Aktives Modell" : "Aktive Provider und Modelle"}
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--fc-text-muted)]">
          {isManaged
            ? "Managed nutzt ein festes Modell mit zentralem Betreiber-Zugang. Nachbuchungen werden später gegen dasselbe Modell gerechnet."
            : "Hinterlegte Provider bleiben parallel aktiv. In OpenClaw kannst du danach zwischen den freigeschalteten Modellen wechseln, ohne den Schlüssel jedes Mal neu einzutragen."}
        </p>
        {isManaged && state?.managed ? (
          <div className="mt-4 border border-[var(--fc-border)] bg-black/30 px-4 py-4">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text)]">
              {state.managed.provider}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="border border-[var(--fc-border)] bg-black/30 px-3 py-1 text-xs text-[var(--fc-text-muted)]">
                {state.managed.model}
              </span>
            </div>
          </div>
        ) : activeProviders.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {activeProviders.map((providerKey) => (
              <div
                key={providerKey}
                className="border border-[var(--fc-border)] bg-black/30 px-4 py-4"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text)]">
                  {providerMeta[providerKey].label}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {providerMeta[providerKey].models.map((model) => (
                    <span
                      key={model}
                      className="border border-[var(--fc-border)] bg-black/30 px-3 py-1 text-xs text-[var(--fc-text-muted)]"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--fc-text-muted)]">
            Noch kein Provider aktiv. Hinterlege zuerst einen API-Key, damit OpenClaw passende
            Modelle freischalten kann.
          </p>
        )}
      </div>

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
          <li>5. Verbinden.</li>
        </ol>
        {state?.agentUrl ? (
          <div className="mt-6">
            <a href={state.agentUrl} className="fc-button fc-button-primary" target="_blank">
              OpenClaw öffnen
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
