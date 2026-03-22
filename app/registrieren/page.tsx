import Link from "next/link";
import { CheckoutButton } from "@/components/checkout-button";
import { RegisterForm } from "@/components/register-form";

export default function RegistrierenPage() {
  return (
    <main className="mx-auto flex min-h-screen w-[94%] max-w-6xl items-center justify-center py-16 text-[var(--fc-text)]">
      <section className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel-cut fc-panel">
          <p className="section-kicker">Kostenlos testen</p>
          <h1 className="section-title mt-3 text-5xl">Testzugang mit GPT-4o mini.</h1>
          <p className="mt-5 text-base leading-8 text-[var(--fc-text-muted)]">
            Der Testzugang ist für einen kurzen echten Produkttest gedacht. Du legst direkt dein
            Konto mit E-Mail und Passwort an und landest danach sofort im Dashboard.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>100.000 Tokens mit GPT-4o mini</span>
            </div>
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>Eigene gehostete Testinstanz</span>
            </div>
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>Späteres Upgrade auf Standard oder Managed</span>
            </div>
          </div>

          <div className="mt-8">
            <RegisterForm />
          </div>
        </div>

        <div className="panel-cut fc-panel">
          <p className="section-kicker">Oder direkt bezahlen</p>
          <h2 className="section-title mt-3 text-4xl">Bezahlten Plan sofort aktivieren.</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--fc-text-muted)]">
            Wenn du direkt produktiv einsteigen willst, kannst du ohne Testzugang sofort einen
            bezahlten Plan buchen.
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

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/anmelden" className="fc-button fc-button-secondary">
              Bereits Kunde? Anmelden
            </Link>
            <Link href="/" className="fc-button fc-button-secondary">
              Zur Startseite
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
