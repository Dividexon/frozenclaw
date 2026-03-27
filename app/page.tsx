import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { resolveSessionAccessFromCookies } from "@/lib/auth";
import { getFreeTierAvailability } from "@/lib/trial";

const launchSignals = [
  "Eigene Instanz pro Kunde",
  "Chat direkt im Browser",
  "Hosting in Deutschland",
  "Free Tier, BYOK und Managed",
];

const steps = [
  {
    id: "01",
    title: "Konto anlegen und starten",
    copy:
      "Du registrierst dich mit E-Mail und Passwort, landest direkt im Dashboard und kannst dort Free Tier oder einen bezahlten Plan nutzen.",
  },
  {
    id: "02",
    title: "Instanz wird bereitgestellt",
    copy:
      "Frozenclaw richtet deine Instanz auf eigener Infrastruktur in Deutschland ein und hält den Zugang für dich bereit.",
  },
  {
    id: "03",
    title: "Chat im Browser öffnen",
    copy:
      "Du öffnest deinen Chat direkt aus dem Dashboard und arbeitest ohne zusätzliche Verbindungsschritte in der Browser-Oberfläche.",
  },
];

const features = [
  {
    kicker: "Eigene Instanz",
    title: "Jeder Zugang läuft in einer eigenen Umgebung.",
    copy:
      "Jede Bestellung und jeder Free-Tier-Zugang bekommt einen eigenen Laufzeitkontext mit eigener URL, eigener Agentenlaufzeit und eigener Chat-Oberfläche.",
  },
  {
    kicker: "Weniger Infrastruktur",
    title: "Du musst Server und Betrieb nicht selbst übernehmen.",
    copy:
      "Frozenclaw übernimmt Hosting, Bereitstellung und Erreichbarkeit, damit du dich auf Aufgaben, Automationen und deinen Agenten konzentrieren kannst.",
  },
  {
    kicker: "Klarer Einstieg",
    title: "Das Angebot ist bewusst in wenige Stufen geschnitten.",
    copy:
      "Free Tier für den kurzen Produkttest, BYOK für eigenes Modellbudget und Managed für Nutzer, die Modellzugang direkt mitbuchen wollen.",
  },
];

const freeTierIncludes = [
  "1 gehostete Testinstanz",
  "GPT-4o mini als Testmodell",
  "100.000 Tokens einmalig pro E-Mail-Adresse",
  "Chat direkt im Browser",
  "Upgrade auf bezahlte Pläne jederzeit möglich",
  "Global auf 100 Free-Tier-Konten begrenzt",
];

const byokIncludes = [
  "1 gehostete Instanz mit Browser-Chat",
  "Eigener API-Key des Kunden",
  "Hosting in Deutschland",
  "Startanleitung für die ersten Schritte",
  "E-Mail-Support während der Beta",
  "Bereitstellung in der Regel am selben Tag",
];

const managedStarterIncludes = [
  "1 gehostete Instanz mit Browser-Chat",
  "GPT-5.2 als festes Modell",
  "500.000 Tokens pro Monat",
  "Verbrauch wird automatisch mitgerechnet",
  "Geeignet für den Einstieg",
  "Nachbuchung später zubuchbar",
];

const managedPlusIncludes = [
  "1 gehostete Instanz mit Browser-Chat",
  "GPT-5.2 als festes Modell",
  "3 Mio. Tokens pro Monat",
  "Verbrauch wird automatisch mitgerechnet",
  "Für regelmäßige Nutzung",
  "Nachbuchung später zubuchbar",
];

const managedAdvancedIncludes = [
  "1 gehostete Instanz mit Browser-Chat",
  "GPT-5.2 als festes Modell",
  "5 Mio. Tokens pro Monat",
  "Verbrauch wird automatisch mitgerechnet",
  "Mehr Spielraum für laufende Nutzung",
  "Nachbuchung später zubuchbar",
];

