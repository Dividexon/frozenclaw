import Link from "next/link";
import { SetupPanel } from "@/components/setup-panel";

type AccessPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
};

async function loadInstance(slug: string, token: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/instances/${slug}?token=${encodeURIComponent(token)}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as {
      slug: string;
      usageMode: string;
      instanceState: string;
      passwordConfigured: boolean;
      providerStatus: {
        anthropic: boolean;
        openai: boolean;
        gemini: boolean;
      };
      managed: {
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
      } | null;
      agentUrl: string | null;
    };
  } catch {
    return null;
  }
}

export default async function ZugangPage({ params, searchParams }: AccessPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  const instance = token ? await loadInstance(slug, token) : null;

  return (
    <main className="mx-auto flex min-h-screen w-[94%] max-w-4xl items-center justify-center py-16 text-[var(--fc-text)]">
      <section className="panel-cut fc-panel w-full">
        <p className="section-kicker">Zugang</p>
        <h1 className="section-title mt-3 text-5xl">Deine Instanz wird eingerichtet.</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--fc-text-muted)]">
          {instance?.usageMode === "managed"
            ? "Managed-Instanzen nutzen den zentralen Betreiber-Zugang. Hier siehst du den aktuellen Stand deines Kontingents und kommst direkt in OpenClaw."
            : "Für den BYOK-Start hinterlegst du hier deinen eigenen API-Key. Danach wird deine OpenClaw-Instanz neu gestartet und ist direkt nutzbar."}
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={
              token
                ? `/api/login/setup-session?slug=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`
                : "/konto"
            }
            className="fc-button fc-button-secondary"
          >
            Zum Dashboard
          </Link>
        </div>

        {!token ? (
          <p className="mt-8 text-base leading-8 text-[var(--fc-accent)]">
            Der Zugriffstoken fehlt in der URL.
          </p>
        ) : (
          <SetupPanel slug={slug} token={token} initialState={instance} />
        )}
      </section>
    </main>
  );
}
