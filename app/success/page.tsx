import Link from "next/link";
import { OrderStatusPanel } from "@/components/order-status-panel";

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

async function loadStatus(sessionId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/status/${sessionId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as {
      paymentStatus: string;
      instanceState: string;
      usageMode: string;
      plan: string;
      activationUrl?: string | null;
      agentUrl?: string | null;
    };
  } catch {
    return null;
  }
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  const status = sessionId ? await loadStatus(sessionId) : null;

  return (
    <main className="mx-auto flex min-h-screen w-[94%] max-w-4xl items-center justify-center py-16 text-[var(--fc-text)]">
      <section className="panel-cut fc-panel w-full">
        <p className="section-kicker">Checkout</p>
        <h1 className="section-title mt-3 text-5xl">Bestellung eingegangen.</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--fc-text-muted)]">
          Die Bestellung ist gespeichert. Sobald deine Instanz bereitsteht, führt dich der
          Zugangslink direkt in den Setup-Schritt für deinen eigenen API-Key.
        </p>

        {sessionId ? <OrderStatusPanel sessionId={sessionId} initialStatus={status} /> : null}

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/" className="fc-button fc-button-primary">
            Zur Startseite
          </Link>
          <Link href="/#preise" className="fc-button fc-button-secondary">
            Preise ansehen
          </Link>
        </div>
      </section>
    </main>
  );
}
