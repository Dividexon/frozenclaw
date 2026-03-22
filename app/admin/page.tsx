import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveSessionAccessFromCookies } from "@/lib/auth";
import { buildAdminSnapshot, formatMicrosAsEuro } from "@/lib/admin-dashboard";
import { formatStandardTokens } from "@/lib/managed";

type AdminPageProps = {
  searchParams: Promise<{
    adminMessage?: string;
    adminError?: string;
  }>;
};

function AdminActionForm({
  orderId,
  action,
  label,
}: {
  orderId: number;
  action: "restart_instance" | "reprovision_instance" | "rotate_gateway_token";
  label: string;
}) {
  return (
    <form action="/api/admin/actions" method="post">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="action" value={action} />
      <button type="submit" className="fc-button fc-button-secondary">
        {label}
      </button>
    </form>
  );
}

function OverviewCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="border border-[var(--fc-border)] bg-black/20 p-4">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">{value}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">{hint}</p>
    </div>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const access = await resolveSessionAccessFromCookies();

  if (!access) {
    redirect("/anmelden");
  }

  if (!access.isAdmin) {
    return (
      <main className="mx-auto min-h-screen w-[94%] max-w-4xl py-12 text-[var(--fc-text)]">
        <section className="panel-cut fc-panel">
          <p className="section-kicker">Admin</p>
          <h1 className="section-title mt-3 text-5xl">Kein Zugriff</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--fc-text-muted)]">
            Diese Oberfläche ist nur für Admin-Konten freigegeben.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/konto" className="fc-button fc-button-primary">
              Zurück zum Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { adminError, adminMessage } = await searchParams;
  const snapshot = buildAdminSnapshot();

  return (
    <main className="mx-auto min-h-screen w-[94%] max-w-7xl py-12 text-[var(--fc-text)]">
      <section className="panel-cut fc-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Admin</p>
            <h1 className="section-title mt-3 text-5xl">Betriebsoberfläche</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--fc-text-muted)]">
              Übersicht über Kunden, Instanzen, Provisionierung, Billing und Managed-Nutzung. Diese
              Fläche ist für operative Eingriffe gedacht.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/konto" className="fc-button fc-button-secondary">
              Zum Kundendashboard
            </Link>
            <Link href="/erste-schritte" className="fc-button fc-button-secondary">
              Erste Schritte
            </Link>
          </div>
        </div>

        {adminMessage ? (
          <p className="mt-6 border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {adminMessage}
          </p>
        ) : null}
        {adminError ? (
          <p className="mt-6 border border-[var(--fc-accent)]/40 bg-[var(--fc-accent)]/10 px-4 py-3 text-sm text-[var(--fc-text)]">
            {adminError}
          </p>
        ) : null}
      </section>

      <section className="mt-6 panel-cut fc-panel">
        <p className="section-kicker">Übersicht</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            label="Konten"
            value={String(snapshot.overview.totalAccounts)}
            hint={`${snapshot.overview.payingAccounts} zahlend, ${snapshot.overview.testAccounts} Testzugänge`}
          />
          <OverviewCard
            label="Instanzen"
            value={String(snapshot.overview.readyInstances)}
            hint={`${snapshot.overview.provisioningInstances} in Bereitstellung, ${snapshot.overview.failedInstances} mit Fehler`}
          />
          <OverviewCard
            label="Modi"
            value={`${snapshot.overview.byokAccounts} / ${snapshot.overview.managedAccounts}`}
            hint="BYOK / Managed"
          />
          <OverviewCard
            label="Geschätzter MRR"
            value={`${(snapshot.overview.estimatedMrrCents / 100).toLocaleString("de-DE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} €`}
            hint="Nur aus aktiven bezahlten Plänen, ohne Top-ups"
          />
        </div>

        <div className="mt-6 border border-[var(--fc-border)] bg-black/20 p-5">
          <p className="section-kicker">Letzter Provisionierungsfehler</p>
          {snapshot.overview.latestFailure ? (
            <>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                {snapshot.overview.latestFailure.slug ?? "Ohne Instanz-Slug"}
              </h2>
              <p className="mt-3 text-base leading-8 text-[var(--fc-text-muted)]">
                {snapshot.overview.latestFailure.message}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="signal-row">
                  <span className="signal-index">+</span>
                  <span>{snapshot.overview.latestFailure.email ?? "Keine E-Mail"}</span>
                </div>
                <div className="signal-row">
                  <span className="signal-index">+</span>
                  <span>{snapshot.overview.latestFailure.createdAt}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-base leading-8 text-[var(--fc-text-muted)]">
              Aktuell ist kein fehlgeschlagener Provisionierungslauf im Protokoll.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6 panel-cut fc-panel">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--fc-border)] pb-5">
          <div>
            <p className="section-kicker">Kunden</p>
            <h2 className="mt-3 text-4xl font-semibold text-[var(--fc-text)]">Konten im Überblick</h2>
          </div>
          <span className="fc-chip">{snapshot.customers.length} Konten</span>
        </div>

        <div className="mt-6 grid gap-4">
          {snapshot.customers.map((customer) => (
            <article key={customer.orderId} className="border border-[var(--fc-border)] bg-black/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                    {customer.accountType}
                    {customer.isAdmin ? " · Admin" : ""}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                    {customer.email ?? "Ohne E-Mail"}
                  </h3>
                </div>
                <p className="text-sm uppercase tracking-[0.16em] text-[var(--fc-text-muted)]">
                  {customer.planLabel}
                </p>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
                <div className="signal-row">
                  <span className="signal-index">+</span>
                  <span>{customer.usageModeLabel}</span>
                </div>
                <div className="signal-row">
                  <span className="signal-index">+</span>
                  <span>{customer.paymentStatus}</span>
                </div>
                <div className="signal-row">
                  <span className="signal-index">+</span>
                  <span>{customer.subscriptionStatus ?? "Kein Subscription-Status"}</span>
                </div>
                <div className="signal-row">
                  <span className="signal-index">+</span>
                  <span>{customer.lastActivityAt ?? "Noch keine Aktivität"}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-4">
                {customer.activationUrl ? (
                  <a
                    href={customer.activationUrl}
                    className="fc-button fc-button-secondary"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Zugang öffnen
                  </a>
                ) : null}
                {customer.agentUrl ? (
                  <a
                    href={customer.agentUrl}
                    className="fc-button fc-button-secondary"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Agent öffnen
                  </a>
                ) : null}
                <AdminActionForm orderId={customer.orderId} action="reprovision_instance" label="Neu provisionieren" />
                {customer.instanceSlug ? (
                  <>
                    <AdminActionForm orderId={customer.orderId} action="restart_instance" label="Instanz neu starten" />
                    <AdminActionForm orderId={customer.orderId} action="rotate_gateway_token" label="Gateway rotieren" />
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="panel-cut fc-panel">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--fc-border)] pb-5">
            <div>
              <p className="section-kicker">Instanzen</p>
              <h2 className="mt-3 text-4xl font-semibold text-[var(--fc-text)]">Laufende Instanzen</h2>
            </div>
            <span className="fc-chip">{snapshot.instances.length} Einträge</span>
          </div>

          <div className="mt-6 grid gap-4">
            {snapshot.instances.map((instance) => (
              <article key={instance.orderId} className="border border-[var(--fc-border)] bg-black/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                      {instance.planLabel}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                      {instance.slug}
                    </h3>
                  </div>
                  <p className="text-sm uppercase tracking-[0.16em] text-[var(--fc-text-muted)]">
                    {instance.state}
                  </p>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>{instance.email ?? "Ohne E-Mail"}</span>
                  </div>
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>Port {instance.port ?? "nicht gesetzt"}</span>
                  </div>
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>{instance.usageModeLabel}</span>
                  </div>
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>{instance.modelLabel}</span>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-4">
                  <AdminActionForm orderId={instance.orderId} action="restart_instance" label="Neustart" />
                  <AdminActionForm orderId={instance.orderId} action="reprovision_instance" label="Reprovisionieren" />
                  <AdminActionForm orderId={instance.orderId} action="rotate_gateway_token" label="Token rotieren" />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel-cut fc-panel">
          <div className="border-b border-[var(--fc-border)] pb-5">
            <p className="section-kicker">Provisionierung</p>
            <h2 className="mt-3 text-4xl font-semibold text-[var(--fc-text)]">Letzte Betriebsereignisse</h2>
          </div>

          <div className="mt-6 grid gap-4">
            {snapshot.provisioningEvents.map((event) => (
              <article key={event.id} className="border border-[var(--fc-border)] bg-black/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                    {event.action}
                  </p>
                  <p className="text-sm uppercase tracking-[0.16em] text-[var(--fc-text-muted)]">
                    {event.createdAt}
                  </p>
                </div>
                <p className="mt-3 text-base leading-8 text-[var(--fc-text-muted)]">{event.details}</p>
                <div className="mt-4 grid gap-3">
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>{event.email ?? "Ohne E-Mail"}</span>
                  </div>
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>{event.slug ?? "Ohne Instanz-Slug"}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel-cut fc-panel">
          <div className="border-b border-[var(--fc-border)] pb-5">
            <p className="section-kicker">Billing</p>
            <h2 className="mt-3 text-4xl font-semibold text-[var(--fc-text)]">Abos und Stripe-Status</h2>
          </div>
          <div className="mt-6 grid gap-4">
            {snapshot.billing.map((row) => (
              <article key={row.orderId} className="border border-[var(--fc-border)] bg-black/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                      {row.planLabel}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                      {row.email ?? "Ohne E-Mail"}
                    </h3>
                  </div>
                  <p className="text-sm uppercase tracking-[0.16em] text-[var(--fc-text-muted)]">
                    {row.amountLabel}
                  </p>
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>{row.paymentStatus}</span>
                  </div>
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>{row.subscriptionStatus ?? "Kein Subscription-Status"}</span>
                  </div>
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>{row.customerId ?? "Kein Stripe-Customer hinterlegt"}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel-cut fc-panel">
          <div className="border-b border-[var(--fc-border)] pb-5">
            <p className="section-kicker">Managed-Nutzung</p>
            <h2 className="mt-3 text-4xl font-semibold text-[var(--fc-text)]">Kontingent und Verbrauch</h2>
          </div>
          <div className="mt-6 grid gap-4">
            {snapshot.managedUsage.map((row) => (
              <article key={row.orderId} className="border border-[var(--fc-border)] bg-black/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                      {row.planLabel}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-[var(--fc-text)]">
                      {row.email ?? "Ohne E-Mail"}
                    </h3>
                  </div>
                  <p className="text-sm uppercase tracking-[0.16em] text-[var(--fc-text-muted)]">
                    {row.model}
                  </p>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>Genutzt: {formatStandardTokens(row.usedTokens)}</span>
                  </div>
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>Verbleibend: {formatStandardTokens(row.remainingTokens)}</span>
                  </div>
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>Top-up: {formatStandardTokens(row.topUpTokens)}</span>
                  </div>
                  <div className="signal-row">
                    <span className="signal-index">+</span>
                    <span>Kosten intern: {formatMicrosAsEuro(row.usedCostMicros)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
