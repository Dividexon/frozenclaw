import Link from "next/link";
import { formatField, legalProfile, missingLegalFields } from "@/lib/legal";

const missing = missingLegalFields();

export default function DatenschutzPage() {
  return (
    <main className="mx-auto min-h-screen w-[94%] max-w-5xl py-16 text-[var(--fc-text)]">
      <section className="panel-cut fc-panel">
        <p className="section-kicker">Rechtliches</p>
        <h1 className="section-title mt-3 text-5xl">Datenschutz</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--fc-text-muted)]">
          Diese Datenschutzerklärung ist auf den aktuellen Frozenclaw-Beta-Stand zugeschnitten:
          gehostete OpenClaw-Instanzen, Stripe für Zahlungen und Bring Your Own Key als
          Standardmodus.
        </p>

        {missing.length > 0 ? (
          <div className="mt-8 border border-[var(--fc-border-strong)] bg-[rgba(209,27,31,0.08)] p-5 text-sm leading-7 text-[var(--fc-text-muted)]">
            Vor dem Livegang sollten die Angaben zu Anbieter und Kontakt vervollständigt werden.
          </div>
        ) : null}

        <div className="mt-8 space-y-8 text-base leading-8 text-[var(--fc-text-muted)]">
          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">1. Verantwortlicher</h2>
            <p className="mt-3">
              Verantwortlich für die Datenverarbeitung auf dieser Website ist{" "}
              {formatField(legalProfile.operatorName)}.
            </p>
            <p>
              Kontakt: {formatField(legalProfile.privacyContact || legalProfile.email)}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">
              2. Welche Daten wir verarbeiten
            </h2>
            <p className="mt-3">
              Im Rahmen des Beta-Angebots verarbeiten wir insbesondere Kontaktdaten,
              Bestelldaten, Stripe-Checkout-Daten, Betriebsdaten der Instanz und technische
              Server-Logs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">
              3. Zweck der Verarbeitung
            </h2>
            <p className="mt-3">
              Die Verarbeitung erfolgt, um Frozenclaw bereitzustellen, Bestellungen abzuwickeln,
              Instanzen zu provisionieren, Support zu leisten und die technische Stabilität des
              Dienstes sicherzustellen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">4. Zahlungsabwicklung</h2>
            <p className="mt-3">
              Zahlungen werden über Stripe verarbeitet. Dabei gelten ergänzend die Datenschutz-
              und Sicherheitsinformationen von Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">
              5. Bring Your Own Key und Managed-Tarife
            </h2>
            <p className="mt-3">
              Im Standardmodus nutzt du deinen eigenen Modell-Key. Wenn später Managed-Tarife
              freigeschaltet werden, werden zusätzlich Nutzungs- und Verbrauchsdaten verarbeitet,
              um Limits, Warnschwellen und Abrechnung nachvollziehbar steuern zu können.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">
              6. Hosting und Infrastruktur
            </h2>
            <p className="mt-3">
              Frozenclaw ist auf EU-Infrastruktur ausgelegt. Technische Betriebsdaten können auf
              Servern in Deutschland verarbeitet und gespeichert werden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">7. Speicherdauer</h2>
            <p className="mt-3">
              Personenbezogene Daten werden nur so lange gespeichert, wie es für Bereitstellung,
              Support, Abrechnung, gesetzliche Pflichten oder die Sicherheit des Dienstes
              erforderlich ist.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--fc-text)]">8. Deine Rechte</h2>
            <p className="mt-3">
              Du hast insbesondere das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung
              der Verarbeitung sowie auf Widerspruch nach Maßgabe der gesetzlichen Vorschriften.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/" className="fc-button fc-button-primary">
            Zur Startseite
          </Link>
          <Link href="/beta-bedingungen" className="fc-button fc-button-secondary">
            Beta-Bedingungen
          </Link>
        </div>
      </section>
    </main>
  );
}
