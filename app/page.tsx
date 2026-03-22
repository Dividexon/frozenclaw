import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CheckoutButton } from "@/components/checkout-button";

const launchSignals = [
  "Eigene OpenClaw-Instanz pro Kunde",
  "Hosting in Deutschland",
  "Free Tier, BYOK und Managed",
  "Bereitstellung in der Regel am selben Tag",
];

const steps = [
  {
    id: "01",
    title: "Kostenlos testen oder direkt buchen",
    copy:
      "Du kannst erst mit einem kleinen Testzugang starten oder sofort einen bezahlten Plan buchen.",
  },
  {
    id: "02",
    title: "Instanz wird bereitgestellt",
    copy:
      "Frozenclaw richtet deine Instanz auf deutscher Infrastruktur ein und stellt den Zugang für dich bereit.",
  },
  {
    id: "03",
    title: "OpenClaw öffnen und nutzen",
    copy:
      "Du meldest dich an, öffnest deine Instanz und kannst direkt mit dem Agenten arbeiten.",
  },
];

const features = [
  {
    kicker: "Eigene Instanz",
    title: "Jeder Zugang läuft in einer eigenen Umgebung.",
    copy:
      "Jede Bestellung und jeder Testzugang bekommt einen eigenen Laufzeitkontext mit eigener URL und eigener OpenClaw-Instanz.",
  },
  {
    kicker: "Weniger Infrastruktur",
    title: "Du musst Server und Betrieb nicht selbst übernehmen.",
    copy:
      "Frozenclaw übernimmt Hosting, Bereitstellung und Erreichbarkeit, damit du dich auf den Agenten konzentrieren kannst.",
  },
  {
    kicker: "Klarer Einstieg",
    title: "Das Angebot ist bewusst in wenige Stufen geschnitten.",
    copy:
      "Free Tier für den kurzen Test, BYOK für eigenes Modell-Budget und Managed für Nutzer, die Modellzugang direkt mitbuchen wollen.",
  },
];

const freeTierIncludes = [
  "1 gehostete Testinstanz",
  "GPT-4o mini als Testmodell",
  "100.000 Tokens für einen kurzen echten Test",
  "E-Mail + Passwort statt Mail-Warten",
  "Upgrade auf bezahlte Pläne jederzeit möglich",
  "Für Produkttest statt Dauerbetrieb gedacht",
];

const byokIncludes = [
  "1 gehostete OpenClaw-Instanz",
  "Eigener API-Key des Kunden",
  "Hosting in Deutschland",
  "Startanleitung für die ersten Schritte",
  "E-Mail-Support während der Beta",
  "Bereitstellung in der Regel am selben Tag",
];

const managedStarterIncludes = [
  "1 gehostete OpenClaw-Instanz",
  "GPT-5.2 als festes Modell",
  "500.000 Tokens pro Monat",
  "Verbrauch wird automatisch mitgerechnet",
  "Geeignet für den Einstieg",
  "Nachbuchung später zubuchbar",
];

const managedPlusIncludes = [
  "1 gehostete OpenClaw-Instanz",
  "GPT-5.2 als festes Modell",
  "3 Mio. Tokens pro Monat",
  "Verbrauch wird automatisch mitgerechnet",
  "Für regelmäßige Nutzung",
  "Nachbuchung später zubuchbar",
];

const managedAdvancedIncludes = [
  "1 gehostete OpenClaw-Instanz",
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
  ["Zugang", "Eigene URL pro Instanz"],
  ["Testzugang", "GPT-4o mini mit 100.000 Tokens"],
  ["Managed", "GPT-5.2 mit Starter, Plus und Advanced"],
  ["Support", "E-Mail + Startanleitung"],
];

const faqs = [
  {
    question: "Gibt es einen kostenlosen Testzugang?",
    answer:
      "Ja. Der Free Tier läuft auf GPT-4o mini mit 100.000 Tokens und ist für einen kurzen echten Produkttest gedacht.",
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
    question: "Brauche ich eigene Server oder Docker-Kenntnisse?",
    answer:
      "Nein. Du musst keinen eigenen Server betreiben und keine Infrastruktur selbst dauerhaft am Laufen halten.",
  },
  {
    question: "Ist das schon ein komplett ausgereiftes SaaS?",
    answer:
      "Nein. Es ist eine bezahlte Beta mit bewusst klarem Scope. Der Kern soll funktionieren, bevor der Rest ausgebaut wird.",
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
    <article className="panel-cut fc-panel pricing-panel">
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--fc-border)] pb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--fc-accent-soft)]">{kicker}</p>
          <h3 className="mt-2 font-display text-5xl uppercase text-[var(--fc-text)]">{title}</h3>
        </div>
        <div className="text-right">
          <p className="font-display text-6xl leading-none text-[var(--fc-text)]">{price}</p>
        </div>
      </div>

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

      <div className="mt-8 flex flex-wrap gap-4">
        {cta}
        {secondary}
      </div>
    </article>
  );
}

