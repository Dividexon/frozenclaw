import Link from "next/link";
import { redirect } from "next/navigation";
import { FrozenclawWorkspace } from "@/components/frozenclaw-workspace";
import { LogoutButton } from "@/components/logout-button";
import { resolveSessionAccessFromCookies } from "@/lib/auth";
import { buildFrozenclawWorkspace } from "@/lib/frozenclaw-ui";
import { resolveSetupAccess } from "@/lib/login-links";

type ChatPageProps = {
  searchParams: Promise<{
    slug?: string;
    setupToken?: string;
  }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const sessionAccess = await resolveSessionAccessFromCookies();

  if (!sessionAccess && params.slug && params.setupToken) {
    const setupAccess = resolveSetupAccess(params.slug, params.setupToken);

    if (setupAccess?.email) {
      redirect(
        `/api/login/setup-session?slug=${encodeURIComponent(params.slug)}&token=${encodeURIComponent(params.setupToken)}&next=${encodeURIComponent("/chat")}`,
      );
    }
  }

  const access = sessionAccess;

  if (!access) {
    return (
      <main className="mx-auto min-h-screen w-[94%] max-w-5xl py-12 text-[var(--fc-text)]">
        <section className="panel-cut fc-panel">
          <p className="section-kicker">Chat</p>
          <h1 className="section-title mt-3 text-5xl">Sitzung erforderlich</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--fc-text-muted)]">
            Bitte melde dich zuerst an. Danach kannst du deinen Agenten direkt aus dem Dashboard
            oder ueber die Zugangsseite oeffnen.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/anmelden" className="fc-button fc-button-primary">
              Zur Anmeldung
            </Link>
            <Link href="/konto" className="fc-button fc-button-secondary">
              Zum Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  let snapshot = null;
  let loadError: string | null = null;

  try {
    snapshot = await buildFrozenclawWorkspace(access);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Die Frozenclaw UI konnte gerade nicht geladen werden.";
  }

  if (loadError) {
    return (
      <main className="mx-auto min-h-screen w-[94%] max-w-5xl py-12 text-[var(--fc-text)]">
        <section className="panel-cut fc-panel">
          <p className="section-kicker">Chat</p>
          <h1 className="section-title mt-3 text-5xl">Chat voruebergehend nicht erreichbar</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--fc-text-muted)]">{loadError}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/konto" className="fc-button fc-button-primary">
              Zurueck zum Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!snapshot) {
    return null;
  }

  return (
    <main className="mx-auto flex h-screen w-[94%] max-w-[1600px] flex-col overflow-hidden py-6 text-[var(--fc-text)]">
      <header className="mb-4 flex flex-none flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-kicker">Frozenclaw</p>
          <h1 className="mt-3 font-display text-5xl uppercase text-[var(--fc-text)]">Dein Agent</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/konto" className="fc-button fc-button-secondary">
            Dashboard
          </Link>
          <LogoutButton className="fc-button fc-button-secondary" />
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <FrozenclawWorkspace initialSnapshot={snapshot} />
      </div>
    </main>
  );
}
