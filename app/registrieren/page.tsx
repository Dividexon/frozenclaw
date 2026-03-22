import Link from "next/link";
import { RegisterForm } from "@/components/register-form";

export default function RegistrierenPage() {
  return (
    <main className="mx-auto flex min-h-screen w-[94%] max-w-4xl items-center justify-center py-16 text-[var(--fc-text)]">
      <section className="panel-cut fc-panel w-full">
        <p className="section-kicker">Registrieren</p>
        <h1 className="section-title mt-3 text-5xl">Testzugang zuerst. Plan später.</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--fc-text-muted)]">
          Lege dir zuerst einen kostenlosen Testzugang an. Du bekommst eine begrenzte
          Frozenclaw-Instanz mit GPT-5.2, setzt dein Passwort direkt selbst und kannst die
          Oberfläche prüfen, bevor du dich für einen bezahlten Plan entscheidest.
        </p>

        <div className="mt-8 max-w-xl">
          <RegisterForm />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>Begrenzter Testzugang</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>GPT-5.2 mit kleinem Startkontingent</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>Passwort direkt bei der Registrierung</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/anmelden" className="fc-button fc-button-secondary">
            Bereits registriert? Anmelden
          </Link>
          <Link href="/" className="fc-button fc-button-secondary">
            Zur Startseite
          </Link>
        </div>
      </section>
    </main>
  );
}
