import { CheckoutButton } from "@/components/checkout-button";

const launchSignals = [
  "EU-Hosting in Deutschland",
  "Eigene OpenClaw-Instanz pro Kunde",
  "Provisionierung in Minuten statt Tagen",
  "BYOK sofort, Managed nur kontrolliert",
];

const steps = [
  {
    id: "01",
    title: "Zugang sichern",
    copy:
      "Du buchst deinen Slot und erhältst eine eigene gehostete OpenClaw-Instanz statt einer geteilten Spielzeug-Oberfläche.",
  },
  {
    id: "02",
    title: "Instanz wird bereitgestellt",
    copy:
      "Frozenclaw deployt deine Umgebung auf EU-Infrastruktur und legt einen eigenen Zugangspfad für deine Instanz an.",
  },
  {
    id: "03",
    title: "Mit eigenem oder gestelltem Key nutzen",
    copy:
      "Im Startmodus bringst du deinen eigenen Modell-Key mit. Managed kommt als begrenzte Beta dazu, sobald Usage-Tracking aktiv ist.",
  },
];

const features = [
  {
    kicker: "Private Instanz",
    title: "Dein Agent, nicht ein gemeinsam benutzter Container.",
    copy:
      "Jeder Kunde bekommt eine eigene gehostete Instanz mit eigenem Pfad, Token und sauberem Betriebszustand.",
  },
  {
    kicker: "Klarer Start",
    title: "Kein Home-Lab. Kein Docker-Gefrickel.",
    copy:
      "Der Nutzen ist bewusst direkt: buchen, bereitstellen, Schlüssel hinterlegen, Agent laufen lassen.",
  },
  {
    kicker: "Kontrollierter Rollout",
    title: "Erst belastbar starten, dann ausbauen.",
    copy:
      "Frozenclaw wird nicht als fertige Enterprise-Maschine verkauft, sondern als ehrlicher Beta-Launch mit klarer Roadmap.",
  },
];

const byokIncludes = [
  "1 gehostete OpenClaw-Instanz",
  "Eigener API-Key des Kunden",
  "EU-Hosting-Footprint in Deutschland",
  "Direkter Support während der Beta",
  "Schnelle Provisionierung",
  "Beste Startoption für den Launch",
];

const managedIncludes = [
  "1 gehostete OpenClaw-Instanz",
  "Modell-Key wird von uns gestellt",
  "Pilot mit 5 verfügbaren Plätzen",
  "Zunächst konservatives Usage-Limit",
  "Separates Cron-Limit vorgesehen",
  "Freischaltung erst mit aktivem Tracking",
];

const specRows = [
  ["Region", "Deutschland"],
  ["Zugang", "app.frozenclaw.com/agent/..."],
  ["Modus", "OpenClaw Hosting Beta"],
  ["Provisionierung", "Automatisch mit manuellem Fallback"],
  ["Öffentlich", "BYOK"],
  ["Pilot", "Managed Beta mit 5 Slots"],
];

const faqs = [
  {
    question: "Muss ich meinen eigenen API-Key mitbringen?",
    answer:
      "Beim öffentlichen Start ja. Hosted BYOK ist das Standardangebot. Managed wird als begrenzter Pilot angeboten, sobald wir den Verbrauch sauber pro Kunde messen können.",
  },
  {
    question: "Was bedeutet Managed Beta konkret?",
    answer:
      "Wir stellen den Modell-Key, aber nur in einem kleinen Pilot mit festen Plätzen und klaren Nutzungsgrenzen. Ohne verifiziertes Credit-Tracking wird dieser Modus nicht breit freigeschaltet.",
  },
  {
    question: "Brauche ich eigene Server oder Docker-Kenntnisse?",
    answer:
      "Nein. Der Sinn von Frozenclaw ist gerade, dir das Hosting und den Betriebsaufwand abzunehmen.",
  },
  {
    question: "Ist das schon ein komplett ausgereiftes SaaS?",
    answer:
      "Nein. Es ist eine bezahlte Beta: nützlich, hostbar und klar fokussiert, aber noch bewusst vor dem großen Ausbau.",
  },
];

