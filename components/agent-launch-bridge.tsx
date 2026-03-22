"use client";

import { useEffect, useMemo } from "react";

const SETTINGS_KEY = "openclaw.control.settings.v1";
const LEGACY_TOKEN_SESSION_KEY = "openclaw.control.token.v1";
const TOKEN_SESSION_KEY_PREFIX = "openclaw.control.token.v1:";

function normalizeGatewayTokenScope(gatewayUrl: string) {
  const trimmed = gatewayUrl.trim();

  if (!trimmed) {
    return "default";
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    const pathname =
      parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "") || parsed.pathname;
    return `${parsed.protocol}//${parsed.host}${pathname}`;
  } catch {
    return trimmed;
  }
}

function tokenSessionKeyForGateway(gatewayUrl: string) {
  return `${TOKEN_SESSION_KEY_PREFIX}${normalizeGatewayTokenScope(gatewayUrl)}`;
}

type AgentLaunchBridgeProps = {
  slug: string;
  token: string | null;
};

export function AgentLaunchBridge({ slug, token }: AgentLaunchBridgeProps) {
  const targetPath = useMemo(() => `/agent/${slug}/`, [slug]);
  const missingToken = !token;

  useEffect(() => {
    if (!token) {
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const gatewayUrl = `${protocol}//${window.location.host}${targetPath}`;
      const tokenKey = tokenSessionKeyForGateway(gatewayUrl);

      try {
        for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
          const key = window.sessionStorage.key(index);
          if (!key) {
            continue;
          }
          if (key === LEGACY_TOKEN_SESSION_KEY || key.startsWith(TOKEN_SESSION_KEY_PREFIX)) {
            window.sessionStorage.removeItem(key);
          }
        }
      } catch {
        // best effort
      }

      window.sessionStorage.removeItem(LEGACY_TOKEN_SESSION_KEY);
      window.sessionStorage.setItem(tokenKey, token.trim());

      try {
        const rawSettings = window.localStorage.getItem(SETTINGS_KEY);
        const parsedSettings =
          rawSettings && rawSettings.trim().startsWith("{")
            ? (JSON.parse(rawSettings) as Record<string, unknown>)
            : {};

        const nextSettings = {
          ...parsedSettings,
          gatewayUrl,
          sessionKey:
            typeof parsedSettings.sessionKey === "string" && parsedSettings.sessionKey.trim()
              ? parsedSettings.sessionKey
              : "main",
          lastActiveSessionKey:
            typeof parsedSettings.lastActiveSessionKey === "string" &&
            parsedSettings.lastActiveSessionKey.trim()
              ? parsedSettings.lastActiveSessionKey
              : "main",
        };

        delete (nextSettings as Record<string, unknown>).token;
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
      } catch {
        // best effort
      }

      window.location.replace(`${targetPath}#token=${encodeURIComponent(token)}`);
    } catch {
      window.location.replace(`${targetPath}#token=${encodeURIComponent(token)}`);
    }
  }, [targetPath, token]);

  return (
    <div className="mx-auto flex min-h-screen w-[94%] max-w-3xl items-center justify-center py-16 text-[var(--fc-text)]">
      <section className="panel-cut fc-panel w-full">
        <p className="section-kicker">OpenClaw</p>
        <h1 className="section-title mt-3 text-5xl">Agent wird geoeffnet</h1>
        <p className="mt-5 text-base leading-8 text-[var(--fc-text-muted)]">
          Frozenclaw richtet gerade die Verbindung fuer deinen Browser ein und leitet dich dann
          direkt in deine OpenClaw-Instanz weiter.
        </p>

        {missingToken ? (
          <div className="mt-6 border border-[var(--fc-accent)]/40 bg-[var(--fc-accent)]/10 px-4 py-4 text-sm text-[var(--fc-text)]">
            Fuer diese Instanz fehlt ein Gateway-Token.
          </div>
        ) : (
          <div className="mt-6 border border-[var(--fc-border)] bg-black/20 px-4 py-4 text-sm text-[var(--fc-text-muted)]">
            Wenn Firefox noch alte Zugangsdaten gespeichert hatte, werden sie hier zuerst ersetzt.
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          <a href={targetPath} className="fc-button fc-button-secondary">
            Direkt zu OpenClaw
          </a>
          <a href="/konto" className="fc-button fc-button-secondary">
            Zum Dashboard
          </a>
        </div>
      </section>
    </div>
  );
}
