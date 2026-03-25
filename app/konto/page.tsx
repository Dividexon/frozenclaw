import Link from "next/link";
import { BillingPortalButton } from "@/components/billing-portal-button";
import { CopyField } from "@/components/copy-field";
import { LogoutButton } from "@/components/logout-button";
import { TopUpButton } from "@/components/topup-button";
import { UpgradePlanButton } from "@/components/upgrade-plan-button";
import { resolveSessionAccessFromCookies } from "@/lib/auth";
import { buildDashboardSnapshot } from "@/lib/dashboard";
import { legalProfile } from "@/lib/legal";
import { resolveLoginToken, resolveSetupAccess } from "@/lib/login-links";
import { formatStandardTokens, getManagedTopUps } from "@/lib/managed";

type KontoPageProps = {
  searchParams: Promise<{
    token?: string;
    slug?: string;
    setupToken?: string;
  }>;
};

type PlanCardDefinition = {
  id: "hosted_byok" | "managed_starter" | "managed_immediate" | "managed_advanced";
  kicker: string;
  price: string;
  description: string;
};

const planCards: PlanCardDefinition[] = [
  {
    id: "hosted_byok",
    kicker: "Standardplan",
    price: "19 € / Monat",
    description:
      "Eigene gehostete Instanz mit eigenem Modell-Key. Geeignet, wenn du Modellkosten selbst steuern willst.",
  },
  {
    id: "managed_starter",
    kicker: "Managed Starter",
    price: "9,90 € / Monat",
    description: "500.000 Standard-Tokens mit GPT-5.2 für einen günstigen Einstieg in Managed.",
  },
  {
    id: "managed_immediate",
    kicker: "Managed Plus",
    price: "39 € / Monat",
    description:
      "3 Mio. Standard-Tokens mit GPT-5.2 für regelmäßige Nutzung mit klarem Monatsrahmen.",
  },
  {
    id: "managed_advanced",
    kicker: "Managed Advanced",
    price: "59 € / Monat",
    description:
      "5 Mio. Standard-Tokens mit GPT-5.2 für mehr Spielraum und höhere laufende Nutzung.",
  },
];

