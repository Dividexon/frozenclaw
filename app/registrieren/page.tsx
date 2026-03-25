import Link from "next/link";
import { RegisterForm } from "@/components/register-form";
import { getFreeTierAvailability } from "@/lib/trial";

export const dynamic = "force-dynamic";

export default function RegistrierenPage() {
  const availability = getFreeTierAvailability();
  const disabledReason = availability.isAvailable
    ? `Free Tier aktuell: ${availability.remainingAccounts} von ${availability.accountLimit} Konten noch frei.`
    : "Der Free Tier ist aktuell ausgeschöpft. Bitte wähle direkt einen bezahlten Plan.";

  return (
    <main className="mx-auto flex min-h-screen w-[94%] max-w-6xl items-center justify-center py-16 text-[var(--fc-text)]">
      <section className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel-cut fc-panel">
          <p className="section-kicker">Kostenlos testen</p>
          <h1 className="section-title mt-3 text-5xl">Free Tier mit GPT-4o mini.</h1>
          <p className="mt-5 text-base leading-8 text-[var(--fc-text-muted)]">
            Der Free Tier ist für einen kurzen echten Produkttest gedacht. Du legst direkt dein
            Konto mit E-Mail und Passwort an und landest danach sofort im Dashboard.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>100.000 Tokens mit GPT-4o mini</span>
            </div>
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>Einmalig pro E-Mail-Adresse</span>
            </div>
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>Global auf 100 Free-Tier-Konten begrenzt</span>
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
            <RegisterForm disabled={!availability.isAvailable} disabledReason={disabledReason} />
          </div>
        </div>

        <div className="panel-cut fc-panel">
          <p className="section-kicker">Danach im Dashboard</p>
          <h2 className="section-title mt-3 text-4xl">Plan wählen und direkt weitermachen.</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--fc-text-muted)]">
            Nach der Registrierung landest du sofort im Dashboard. Dort kannst du deinen
            Free Tier nutzen oder direkt in einen bezahlten Plan wechseln, ohne einen
            zusätzlichen Zwischenschritt.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>Login und Registrierung laufen nur noch über E-Mail und Passwort</span>
            </div>
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>Im Dashboard kannst du auf Standard oder Managed wechseln</span>
            </div>
            <div className="signal-row">
              <span className="signal-index">+</span>
              <span>Bestehende Instanz und Konto bleiben dabei erhalten</span>
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
        </div>
      </section>
    </main>
  );
}
