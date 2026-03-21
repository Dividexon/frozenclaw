import Link from "next/link";
import { formatField, legalProfile, missingLegalFields } from "@/lib/legal";

const missing = missingLegalFields();

export default function ImpressumPage() {
  return (
    <main className="mx-auto min-h-screen w-[94%] max-w-5xl py-16 text-[var(--fc-text)]">
      <section className="panel-cut fc-panel">
        <p className="section-kicker">Rechtliches</p>
        <h1 className="section-title mt-3 text-5xl">Impressum</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--fc-text-muted)]">
          Dieses Impressum ist als produktionsnahe Struktur angelegt. Solange noch Pflichtangaben
          fehlen, sind sie unten ehrlich als nicht hinterlegt markiert.
        </p>

        {missing.length > 0 ? (
          <div className="mt-8 border border-[var(--fc-border-strong)] bg-[rgba(209,27,31,0.08)] p-5 text-sm leading-7 text-[var(--fc-text-muted)]">
            Vor dem Livegang ergänzen: {missing.join(", ")}.
          </div>
        ) : null}

        <div className="mt-8 grid gap-4">
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>Anbieter: {formatField(legalProfile.operatorName)}</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>Adresse: {formatField(legalProfile.addressLine1)}</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>
              Ort: {formatField(legalProfile.postalCode)} {formatField(legalProfile.city)}
            </span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>Land: {formatField(legalProfile.country)}</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>E-Mail: {formatField(legalProfile.email)}</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>Telefon: {formatField(legalProfile.phone)}</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>USt-IdNr.: {formatField(legalProfile.vatId)}</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>Verantwortliche Person: {formatField(legalProfile.responsiblePerson)}</span>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/" className="fc-button fc-button-primary">
            Zur Startseite
          </Link>
          <Link href="/datenschutz" className="fc-button fc-button-secondary">
            Datenschutz
          </Link>
        </div>
      </section>
    </main>
  );
}
