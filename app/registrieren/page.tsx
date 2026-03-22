import Link from "next/link";
import { CheckoutButton } from "@/components/checkout-button";

export default function RegistrierenPage() {
  return (
    <main className="mx-auto flex min-h-screen w-[94%] max-w-4xl items-center justify-center py-16 text-[var(--fc-text)]">
      <section className="panel-cut fc-panel w-full">
        <p className="section-kicker">Direkt starten</p>
        <h1 className="section-title mt-3 text-5xl">Plan wählen. Bezahlen. Danach anmelden.</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--fc-text-muted)]">
          Frozenclaw arbeitet ohne Test- oder Trial-Stufe. Du wählst direkt einen bezahlten Plan,
          schließt den Checkout ab und setzt danach dein Passwort für dein Konto.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <CheckoutButton planId="hosted_byok" className="fc-button fc-button-primary">
            Standardplan buchen
          </CheckoutButton>
          <CheckoutButton planId="managed_starter" className="fc-button fc-button-secondary">
            Managed Starter buchen
          </CheckoutButton>
          <CheckoutButton planId="managed_immediate" className="fc-button fc-button-secondary">
            Managed Plus buchen
          </CheckoutButton>
          <CheckoutButton planId="managed_advanced" className="fc-button fc-button-secondary">
            Managed Advanced buchen
          </CheckoutButton>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>Direkter Start ohne Trial</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>Standard oder Managed direkt buchbar</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>Passwort nach dem Kauf setzen</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/anmelden" className="fc-button fc-button-secondary">
            Bereits Kunde? Anmelden
          </Link>
          <Link href="/" className="fc-button fc-button-secondary">
            Zur Startseite
          </Link>
        </div>
      </section>
    </main>
  );
}