const useCases = [
  {
    title: "Recherche",
    copy:
      "Für Nutzer, die Themen, Märkte oder Unternehmen mit einem eigenen Agenten strukturierter aufarbeiten möchten.",
  },
  {
    title: "Content und Ideen",
    copy:
      "Für Entwürfe, Zusammenfassungen und wiederkehrende kreative Arbeitsabläufe auf Basis deiner eigenen Instanz.",
  },
  {
    title: "Interne Workflows",
    copy:
      "Für kleine Teams, die Wissen, Prozesse oder wiederkehrende Aufgaben mit einem Agenten unterstützen möchten.",
  },
  {
    title: "Geplante Routinen",
    copy:
      "Für Aufgaben, die regelmäßig laufen sollen und nicht jedes Mal manuell angestoßen werden müssen.",
  },
];

const specRows = [
  ["Zielgruppe", "Founder, Power-User, kleine Teams"],
  ["Region", "Deutschland"],
  ["Zugang", "Eigene URL und Browser-Chat pro Instanz"],
  ["Free Tier", "GPT-4o mini mit 100.000 Tokens"],
  ["Managed", "GPT-5.2 mit Starter, Plus und Advanced"],
  ["Support", "E-Mail + Startanleitung"],
];

const faqs = [
  {
    question: "Gibt es einen kostenlosen Testzugang?",
    answer:
      "Ja. Der Free Tier läuft auf GPT-4o mini mit 100.000 Tokens, ist einmalig pro E-Mail-Adresse und auf insgesamt 100 Konten begrenzt.",
  },
  {
    question: "Muss ich meinen eigenen API-Key mitbringen?",
    answer:
      "Beim Standardplan ja. Dort bringst du deinen eigenen Modell-Key mit. Im Managed-Bereich stellt Frozenclaw den Modellzugang direkt bereit.",
  },
  {
    question: "Was bedeutet Managed konkret?",
    answer:
      "Managed ist für Nutzer gedacht, die keinen eigenen API-Key verwalten möchten. Frozenclaw stellt dort GPT-5.2 bereit und rechnet den Verbrauch intern mit.",
  },
  {
    question: "Welche Managed-Stufen gibt es?",
    answer:
      "Managed Starter liegt bei 9,90 EUR mit 500.000 Tokens pro Monat. Managed Plus liegt bei 39 EUR mit 3 Mio. Tokens pro Monat. Managed Advanced liegt bei 59 EUR mit 5 Mio. Tokens pro Monat.",
  },
  {
    question: "Wie nutze ich den Chat?",
    answer:
      "Du öffnest deine Instanz direkt aus dem Dashboard. Frozenclaw leitet dich in die Chat-Oberfläche im Browser. Die direkte OpenClaw-Verbindung bleibt nur als erweiterter Fallback sichtbar.",
  },
  {
    question: "Warum ist der Tokenverbrauch am Anfang oft höher?",
    answer:
      "Beim ersten Einlesen einer frischen Instanz kann deutlich mehr Kontext verarbeitet werden. Danach läuft der Verbrauch in der Regel deutlich normaler.",
  },
];

function FrozenclawIcon() {
  return (
    <Image
      src="/frozenclaw-logo.png"
      alt=""
      width={48}
      height={48}
      className="h-12 w-12 shrink-0 object-contain"
      priority
    />
  );
}

