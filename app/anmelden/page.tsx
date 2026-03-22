import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function AnmeldenPage() {
  return (
    <main className="mx-auto flex min-h-screen w-[94%] max-w-4xl items-center justify-center py-16 text-[var(--fc-text)]">
      <section className="panel-cut fc-panel w-full">
        <p className="section-kicker">Anmelden</p>
        <h1 className="section-title mt-3 text-5xl">Zugang mit E-Mail und Passwort.</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--fc-text-muted)]">
          Melde dich mit der E-Mail-Adresse deiner Frozenclaw-Bestellung und deinem Passwort an.
          Falls du noch kein Passwort gesetzt hast, kannst du einmalig weiterhin einen Login-Link
          per Mail anfordern.
        </p>

        <div className="mt-8 max-w-xl">
          <LoginForm />
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/" className="fc-button fc-button-secondary">
            Zur Startseite
          </Link>
        </div>
      </section>
    </main>
  );
}
