import Link from "next/link";
import { legalProfile } from "@/lib/legal";

export default function BetaBedingungenPage() {
  return (
    <main className="mx-auto min-h-screen w-[94%] max-w-5xl py-16 text-[var(--fc-text)]">
      <section className="panel-cut fc-panel">
        <p className="section-kicker">Rechtliches</p>
        <h1 className="section-title mt-3 text-5xl">Beta-Bedingungen</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--fc-text-muted)]">
          Diese Beta-Bedingungen beschreiben den aktuellen Status von Frozenclaw als frühes,
          bezahltes Hosting-Angebot für OpenClaw.
        </p>

        <div className="mt-8 space-y-8 text-base leading-8 text-[var(--fc-text-muted)]">
          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">1. Beta-Charakter</h2>
            <p className="mt-3">
              Frozenclaw befindet sich in einer Beta-Phase. Funktionen, Prozesse,
              Benutzeroberflächen und Limits können angepasst werden, wenn es für Stabilität,
              Sicherheit oder Betrieb erforderlich ist.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">2. Leistungsumfang</h2>
            <p className="mt-3">
              Der konkrete Leistungsumfang ergibt sich aus dem jeweils gebuchten Plan. Zum
              Start ist Hosted BYOK das öffentliche Standardangebot. Managed kann als begrenzter
              Pilot mit zusätzlichen Bedingungen angeboten werden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">
              3. Bring Your Own Key
            </h2>
            <p className="mt-3">
              Im BYOK-Modus bist du selbst für deinen Modell-Key sowie die dadurch entstehenden
              Provider-Kosten verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">4. Managed Pilot</h2>
            <p className="mt-3">
              Wenn Managed angeboten wird, kann das Angebot durch Slot-Limits, Usage-Grenzen,
              Warnschwellen, Cron-Limits oder vorübergehende Sperren begrenzt werden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">5. Verfügbarkeit</h2>
            <p className="mt-3">
              Frozenclaw wird mit dem Ziel eines stabilen Betriebs angeboten, jedoch ohne
              Zusage eines voll ausgereiften Enterprise-SLA in der Beta-Phase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">6. Support</h2>
            <p className="mt-3">
              Support erfolgt im Rahmen der verfügbaren Beta-Kapazitäten. Reaktionszeiten können
              je nach Auslastung variieren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">7. Änderungen</h2>
            <p className="mt-3">
              Wir behalten uns vor, die Beta-Bedingungen zu ändern, wenn dies für Sicherheit,
              Kostenkontrolle, Produktentwicklung oder einen geordneten Betrieb erforderlich ist.
            </p>
          </section>
        </div>

        <div className="mt-8 border border-[var(--fc-border)] bg-[rgba(255,255,255,0.025)] p-5 text-sm leading-7 text-[var(--fc-text-muted)]">
          Stand dieser Beta-Bedingungen: {legalProfile.betaTermsEffectiveDate}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/" className="fc-button fc-button-primary">
            Zur Startseite
          </Link>
          <Link href="/impressum" className="fc-button fc-button-secondary">
            Impressum
          </Link>
        </div>
      </section>
    </main>
  );
}