export default function Home() {
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
            <Link href="/anmelden" className="transition hover:text-[var(--fc-text)]">
              Anmelden
            </Link>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/registrieren" className="fc-button fc-button-primary">
              Kostenlos testen
            </Link>
            <Link href="/anmelden" className="fc-button fc-button-secondary">
              Anmelden
            </Link>
          </div>
        </header>

        <section className="mx-auto grid min-h-[calc(100vh-88px)] w-[94%] max-w-7xl items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="space-y-8">
            <div className="fc-chip">
              <span className="fc-chip-dot" />
              Gehostetes OpenClaw aus Deutschland
            </div>

            <div className="space-y-5">
              <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--fc-accent-soft)]">
                Gehostetes OpenClaw aus Deutschland
              </p>
              <h1 className="font-display text-6xl uppercase leading-[0.88] text-[var(--fc-text)] sm:text-7xl lg:text-[7.5rem]">
                Dein eigener
                <span className="block text-[var(--fc-accent)]">KI-Agent.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--fc-text-muted)] sm:text-xl">
                Frozenclaw hostet deine private OpenClaw-Instanz auf deutscher Infrastruktur. Du
                kannst erst mit einem kleinen Free Tier testen und danach in BYOK oder Managed
                wechseln.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/registrieren" className="fc-button fc-button-primary">
                Kostenlos testen
              </Link>
              <a href="#preise" className="fc-button fc-button-secondary">
                Pläne ansehen
              </a>
              <Link href="/anmelden" className="fc-button fc-button-secondary">
                Anmelden
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
                  <span className="stat-label">Standort</span>
                  <strong className="stat-value">Nur EU</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ueberblick" className="mx-auto w-[94%] max-w-7xl pb-10">
          <div className="data-strip">
            <span>OpenClaw Hosting</span>
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
                    Gehostetes OpenClaw
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
                  Der Start richtet sich an Founder, Power-User und kleine Teams, die OpenClaw
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
              note="Der Free Tier ist für einen kurzen echten Produkttest gedacht und führt danach in einen bezahlten Plan."
              cta={
                <Link href="/registrieren" className="fc-button fc-button-primary">
                  Kostenlos testen
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
                <CheckoutButton planId="hosted_byok" className="fc-button fc-button-primary">
                  Jetzt starten
                </CheckoutButton>
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
              kicker="Managed"
              title="Starter"
              price="EUR 9,90"
              includes={managedStarterIncludes}
              note="Der Einstiegsplan ist bewusst knapp gehalten und eignet sich für den ersten Managed-Einstieg."
              cta={
                <CheckoutButton planId="managed_starter" className="fc-button fc-button-primary">
                  Jetzt starten
                </CheckoutButton>
              }
              secondary={
                <a href="#faq" className="fc-button fc-button-secondary">
                  Mehr dazu
                </a>
              }
            />

            <PricingCard
              kicker="Managed"
              title="Plus"
              price="EUR 39"
              includes={managedPlusIncludes}
              note="Der mittlere Managed-Plan für regelmäßige Nutzung mit deutlich mehr Spielraum."
              cta={
                <CheckoutButton planId="managed_immediate" className="fc-button fc-button-primary">
                  Jetzt starten
                </CheckoutButton>
              }
              secondary={
                <a href="#faq" className="fc-button fc-button-secondary">
                  Mehr dazu
                </a>
              }
            />

            <PricingCard
              kicker="Managed"
              title="Advanced"
              price="EUR 59"
              includes={managedAdvancedIncludes}
              note="Für Nutzer, die GPT-5.2 regelmäßig einsetzen und mehr Reserve pro Monat wollen."
              cta={
                <CheckoutButton planId="managed_advanced" className="fc-button fc-button-primary">
                  Jetzt starten
                </CheckoutButton>
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
                Erst testen, dann produktiv einsteigen.
              </h3>
              <p className="mt-4 text-base leading-7 text-[var(--fc-text-muted)]">
                Der Free Tier soll das Produkt erlebbar machen. Für echten Dauerbetrieb wechselst du
                danach in BYOK oder Managed.
              </p>
            </div>

            <div className="panel-cut fc-panel">
              <p className="section-kicker">Nach der Bestellung</p>
              <ol className="mt-4 space-y-4 text-base text-[var(--fc-text-muted)]">
                <li>01. Konto anlegen oder Plan buchen.</li>
                <li>02. Provisionierung legt deine Instanz an.</li>
                <li>03. Du erhältst Zugang zu deinem Dashboard.</li>
                <li>04. Du öffnest OpenClaw und arbeitest direkt los.</li>
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
              Gehostetes OpenClaw aus Deutschland für Founder, Power-User und kleine Teams, die
              ihren eigenen Agenten nutzen möchten, ohne den Server selbst zu betreiben.
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