function PricingCard({
  kicker,
  title,
  price,
  includes,
  cta,
  secondary,
  note,
}: {
  kicker: string;
  title: string;
  price: string;
  includes: string[];
  cta: ReactNode;
  secondary?: ReactNode;
  note?: string;
}) {
  return (
    <article className="panel-cut fc-panel pricing-panel flex h-full flex-col">
      <div className="border-b border-[var(--fc-border)] pb-6">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--fc-accent-soft)]">{kicker}</p>
        <h3 className="mt-2 whitespace-pre-line font-display text-5xl uppercase text-[var(--fc-text)]">
          {title}
        </h3>
        <div className="mt-4">
          <p className="font-display text-6xl leading-none text-[var(--fc-text)]">{price}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {includes.map((item) => (
            <div key={item} className="signal-row">
              <span className="signal-index">+</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        {note ? (
          <div className="mt-6 border border-[var(--fc-border)] bg-[rgba(255,255,255,0.025)] p-4 text-sm leading-7 text-[var(--fc-text-muted)]">
            {note}
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        {cta}
        {secondary}
      </div>
    </article>
  );
}

export default async function Home() {
  const access = await resolveSessionAccessFromCookies();
  const freeTierAvailability = getFreeTierAvailability();
  const accountHref = access ? "/konto" : "/anmelden";
  const accountLabel = access ? "Dashboard" : "Anmelden";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--fc-bg)] text-[var(--fc-text)]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="grid-overlay absolute inset-0" />
        <div className="hazard-glow absolute inset-0" />
        <div className="noise-overlay absolute inset-0" />
      </div>

      <div className="relative z-10">
        <header className="mx-auto flex w-[94%] max-w-7xl items-center justify-between border-b border-[var(--fc-border-strong)] py-5">
          <a href="#" className="flex items-center gap-3 text-[var(--fc-text)]">
            <span className="brand-lockup">
              <FrozenclawIcon />
            </span>
            <span className="font-display text-2xl uppercase tracking-[0.18em]">Frozenclaw</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)] md:flex">
            <a href="#ablauf" className="transition hover:text-[var(--fc-text)]">
              Ablauf
            </a>
            <a href="#preise" className="transition hover:text-[var(--fc-text)]">
              Preise
            </a>
            <a href="#faq" className="transition hover:text-[var(--fc-text)]">
              Fragen
            </a>
            <Link href={accountHref} className="transition hover:text-[var(--fc-text)]">
              {accountLabel}
            </Link>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/registrieren" className="fc-button fc-button-primary">
              {freeTierAvailability.isAvailable ? "Kostenlos testen" : "Free Tier voll"}
            </Link>
            <Link href={accountHref} className="fc-button fc-button-secondary">
              {accountLabel}
            </Link>
          </div>
        </header>

        <section className="mx-auto grid min-h-[calc(100vh-88px)] w-[94%] max-w-7xl items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="space-y-8">
            <div className="fc-chip">
              <span className="fc-chip-dot" />
              Eigene Agenteninstanzen aus Deutschland
            </div>

            <div className="space-y-5">
              <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--fc-accent-soft)]">
                Browser-Chat statt Infrastrukturstress
              </p>
              <h1 className="font-display text-6xl uppercase leading-[0.88] text-[var(--fc-text)] sm:text-7xl lg:text-[7.5rem]">
                Dein persönlicher
                <span className="block text-[var(--fc-accent)]">KI-Agent.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--fc-text-muted)] sm:text-xl">
                Frozenclaw hostet deine private Agenteninstanz auf eigener Infrastruktur in einer
                kontrollierten Umgebung in Deutschland und stellt dir den Chat direkt im Browser
                bereit.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/registrieren" className="fc-button fc-button-primary">
                Kostenlos testen
              </Link>
              <a href="#preise" className="fc-button fc-button-secondary">
                Pläne ansehen
              </a>
              <Link href={accountHref} className="fc-button fc-button-secondary">
                {accountLabel}
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {launchSignals.map((signal) => (
                <div key={signal} className="signal-row">
                  <span className="signal-index">+</span>
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="vault-panel panel-cut">
              <div className="vault-topline">
                <span>INSTANZSTATUS</span>
                <span>GEHOSTET / AKTIV</span>
              </div>

              <div className="vault-core-wrap">
                <div className="vault-ring" />
                <div className="vault-door">
                  <div className="vault-spoke vault-spoke-a" />
                  <div className="vault-spoke vault-spoke-b" />
                  <div className="vault-spoke vault-spoke-c" />
                  <div className="vault-center">
                    <span className="font-display text-xs uppercase tracking-[0.35em] text-[var(--fc-accent-soft)]">
                      online
                    </span>
                  </div>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <span
                      key={index}
                      className="vault-bolt"
                      style={{ transform: `rotate(${index * 45}deg) translateY(-9.75rem)` }}
                    />
                  ))}
                </div>
                <div className="vault-beam" />
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="stat-block">
                  <span className="stat-label">Free Tier</span>
                  <strong className="stat-value">GPT-4o mini</strong>
                </div>
                <div className="stat-block">
                  <span className="stat-label">Managed</span>
                  <strong className="stat-value">GPT-5.2</strong>
                </div>
                <div className="stat-block">
                  <span className="stat-label">Zugang</span>
                  <strong className="stat-value">Browser-Chat</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ueberblick" className="mx-auto w-[94%] max-w-7xl pb-10">
          <div className="data-strip">
            <span>Browser-Chat</span>
            <span>Private Instanz</span>
            <span>Hosting in Deutschland</span>
            <span>Free Tier zum Testen</span>
            <span>Managed mit GPT-5.2</span>
            <span>Startanleitung inklusive</span>
          </div>
        </section>

        <section id="ablauf" className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Ablauf</p>
            <h2 className="section-title">So startet Frozenclaw.</h2>
            <p className="section-copy">
              Erst testen, dann buchen. Oder direkt in einen bezahlten Plan einsteigen.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {steps.map((step) => (
              <article key={step.id} className="panel-cut fc-panel h-full">
                <p className="font-display text-5xl leading-none text-[var(--fc-accent)]">{step.id}</p>
                <h3 className="mt-5 text-2xl font-semibold text-[var(--fc-text)]">{step.title}</h3>
                <p className="mt-4 text-base leading-7 text-[var(--fc-text-muted)]">{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Angebot</p>
            <h2 className="section-title">Was du hier tatsächlich kaufst.</h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="panel-cut fc-panel">
              <div className="mb-8 flex items-center justify-between gap-4 border-b border-[var(--fc-border)] pb-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--fc-accent-soft)]">
                    Leistungsumfang
                  </p>
                  <h3 className="mt-2 font-display text-4xl uppercase text-[var(--fc-text)]">
                    Gehosteter Browser-Chat
                  </h3>
                </div>
                <span className="fc-chip">Private Instanz pro Kunde</span>
              </div>

              <div className="grid gap-5">
                {features.map((feature) => (
                  <div key={feature.title} className="feature-row">
                    <p className="feature-kicker">{feature.kicker}</p>
                    <h4 className="feature-title">{feature.title}</h4>
                    <p className="feature-copy">{feature.copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5">
              <div className="panel-cut fc-panel">
                <p className="section-kicker">Signalprofil</p>
                <div className="mt-4 space-y-4">
                  {specRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 border-b border-[var(--fc-border)] pb-3 text-sm uppercase tracking-[0.14em]"
                    >
                      <span className="text-[var(--fc-text-muted)]">{label}</span>
                      <span className="text-right text-[var(--fc-text)]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-cut fc-panel">
                <p className="section-kicker">Für wen das gedacht ist</p>
                <h3 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">
                  Für Nutzer, die einen Agenten wollen, aber keinen Server betreiben möchten.
                </h3>
                <p className="mt-4 text-base leading-7 text-[var(--fc-text-muted)]">
                  Der Start richtet sich an Founder, Power-User und kleine Teams, die einen Agenten
                  praktisch nutzen wollen, ohne sich um den Betrieb kümmern zu müssen.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Einsatzbereiche</p>
            <h2 className="section-title">Wofür Frozenclaw am Anfang gedacht ist.</h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {useCases.map((item) => (
              <article key={item.title} className="panel-cut fc-panel">
                <p className="section-kicker">{item.title}</p>
                <p className="mt-4 text-base leading-8 text-[var(--fc-text-muted)]">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="preise" className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Preise</p>
            <h2 className="section-title">Klarer Einstieg, klare Stufen.</h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <PricingCard
              kicker="Kostenlos testen"
              title="Free Tier"
              price="EUR 0"
              includes={freeTierIncludes}
              note={
                freeTierAvailability.isAvailable
                  ? `Der Free Tier ist für einen kurzen Produkttest gedacht. Aktuell sind noch ${freeTierAvailability.remainingAccounts} von ${freeTierAvailability.accountLimit} Konten frei.`
                  : "Der Free Tier ist aktuell ausgeschöpft. Neue Nutzer wählen direkt einen bezahlten Plan."
              }
              cta={
                <Link href="/registrieren" className="fc-button fc-button-primary">
                  {freeTierAvailability.isAvailable ? "Kostenlos testen" : "Verfügbarkeit prüfen"}
                </Link>
              }
              secondary={
                <a href="#faq" className="fc-button fc-button-secondary">
                  Mehr dazu
                </a>
              }
            />

            <PricingCard
              kicker="Jetzt buchbar"
              title="Standardplan"
              price="EUR 19"
              includes={byokIncludes}
              cta={
                <Link href="/registrieren" className="fc-button fc-button-primary">
                  Konto anlegen
                </Link>
              }
              secondary={
                <a href="#faq" className="fc-button fc-button-secondary">
                  Fragen klären
                </a>
              }
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <PricingCard
              kicker="Jetzt buchbar"
              title={"Managed\nStarter"}
              price="EUR 9,90"
              includes={managedStarterIncludes}
              note="Der Einstiegsplan ist bewusst knapp gehalten und eignet sich für den ersten Managed-Einstieg."
              cta={
                <Link href="/registrieren" className="fc-button fc-button-primary">
                  Konto anlegen
                </Link>
              }
              secondary={
                <a href="#faq" className="fc-button fc-button-secondary">
                  Mehr dazu
                </a>
              }
            />

            <PricingCard
              kicker="Jetzt buchbar"
              title={"Managed\nPlus"}
              price="EUR 39"
              includes={managedPlusIncludes}
              note="Der mittlere Managed-Plan für regelmäßige Nutzung mit deutlich mehr Spielraum."
              cta={
                <Link href="/registrieren" className="fc-button fc-button-primary">
                  Konto anlegen
                </Link>
              }
              secondary={
                <a href="#faq" className="fc-button fc-button-secondary">
                  Mehr dazu
                </a>
              }
            />

            <PricingCard
              kicker="Jetzt buchbar"
              title={"Managed\nAdvanced"}
              price="EUR 59"
              includes={managedAdvancedIncludes}
              note="Für Nutzer, die GPT-5.2 regelmäßig einsetzen und mehr Reserve pro Monat wollen."
              cta={
                <Link href="/registrieren" className="fc-button fc-button-primary">
                  Konto anlegen
                </Link>
              }
              secondary={
                <a href="#faq" className="fc-button fc-button-secondary">
                  Mehr dazu
                </a>
              }
            />
          </div>
        </section>

        <section className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="panel-cut fc-panel">
              <p className="section-kicker">Launch-Hinweis</p>
              <h3 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">
                Erst registrieren, dann im eigenen Konto entscheiden.
              </h3>
              <p className="mt-4 text-base leading-7 text-[var(--fc-text-muted)]">
                Der Free Tier soll das Produkt erlebbar machen. Für echten Dauerbetrieb wechselst du
                danach in BYOK oder Managed.
              </p>
            </div>

            <div className="panel-cut fc-panel">
              <p className="section-kicker">Nach dem Start</p>
              <ol className="mt-4 space-y-4 text-base text-[var(--fc-text-muted)]">
                <li>01. Konto mit E-Mail und Passwort anlegen.</li>
                <li>02. Im Dashboard testen oder bezahlten Plan wählen.</li>
                <li>03. Chat direkt aus deinem Dashboard öffnen.</li>
                <li>04. Kanäle, Routinen und Cronjobs danach Schritt für Schritt aufbauen.</li>
              </ol>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">FAQ</p>
            <h2 className="section-title">Die wichtigsten Fragen direkt beantwortet.</h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {faqs.map((item) => (
              <article key={item.question} className="panel-cut fc-panel">
                <h3 className="text-2xl font-semibold text-[var(--fc-text)]">{item.question}</h3>
                <p className="mt-4 text-base leading-7 text-[var(--fc-text-muted)]">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mx-auto grid w-[94%] max-w-7xl gap-6 border-t border-[var(--fc-border-strong)] py-8 text-sm uppercase tracking-[0.14em] text-[var(--fc-text-muted)] md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="brand-lockup">
                <FrozenclawIcon />
              </span>
              <p className="font-display text-3xl text-[var(--fc-text)]">Frozenclaw</p>
            </div>
            <p className="mt-2 max-w-xl text-xs leading-6 text-[var(--fc-text-muted)]">
              Gehostete Agenteninstanzen aus Deutschland für Founder, Power-User und kleine Teams,
              die ihren eigenen Agenten nutzen möchten, ohne den Server selbst zu betreiben.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 md:justify-end">
            <Link href="/impressum" className="transition hover:text-[var(--fc-text)]">
              Impressum
            </Link>
            <Link href="/datenschutz" className="transition hover:text-[var(--fc-text)]">
              Datenschutz
            </Link>
            <Link href="/beta-bedingungen" className="transition hover:text-[var(--fc-text)]">
              Beta-Bedingungen
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
