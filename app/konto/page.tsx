import Link from "next/link";
import { resolveLoginToken } from "@/lib/login-links";

type KontoPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

const stateLabels: Record<string, string> = {
  pending: "Wartet auf Bereitstellung",
  provisioning: "Instanz wird gerade bereitgestellt",
  ready: "Instanz ist bereit",
  failed: "Bereitstellung fehlgeschlagen",
  archived: "Instanz wurde archiviert",
};

export default async function KontoPage({ searchParams }: KontoPageProps) {
  const { token } = await searchParams;
  const access = token ? resolveLoginToken(token) : null;

  return (
    <main className="mx-auto flex min-h-screen w-[94%] max-w-4xl items-center justify-center py-16 text-[var(--fc-text)]">
      <section className="panel-cut fc-panel w-full">
        <p className="section-kicker">Konto</p>
        <h1 className="section-title mt-3 text-5xl">Dein Frozenclaw-Zugang.</h1>

        {!access ? (
          <>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--fc-text-muted)]">
              Der Link ist ungültig oder abgelaufen. Fordere einfach einen neuen Login-Link an.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/anmelden" className="fc-button fc-button-primary">
                Neu anmelden
              </Link>
              <Link href="/" className="fc-button fc-button-secondary">
                Zur Startseite
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--fc-text-muted)]">
              Hier findest du den aktuellen Stand deiner Instanz und die direkten Zugänge für
              Einrichtung und Nutzung.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="signal-row">
                <span className="signal-index">+</span>
                <span>{access.email ?? "Keine E-Mail hinterlegt"}</span>
              </div>
              <div className="signal-row">
                <span className="signal-index">+</span>
                <span>{stateLabels[access.instanceState] ?? access.instanceState}</span>
              </div>
              <div className="signal-row">
                <span className="signal-index">+</span>
                <span>{access.plan}</span>
              </div>
              <div className="signal-row">
                <span className="signal-index">+</span>
                <span>Gültig bis {access.expiresAt}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              {access.activationUrl ? (
                <a href={access.activationUrl} className="fc-button fc-button-primary">
                  Zugang einrichten
                </a>
              ) : null}
              {access.agentUrl ? (
                <a href={access.agentUrl} className="fc-button fc-button-secondary">
                  OpenClaw öffnen
                </a>
              ) : null}
              <Link href="/anmelden" className="fc-button fc-button-secondary">
                Neuen Link anfordern
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