function StatusPill({
  tone,
  label,
}: {
  tone: "online" | "warning" | "critical";
  label: string;
}) {
  const toneStyles = {
    online: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-100",
    critical: "border-[var(--fc-accent)]/40 bg-[var(--fc-accent)]/10 text-[var(--fc-text)]",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-2 border px-3 py-2 text-xs uppercase tracking-[0.18em] ${toneStyles[tone]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {label}
    </span>
  );
}

function PlanCard({
  card,
  currentPlanId,
  isLegacyTrial,
  billingToken,
}: {
  card: PlanCardDefinition;
  currentPlanId: string;
  isLegacyTrial: boolean;
  billingToken?: string;
}) {
  const isCurrent = currentPlanId === card.id;

  return (
    <div className="flex h-full flex-col border border-[var(--fc-border)] bg-black/20 p-5">
      <p className="section-kicker">{card.kicker}</p>
      <h3 className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">{card.price}</h3>
      <p className="mt-4 flex-1 text-sm leading-7 text-[var(--fc-text-muted)]">{card.description}</p>
      <div className="mt-5">
        {isCurrent ? (
          <span className="fc-button fc-button-secondary opacity-60">Aktiver Plan</span>
        ) : isLegacyTrial ? (
          <UpgradePlanButton planId={card.id} className="fc-button fc-button-primary">
            Diesen Plan wählen
          </UpgradePlanButton>
        ) : (
          <BillingPortalButton token={billingToken} className="fc-button fc-button-secondary">
            Im Portal wechseln
          </BillingPortalButton>
        )}
      </div>
    </div>
  );
}

export default async function KontoPage({ searchParams }: KontoPageProps) {
  const { token, slug, setupToken } = await searchParams;
  const access = token
    ? resolveLoginToken(token)
    : slug && setupToken
      ? resolveSetupAccess(slug, setupToken)
      : await resolveSessionAccessFromCookies();
  const dashboard = access ? await buildDashboardSnapshot(access) : null;
  const managed = access?.managed;
  const billingToken = access?.authType === "login_link" ? token : undefined;
  const isLegacyTrial = access?.plan === "trial";
  const isFreeTierLocked = Boolean(access?.plan === "trial" && access.freeTierLocked);
  const topUpPackages = access ? getManagedTopUps(access.plan) : [];
  const managedProgressPercent =
    managed && managed.includedStandardTokens > 0
      ? Math.min(
          100,
          Math.round((managed.usedStandardTokens / managed.includedStandardTokens) * 100),
        )
      : 0;
  const sessionText =
    access?.authType === "login_link" && access.expiresAt
      ? `Login-Link gültig bis ${access.expiresAt}`
      : access?.expiresAt
        ? `Sitzung gültig bis ${access.expiresAt}`
        : "Passwort-Sitzung aktiv";

  return (
    <main className="mx-auto min-h-screen w-[94%] max-w-7xl py-12 text-[var(--fc-text)]">
      {!access || !dashboard ? (
        <section className="panel-cut fc-panel mx-auto max-w-4xl">
          <p className="section-kicker">Konto</p>
          <h1 className="section-title mt-3 text-5xl">Dein Dashboard ist nicht erreichbar.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--fc-text-muted)]">
            Deine Sitzung ist ungültig oder abgelaufen. Melde dich einfach erneut an und öffne dein
            Dashboard erneut.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/anmelden" className="fc-button fc-button-primary">
              Neu anmelden
            </Link>
            <Link href="/" className="fc-button fc-button-secondary">
              Zur Startseite
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="panel-cut fc-panel h-fit xl:sticky xl:top-6">
            <p className="section-kicker">Dashboard</p>
            <h1 className="mt-3 font-display text-4xl uppercase text-[var(--fc-text)]">
              Dein Frozenclaw-Zugang
            </h1>
            <p className="mt-4 text-base leading-8 text-[var(--fc-text-muted)]">
              Alles Wichtige zu deiner Instanz, deinem Plan und deinem Zugang an einem Ort.
            </p>

            <div className="mt-6">
              <StatusPill tone={dashboard.instanceStatusTone} label={dashboard.instanceStatusLabel} />
            </div>

            <div className="mt-6 grid gap-3">
              <div className="signal-row">
                <span className="signal-index">+</span>
                <span>{dashboard.accountLabel}</span>
              </div>
              <div className="signal-row">
                <span className="signal-index">+</span>
                <span>{dashboard.planLabel}</span>
              </div>
              <div className="signal-row">
                <span className="signal-index">+</span>
                <span>{dashboard.usageModeLabel}</span>
              </div>
              <div className="signal-row">
                <span className="signal-index">+</span>
                <span>{dashboard.providerStatusSummary}</span>
              </div>
            </div>

            <nav className="mt-8 grid gap-2 text-sm uppercase tracking-[0.16em] text-[var(--fc-text-muted)]">
              <a
                href="#uebersicht"
                className="border border-[var(--fc-border)] bg-black/20 px-4 py-3 transition hover:border-[var(--fc-accent)] hover:bg-[rgba(255,77,77,0.08)] hover:text-[var(--fc-text)]"
              >
                Übersicht
              </a>
              <a
                href="#agent"
                className="border border-[var(--fc-border)] bg-black/20 px-4 py-3 transition hover:border-[var(--fc-accent)] hover:bg-[rgba(255,77,77,0.08)] hover:text-[var(--fc-text)]"
              >
                Agent
              </a>
              <a
                href="#automationen"
                className="border border-[var(--fc-border)] bg-black/20 px-4 py-3 transition hover:border-[var(--fc-accent)] hover:bg-[rgba(255,77,77,0.08)] hover:text-[var(--fc-text)]"
              >
                Automationen
              </a>
              <a
                href="#plan-verbrauch"
                className="border border-[var(--fc-border)] bg-black/20 px-4 py-3 transition hover:border-[var(--fc-accent)] hover:bg-[rgba(255,77,77,0.08)] hover:text-[var(--fc-text)]"
              >
                Plan & Verbrauch
              </a>
              <a
                href="#einstellungen"
                className="border border-[var(--fc-border)] bg-black/20 px-4 py-3 transition hover:border-[var(--fc-accent)] hover:bg-[rgba(255,77,77,0.08)] hover:text-[var(--fc-text)]"
              >
                Einstellungen
              </a>
            </nav>
          </aside>

          <div className="space-y-6">
            <section id="uebersicht" className="panel-cut fc-panel">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--fc-border)] pb-5">
                <div>
                  <p className="section-kicker">Übersicht</p>
                  <h2 className="mt-3 text-4xl font-semibold text-[var(--fc-text)]">
                    Status und nächste Schritte
                  </h2>
                </div>
                <div className="text-right text-sm uppercase tracking-[0.16em] text-[var(--fc-text-muted)]">
                  {access.isAdmin ? (
                    <p className="mb-2 text-[var(--fc-accent-strong)]">Admin-Konto</p>
                  ) : null}
                  <p>{access.email ?? "Keine E-Mail hinterlegt"}</p>
                  <p className="mt-2">{sessionText}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="border border-[var(--fc-border)] bg-black/20 p-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                    Instanz
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                    {dashboard.instanceStatusLabel}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">
                    {access.instanceSlug ?? "Noch kein Slug vergeben"}
                  </p>
                </div>

                <div className="border border-[var(--fc-border)] bg-black/20 p-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                    Aktueller Plan
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                    {dashboard.planLabel}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">
                    {dashboard.usageModeLabel}
                  </p>
                </div>

                <div className="border border-[var(--fc-border)] bg-black/20 p-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                    Kontingent / Keys
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                    {isFreeTierLocked
                      ? "Aufgebraucht"
                      : access.usageMode === "managed"
                      ? `${formatStandardTokens(managed?.remainingStandardTokens ?? 0)} frei`
                      : dashboard.providers.some((provider) => provider.configured)
                        ? "Provider aktiv"
                        : "Key fehlt"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">
                    {isFreeTierLocked
                      ? "Dein einmaliges Free-Tier-Kontingent ist verbraucht. Wähle einen bezahlten Plan, um weiterzuarbeiten."
                      : access.usageMode === "managed"
                      ? "Verbleibendes Kontingent deiner Managed-Instanz."
                      : "Zeigt, ob für BYOK bereits ein eigener Provider hinterlegt ist."}
                  </p>
                </div>

                <div className="border border-[var(--fc-border)] bg-black/20 p-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                    Letzte Aktivität
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                    {dashboard.lastActivityAt ? "Erfasst" : "Noch keine"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">
                    {dashboard.lastActivityAt ??
                      "Sobald dein Agent genutzt wird, erscheint hier der letzte Aufruf."}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="border border-[var(--fc-border)] bg-black/20 p-5">
                  <p className="section-kicker">Nächste Aktion</p>
                  <h3 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">
                    {dashboard.nextAction.title}
                  </h3>
                  <p className="mt-4 text-base leading-8 text-[var(--fc-text-muted)]">
                    {dashboard.nextAction.description}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    {dashboard.nextAction.href ? (
                      <a
                        href={dashboard.nextAction.href}
                        className="fc-button fc-button-primary"
                        target={dashboard.nextAction.href === access.agentUrl ? "_blank" : undefined}
                        rel={
                          dashboard.nextAction.href === access.agentUrl
                            ? "noreferrer noopener"
                            : undefined
                        }
                      >
                        {dashboard.nextAction.label}
                      </a>
                    ) : null}
                    {access.activationUrl ? (
                      <a href={access.activationUrl} className="fc-button fc-button-secondary">
                        Zugang verwalten
                      </a>
                    ) : null}
                    <Link href="/erste-schritte" className="fc-button fc-button-secondary">
                      Erste Schritte
                    </Link>
                  </div>
                </div>

                <div className="border border-[var(--fc-border)] bg-black/20 p-5">
                  <p className="section-kicker">Beta-Hinweis</p>
                  <h3 className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                    Diese Fläche ist bewusst pragmatisch.
                  </h3>
                  <p className="mt-4 text-base leading-8 text-[var(--fc-text-muted)]">
                    Das Dashboard zeigt dir die wichtigsten Betriebs- und Tarifdaten. Tiefe
                    Konfigurationen bleiben in OpenClaw selbst, damit sich Frozenclaw auf Status,
                    Zugang und Abrechnung konzentriert.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <a href={`mailto:${legalProfile.email}`} className="fc-button fc-button-secondary">
                      Support kontaktieren
                    </a>
                    <Link href="/beta-bedingungen" className="fc-button fc-button-secondary">
                      Beta-Bedingungen
                    </Link>
                  </div>
                </div>
              </div>

              {managed ? (
                <div className="mt-6 border border-[var(--fc-border)] bg-black/20 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="section-kicker">Managed-Kontingent</p>
                      <h3 className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                        {formatStandardTokens(managed.usedStandardTokens)} /{" "}
                        {formatStandardTokens(managed.includedStandardTokens)} genutzt
                      </h3>
                    </div>
                    <p className="text-sm uppercase tracking-[0.16em] text-[var(--fc-text-muted)]">
                      Top-up: {formatStandardTokens(managed.topUpStandardTokens)}
                    </p>
                  </div>
                  <div className="mt-5 h-3 overflow-hidden border border-[var(--fc-border)] bg-black/40">
                    <div
                      className="h-full bg-[linear-gradient(90deg,var(--fc-accent),var(--fc-accent-strong))]"
                      style={{ width: `${managedProgressPercent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--fc-text-muted)]">
                    Das Dashboard zeigt dein aktuelles Kontingent und die verbleibende Reserve. Eine
                    Verbrauchsprognose folgt erst, wenn ausreichend echte Nutzungsdaten vorliegen.
                  </p>
                </div>
              ) : null}
            </section>

            <section id="agent" className="panel-cut fc-panel">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--fc-border)] pb-5">
                <div>
                  <p className="section-kicker">Agent</p>
                  <h2 className="mt-3 text-4xl font-semibold text-[var(--fc-text)]">
                    Zugriff und Modellzugang
                  </h2>
                </div>
                <div className="flex flex-wrap gap-4">
                  {access.agentUrl ? (
                    <a
                      href={access.agentUrl}
                      className="fc-button fc-button-primary"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      OpenClaw öffnen
                    </a>
                  ) : null}
                  {access.activationUrl ? (
                    <a href={access.activationUrl} className="fc-button fc-button-secondary">
                      Zugang verwalten
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {access.agentUrl ? (
                  <CopyField
                    label="Agent-URL"
                    value={access.agentUrl}
                    helper="Direkter Link zu deiner OpenClaw-Instanz."
                  />
                ) : null}
                {access.instanceSlug && access.activationUrl ? (
                  <CopyField
                    label="Gateway-Token"
                    value={access.activationUrl.split("token=")[1] ?? ""}
                    conceal
                    helper="Wird nur gebraucht, wenn OpenClaw die Verbindung erneut anfordert."
                  />
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="border border-[var(--fc-border)] bg-black/20 p-5">
                  <p className="section-kicker">
                    {access.usageMode === "managed" ? "Managed-Modell" : "Provider-Status"}
                  </p>
                  {access.usageMode === "managed" && managed ? (
                    <>
                      <h3 className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                        {managed.model}
                      </h3>
                      <p className="mt-4 text-base leading-8 text-[var(--fc-text-muted)]">
                        Managed nutzt ein festes Modell. Der Modellzugang wird zentral durch
                        Frozenclaw bereitgestellt und ist im Dashboard rein informativ sichtbar.
                      </p>
                    </>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      {dashboard.providers.map((provider) => (
                        <div
                          key={provider.id}
                          className="flex flex-wrap items-center justify-between gap-4 border border-[var(--fc-border)] bg-black/25 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text)]">
                              {provider.label}
                            </p>
                            <p className="mt-1 text-sm text-[var(--fc-text-muted)]">
                              {provider.configured
                                ? provider.maskedKey ?? "Key hinterlegt"
                                : "Noch kein Key hinterlegt"}
                            </p>
                          </div>
                          <div className="text-right text-xs uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                            <p>{provider.configured ? "Konfiguriert" : "Nicht aktiv"}</p>
                            <p className="mt-1">{provider.lastUsedAt ?? "Noch nicht genutzt"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-[var(--fc-border)] bg-black/20 p-5">
                  <p className="section-kicker">Instanz</p>
                  <div className="mt-4 grid gap-3">
                    <div className="signal-row">
                      <span className="signal-index">+</span>
                      <span>{access.instanceSlug ?? "Noch kein Slug vergeben"}</span>
                    </div>
                    <div className="signal-row">
                      <span className="signal-index">+</span>
                      <span>{dashboard.instanceStatusLabel}</span>
                    </div>
                    <div className="signal-row">
                      <span className="signal-index">+</span>
                      <span>
                        {access.usageMode === "managed"
                          ? "Modellwechsel im Managed-Tarif nicht vorgesehen"
                          : "Provider und Schlüssel werden über die Zugangsseite verwaltet"}
                      </span>
                    </div>
                    <div className="signal-row">
                      <span className="signal-index">+</span>
                      <span>Verbundene Kanäle werden in OpenClaw selbst gepflegt</span>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-4">
                    {access.activationUrl ? (
                      <a href={access.activationUrl} className="fc-button fc-button-secondary">
                        API-Key ?ndern
                      </a>
                    ) : null}
                    <span className="fc-button fc-button-secondary opacity-60">
                      Neustart folgt als eigene Aktion
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section id="automationen" className="panel-cut fc-panel">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--fc-border)] pb-5">
                <div>
                  <p className="section-kicker">Automationen</p>
                  <h2 className="mt-3 text-4xl font-semibold text-[var(--fc-text)]">
                    Read-only Überblick über Cronjobs
                  </h2>
                </div>
                <span className="fc-chip">v1.1 Aufbau</span>
              </div>

              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--fc-text-muted)]">
                Cronjobs werden weiterhin in OpenClaw selbst konfiguriert. Das Dashboard zeigt sie
                nur zur Übersicht an und dupliziert keine eigene Verwaltungsoberfläche.
              </p>

              <div className="mt-6 grid gap-4">
                {dashboard.cronJobs.length > 0 ? (
                  dashboard.cronJobs.map((job) => (
                    <div key={job.id} className="border border-[var(--fc-border)] bg-black/20 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                            {job.status}
                          </p>
                          <h3 className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                            {job.name}
                          </h3>
                        </div>
                        <p className="text-sm uppercase tracking-[0.16em] text-[var(--fc-text-muted)]">
                          {job.schedule}
                        </p>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="signal-row">
                          <span className="signal-index">+</span>
                          <span>Letzter Lauf: {job.lastRunAt ?? "Noch kein Lauf erfasst"}</span>
                        </div>
                        <div className="signal-row">
                          <span className="signal-index">+</span>
                          <span>Nächster Lauf: {job.nextRunAt ?? "Noch nicht geplant"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="border border-[var(--fc-border)] bg-black/20 p-5 text-base leading-8 text-[var(--fc-text-muted)]">
                    Aktuell sind keine Cronjobs in deiner Instanz hinterlegt.
                  </div>
                )}
              </div>
            </section>
            <section id="plan-verbrauch" className="panel-cut fc-panel">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--fc-border)] pb-5">
                <div>
                  <p className="section-kicker">Plan & Verbrauch</p>
                  <h2 className="mt-3 text-4xl font-semibold text-[var(--fc-text)]">
                    Tarif, Kontingent und Planwechsel
                  </h2>
                </div>
                <span className="fc-chip">{dashboard.planLabel}</span>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="border border-[var(--fc-border)] bg-black/20 p-5">
                  <p className="section-kicker">Aktueller Plan</p>
                  <h3 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">
                    {dashboard.planLabel}
                  </h3>
                  <p className="mt-4 text-base leading-8 text-[var(--fc-text-muted)]">
                    {access.usageMode === "managed"
                      ? "Managed bündelt Hosting und Modellzugang in einem festen Tarif. Nachbuchungen werden erst nach dem Monatskontingent verbraucht."
                      : "BYOK trennt Hosting und Modellkosten. Du bringst deinen eigenen Provider-Key mit und zahlst an Frozenclaw nur das Hosting."}
                  </p>

                  {managed ? (
                    <div className="mt-6 grid gap-3">
                      <div className="signal-row">
                        <span className="signal-index">+</span>
                        <span>
                          Genutzt: {formatStandardTokens(managed.usedStandardTokens)} von{" "}
                          {formatStandardTokens(managed.includedStandardTokens)}
                        </span>
                      </div>
                      <div className="signal-row">
                        <span className="signal-index">+</span>
                        <span>Verbleibend: {formatStandardTokens(managed.remainingStandardTokens)}</span>
                      </div>
                      <div className="signal-row">
                        <span className="signal-index">+</span>
                        <span>Top-up separat: {formatStandardTokens(managed.topUpStandardTokens)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-3">
                      <div className="signal-row">
                        <span className="signal-index">+</span>
                        <span>Eigener API-Key bestimmt die externe Modellabrechnung.</span>
                      </div>
                      <div className="signal-row">
                        <span className="signal-index">+</span>
                        <span>Kein zentrales Kontingent im Frozenclaw-Dashboard.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-[var(--fc-border)] bg-black/20 p-5">
                  <p className="section-kicker">Planverwaltung</p>
                  <div className="mt-4 grid gap-4">
                    <div className="border border-[var(--fc-border)] bg-black/25 p-4">
                      <h3 className="text-xl font-semibold text-[var(--fc-text)]">
                        {isLegacyTrial ? "Bezahlten Plan aktivieren" : "Plan wechseln"}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--fc-text-muted)]">
                        {isLegacyTrial
                          ? "Dein Free Tier kann direkt in einen bezahlten Plan überführt werden, ohne eine zweite Instanz anzulegen."
                          : "Bei laufenden Abos laufen Wechsel, Kündigung, Rechnungen und Zahlungsmethode über das Stripe Customer Portal."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-4">
                        {isLegacyTrial ? (
                          <UpgradePlanButton
                            planId="hosted_byok"
                            className="fc-button fc-button-primary"
                          >
                            Standardplan buchen
                          </UpgradePlanButton>
                        ) : (
                          <BillingPortalButton token={billingToken} className="fc-button fc-button-secondary">
                            Stripe-Portal öffnen
                          </BillingPortalButton>
                        )}
                      </div>
                    </div>

                    <div className="border border-[var(--fc-border)] bg-black/25 p-4">
                      <h3 className="text-xl font-semibold text-[var(--fc-text)]">Nachbuchung</h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--fc-text-muted)]">
                        {access.usageMode === "managed" && !isLegacyTrial
                          ? "Du kannst 1 Mio. oder 2,5 Mio. zusätzliche Standard-Tokens als Einmalkauf nachbuchen. Die Nachbuchung wird erst verbraucht, wenn dein Monatskontingent aufgebraucht ist."
                          : isLegacyTrial
                            ? "Nachbuchungen sind im Free Tier noch nicht verfügbar. Wechsle dafür in einen Managed-Plan."
                            : "Nachbuchungen sind nur für Managed-Pläne relevant. Im Standardplan nutzt du deinen eigenen API-Key."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-4">
                        {access.usageMode === "managed" && !isLegacyTrial && topUpPackages.length > 0 ? (
                          <>
                            {topUpPackages.map((pkg) => (
                              <TopUpButton
                                key={pkg.id}
                                packageId={pkg.id}
                                className="fc-button fc-button-secondary"
                              >
                                {pkg.label} für {(pkg.amountCents / 100).toLocaleString("de-DE", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })} €
                              </TopUpButton>
                            ))}
                          </>
                        ) : (
                          <span className="fc-button fc-button-secondary opacity-60">
                            {isLegacyTrial
                              ? "Im Free Tier noch nicht verfügbar"
                              : access.usageMode === "managed"
                                ? "Für diesen Plan sind aktuell keine Pakete hinterlegt"
                                : "Im Standardplan nicht nötig"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                {planCards.map((card) => (
                  <PlanCard
                    key={card.id}
                    card={card}
                    currentPlanId={access.plan}
                    isLegacyTrial={isLegacyTrial}
                    billingToken={billingToken}
                  />
                ))}
              </div>
            </section>

            <section id="einstellungen" className="panel-cut fc-panel">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--fc-border)] pb-5">
                <div>
                  <p className="section-kicker">Einstellungen</p>
                  <h2 className="mt-3 text-4xl font-semibold text-[var(--fc-text)]">
                    Zugang, Support und rechtliche Links
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="border border-[var(--fc-border)] bg-black/20 p-5">
                  <p className="section-kicker">Konto</p>
                  <div className="mt-4 grid gap-3">
                    <div className="signal-row">
                      <span className="signal-index">+</span>
                      <span>{access.email ?? "Keine E-Mail hinterlegt"}</span>
                    </div>
                    <div className="signal-row">
                      <span className="signal-index">+</span>
                      <span>{sessionText}</span>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-4">
                    {access.activationUrl ? (
                      <a href={access.activationUrl} className="fc-button fc-button-secondary">
                        Passwort & Zugang verwalten
                      </a>
                    ) : null}
                    {access.isAdmin ? (
                      <Link href="/admin" className="fc-button fc-button-secondary">
                        Adminpanel
                      </Link>
                    ) : null}
                    <Link href="/erste-schritte" className="fc-button fc-button-secondary">
                      Erste Schritte
                    </Link>
                    <LogoutButton className="fc-button fc-button-secondary" />
                    <a href={`mailto:${legalProfile.email}`} className="fc-button fc-button-secondary">
                      Support kontaktieren
                    </a>
                  </div>
                </div>

                <div className="border border-[var(--fc-border)] bg-black/20 p-5">
                  <p className="section-kicker">Weitere Schritte</p>
                  <div className="mt-4 grid gap-3">
                    <div className="signal-row">
                      <span className="signal-index">+</span>
                      <span>Benachrichtigungen folgen mit dem nächsten Ausbau</span>
                    </div>
                    <div className="signal-row">
                      <span className="signal-index">+</span>
                      <span>Kündigung und Zahlungsverwaltung laufen über das Stripe-Portal</span>
                    </div>
                    <div className="signal-row">
                      <span className="signal-index">+</span>
                      <span>Instanz-Reset wird erst nach sauberem Backup-Flow freigegeben</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4 text-sm uppercase tracking-[0.14em] text-[var(--fc-text-muted)]">
                <Link href="/impressum" className="transition hover:text-[var(--fc-text)]">
                  Impressum
                </Link>
                <Link href="/datenschutz" className="transition hover:text-[var(--fc-text)]">
                  Datenschutz
                </Link>
                <Link href="/beta-bedingungen" className="transition hover:text-[var(--fc-text)]">
                  Beta-Bedingungen
                </Link>
                {!isLegacyTrial ? (
                  <BillingPortalButton token={billingToken} className="fc-button fc-button-secondary">
                    Rechnungen & Abo
                  </BillingPortalButton>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