function FrozenclawIcon({ idPrefix }: { idPrefix: string }) {
  const glowId = `${idPrefix}-glow`;
  const iceId = `${idPrefix}-ice`;
  const edgeId = `${idPrefix}-edge`;
  const darkId = `${idPrefix}-dark`;

  return (
    <svg
      viewBox="0 0 120 120"
      className="h-12 w-12 shrink-0"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#b9f8ff" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#37b3ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#061325" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={iceId} x1="12%" y1="8%" x2="88%" y2="92%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="24%" stopColor="#d7fbff" />
          <stop offset="52%" stopColor="#79deff" />
          <stop offset="78%" stopColor="#468eff" />
          <stop offset="100%" stopColor="#1a2c78" />
        </linearGradient>
        <linearGradient id={edgeId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#8ce6ff" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={darkId} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#11244a" />
          <stop offset="100%" stopColor="#071124" />
        </linearGradient>
        <filter id={`${idPrefix}-blur`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6.5" />
        </filter>
      </defs>

      <circle
        cx="60"
        cy="60"
        r="40"
        fill={`url(#${glowId})`}
        filter={`url(#${idPrefix}-blur)`}
        opacity="0.9"
      />

      <path
        d="M76 16c12 2 24 9 31 21 6 11 7 21 2 31-5 9-13 15-25 18 5-6 9-12 11-20 2-8 1-16-4-25-4-7-11-13-20-19 2-3 3-5 5-6z"
        fill={`url(#${darkId})`}
        opacity="0.5"
      />
      <path
        d="M36 18c13-4 29-4 41 2 10 5 16 12 19 22 2 8 1 15-4 21-3 4-7 7-12 9-7 3-15 4-23 4 4-7 6-13 5-20-1-7-5-13-11-19-7-6-15-10-24-13 2-2 5-4 9-6z"
        fill={`url(#${iceId})`}
      />
      <path
        d="M36 18c13-4 29-4 41 2 10 5 16 12 19 22 2 8 1 15-4 21-3 4-7 7-12 9-7 3-15 4-23 4 4-7 6-13 5-20-1-7-5-13-11-19-7-6-15-10-24-13 2-2 5-4 9-6z"
        fill="none"
        stroke={`url(#${edgeId})`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M73 27c-8 2-15 6-21 12-6 6-8 13-6 20 2 5 5 8 11 11 5 2 13 4 23 4 11 0 19-2 25-7-4 11-12 20-23 26-11 6-23 7-35 3-11-3-19-10-24-20-4-10-4-20 0-31 4-11 11-19 22-25 9-5 19-6 28-4z"
        fill={`url(#${iceId})`}
      />
      <path
        d="M73 27c-8 2-15 6-21 12-6 6-8 13-6 20 2 5 5 8 11 11 5 2 13 4 23 4 11 0 19-2 25-7-4 11-12 20-23 26-11 6-23 7-35 3-11-3-19-10-24-20-4-10-4-20 0-31 4-11 11-19 22-25 9-5 19-6 28-4z"
        fill="none"
        stroke={`url(#${edgeId})`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M23 77l11-8 2 13 10 8-13 2-5 12-5-11-14-1 10-8z"
        fill={`url(#${iceId})`}
        opacity="0.85"
      />
      <path
        d="M88 18l7-9 3 11 11 5-11 2-4 10-4-10-10-2z"
        fill={`url(#${iceId})`}
        opacity="0.9"
      />
      <path
        d="M60 14l4-8 3 8 8 3-8 2-3 8-4-7-8-2z"
        fill={`url(#${iceId})`}
        opacity="0.9"
      />
      <path
        d="M31 33c8 3 14 7 19 12"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M47 22c8 0 15 2 23 6"
        stroke="#d8fdff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M50 84c10 2 20 1 31-5"
        stroke="#d8fdff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
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
              <FrozenclawIcon idPrefix="header-mark" />
            </span>
            <span className="font-display text-2xl uppercase tracking-[0.18em]">
              Frozenclaw
            </span>
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
          </nav>
          <a href="#preise" className="fc-button fc-button-secondary hidden md:inline-flex">
            Zugang sichern
          </a>
        </header>

        <section className="mx-auto grid min-h-[calc(100vh-88px)] w-[94%] max-w-7xl items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="space-y-8">
            <div className="fc-chip">
              <span className="fc-chip-dot" />
              Hosted OpenClaw Beta aus Deutschland
            </div>

            <div className="space-y-5">
              <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--fc-accent-soft)]">
                Frost. Kontrolle. Infrastruktur.
              </p>
              <h1 className="font-display text-6xl uppercase leading-[0.88] text-[var(--fc-text)] sm:text-7xl lg:text-[7.5rem]">
                Dein KI-Agent
                <span className="block text-[var(--fc-accent)]">hinter dem Tor.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--fc-text-muted)] sm:text-xl">
                Frozenclaw macht aus OpenClaw ein gehostetes Produkt: eigene Instanz,
                EU-Infrastruktur, schnelle Bereitstellung und ein Setup, das nicht nach
                Bastelkeller aussieht.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <CheckoutButton planId="hosted_byok" className="fc-button fc-button-primary">
                BYOK starten
              </CheckoutButton>
              <a href="#ueberblick" className="fc-button fc-button-secondary">
                System ansehen
              </a>
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
                <span>SYSTEMSTATUS</span>
                <span>VERSIEGELT / AKTIV</span>
              </div>

              <div className="vault-core-wrap">
                <div className="vault-ring" />
                <div className="vault-door">
                  <div className="vault-spoke vault-spoke-a" />
                  <div className="vault-spoke vault-spoke-b" />
                  <div className="vault-spoke vault-spoke-c" />
                  <div className="vault-center">
                    <span className="font-display text-xs uppercase tracking-[0.35em] text-[var(--fc-accent-soft)]">
                      kern
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
                  <span className="stat-label">Provisionierung</span>
                  <strong className="stat-value">~5 min</strong>
                </div>
                <div className="stat-block">
                  <span className="stat-label">Standort</span>
                  <strong className="stat-value">Nur EU</strong>
                </div>
                <div className="stat-block">
                  <span className="stat-label">Modus</span>
                  <strong className="stat-value">Privat</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ueberblick" className="mx-auto w-[94%] max-w-7xl pb-10">
          <div className="data-strip">
            <span>OpenClaw Hosting</span>
            <span>Schwarz / Eisblau / Rot</span>
            <span>BYOK zuerst</span>
            <span>Managed als Pilot</span>
            <span>Manueller Fallback vorhanden</span>
          </div>
        </section>

        <section id="ablauf" className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Ablauf</p>
            <h2 className="section-title">Der Startpfad ist absichtlich direkt.</h2>
            <p className="section-copy">
              Frozenclaw soll sich anfühlen wie ein sicheres Tor, nicht wie ein loses
              Bastelprojekt mit zu vielen beweglichen Teilen.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {steps.map((step) => (
              <article key={step.id} className="panel-cut fc-panel h-full">
                <p className="font-display text-5xl leading-none text-[var(--fc-accent)]">
                  {step.id}
                </p>
                <h3 className="mt-5 text-2xl font-semibold text-[var(--fc-text)]">
                  {step.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[var(--fc-text-muted)]">
                  {step.copy}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Richtung</p>
            <h2 className="section-title">Aussen Druck. Innen klare Kontrolle.</h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="panel-cut fc-panel">
              <div className="mb-8 flex items-center justify-between gap-4 border-b border-[var(--fc-border)] pb-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--fc-accent-soft)]">
                    Produktlogik
                  </p>
                  <h3 className="mt-2 font-display text-4xl uppercase text-[var(--fc-text)]">
                    Frostige Klarheit
                  </h3>
                </div>
                <span className="fc-chip">BYOK / Managed Pilot</span>
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
                <p className="section-kicker">Launch-Prinzip</p>
                <h3 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">
                  Erst sauber starten. Dann teuren Betrieb freischalten.
                </h3>
                <p className="mt-4 text-base leading-7 text-[var(--fc-text-muted)]">
                  Deshalb ist BYOK das öffentliche Kernangebot. Managed bleibt ein kleiner
                  Pilot, bis Verbrauch und Limits pro Kunde wirklich messbar sind.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="preise" className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Preise</p>
            <h2 className="section-title">Zwei Linien. Eine öffentlich, eine kontrolliert.</h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <article className="panel-cut fc-panel pricing-panel">
              <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--fc-border)] pb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-[var(--fc-accent-soft)]">
                    Öffentlich buchbar
                  </p>
                  <h3 className="mt-2 font-display text-5xl uppercase text-[var(--fc-text)]">
                    Hosted BYOK
                  </h3>
                </div>
                <div className="text-right">
                  <p className="font-display text-6xl leading-none text-[var(--fc-text)]">
                    EUR 19
                  </p>
                  <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                    pro Monat
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {byokIncludes.map((item) => (
                  <div key={item} className="signal-row">
                    <span className="signal-index">+</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <CheckoutButton planId="hosted_byok" className="fc-button fc-button-primary">
                  BYOK reservieren
                </CheckoutButton>
                <a href="#faq" className="fc-button fc-button-secondary">
                  Fragen klären
                </a>
              </div>
            </article>

            <article className="panel-cut fc-panel">
              <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--fc-border)] pb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-[var(--fc-accent-soft)]">
                    Begrenzt / Pilot
                  </p>
                  <h3 className="mt-2 font-display text-5xl uppercase text-[var(--fc-text)]">
                    Managed Beta
                  </h3>
                </div>
                <div className="text-right">
                  <p className="font-display text-6xl leading-none text-[var(--fc-text)]">
                    EUR 39
                  </p>
                  <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                    pro Monat
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {managedIncludes.map((item) => (
                  <div key={item} className="signal-row">
                    <span className="signal-index">+</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border border-[var(--fc-border)] bg-[rgba(255,255,255,0.025)] p-4 text-sm leading-7 text-[var(--fc-text-muted)]">
                Managed wird erst aktiv verkauft, wenn Usage-Tracking, Credit-Logik und
                Warnschwellen technisch verifiziert sind. Vorher bleibt es ein sichtbarer
                Pilot mit fester Kapazitätsgrenze.
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#preise" className="fc-button fc-button-secondary">
                  Managed anfragen
                </a>
                <a href="#faq" className="fc-button fc-button-secondary">
                  Pilot verstehen
                </a>
              </div>
            </article>
          </div>
        </section>

        <section className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="panel-cut fc-panel">
              <p className="section-kicker">Launch-Hinweis</p>
              <h3 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">
                BYOK ist das Hauptprodukt. Managed ist absichtlich gebremst.
              </h3>
              <p className="mt-4 text-base leading-7 text-[var(--fc-text-muted)]">
                Das ist kein Nachteil, sondern Kostenkontrolle. Erst wenn Verbrauch pro Kunde
                sauber messbar ist, wird aus Managed ein ernsthaft belastbares Angebot.
              </p>
            </div>

            <div className="panel-cut fc-panel">
              <p className="section-kicker">Was danach passiert</p>
              <ol className="mt-4 space-y-4 text-base text-[var(--fc-text-muted)]">
                <li>01. Checkout erfasst die Bestellung.</li>
                <li>02. Provisionierung legt deine Instanz an.</li>
                <li>03. Du verbindest deinen eigenen Modell-Key oder wartest auf Managed-Freigabe.</li>
                <li>04. Frozenclaw wird von Beta-Nutzen zu belastbarerem Betrieb weitergezogen.</li>
              </ol>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">FAQ</p>
            <h2 className="section-title">Keine Weichzeichnung. Nur die wichtigen Kanten.</h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {faqs.map((item) => (
              <article key={item.question} className="panel-cut fc-panel">
                <h3 className="text-2xl font-semibold text-[var(--fc-text)]">
                  {item.question}
                </h3>
                <p className="mt-4 text-base leading-7 text-[var(--fc-text-muted)]">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mx-auto grid w-[94%] max-w-7xl gap-6 border-t border-[var(--fc-border-strong)] py-8 text-sm uppercase tracking-[0.14em] text-[var(--fc-text-muted)] md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="brand-lockup">
                <FrozenclawIcon idPrefix="footer-mark" />
              </span>
              <p className="font-display text-3xl text-[var(--fc-text)]">Frozenclaw</p>
            </div>
            <p className="mt-2 max-w-xl text-xs leading-6 text-[var(--fc-text-muted)]">
              Hosted OpenClaw aus Deutschland: BYOK zuerst, Managed nur als begrenzter
              Pilot mit echtem Verbrauchstracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 md:justify-end">
            <a href="#" className="transition hover:text-[var(--fc-text)]">
              Impressum
            </a>
            <a href="#" className="transition hover:text-[var(--fc-text)]">
              Datenschutz
            </a>
            <a href="#" className="transition hover:text-[var(--fc-text)]">
              Beta-Bedingungen
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
