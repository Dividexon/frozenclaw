import Link from "next/link";
import { CheckoutButton } from "@/components/checkout-button";

const launchSignals = [
  "Eigene OpenClaw-Instanz pro Kunde",
  "Hosting in Deutschland",
  "Start mit eigenem Modell-Key",
  "Bereitstellung in der Regel am selben Tag",
];

const steps = [
  {
    id: "01",
    title: "Plan auswählen",
    copy:
      "Du bestellst deine gehostete Instanz über eine einfache Checkout-Strecke ohne unnötige Konfiguration vor dem Kauf.",
  },
  {
    id: "02",
    title: "Instanz wird bereitgestellt",
    copy:
      "Frozenclaw richtet deine private OpenClaw-Instanz auf deutscher Infrastruktur ein und stellt den Zugang für dich bereit.",
  },
  {
    id: "03",
    title: "Konfigurieren und nutzen",
    copy:
      "Du hinterlegst deinen eigenen Modell-Key, arbeitest die Startanleitung durch und kannst deinen Agenten direkt nutzen.",
  },
];

const features = [
  {
    kicker: "Eigene Instanz",
    title: "Du bekommst eine private OpenClaw-Instanz.",
    copy:
      "Jede Bestellung bekommt ihren eigenen Laufzeitkontext mit eigenem Zugang und eigener Betriebsumgebung.",
  },
  {
    kicker: "Weniger Infrastruktur",
    title: "Du musst den Server nicht selbst aufsetzen.",
    copy:
      "Frozenclaw übernimmt Hosting, Bereitstellung und Erreichbarkeit, damit du dich auf den Einsatz des Agenten konzentrieren kannst.",
  },
  {
    kicker: "Klarer Einstieg",
    title: "Der Startplan ist bewusst einfach gehalten.",
    copy:
      "Zum Start ist das Hosting mit eigenem Modell-Key das Standardangebot. So bleibt Nutzen, Preis und Betrieb für beide Seiten klar.",
  },
];

const byokIncludes = [
  "1 gehostete OpenClaw-Instanz",
  "Eigener API-Key des Kunden",
  "Hosting in Deutschland",
  "Startanleitung für die ersten Schritte",
  "E-Mail-Support während der Beta",
  "Bereitstellung in der Regel am selben Tag",
  "Öffentliches Standardangebot zum Start",
];

const managedIncludes = [
  "1 gehostete OpenClaw-Instanz",
  "Modell-Key wird von uns gestellt",
  "Pilot mit 5 verfügbaren Plätzen",
  "Konservatives Nutzungsbudget zum Start",
  "Separates Cron-Limit geplant",
  "Freischaltung erst nach aktivem Verbrauchstracking",
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
  ["Modell-Key", "Zum Start vom Kunden gestellt"],
  ["Support", "E-Mail + Startanleitung"],
  ["Bereitstellung", "In der Regel am selben Tag"],
  ["Managed", "Später als Pilot mit 5 Slots"],
];

const faqs = [
  {
    question: "Muss ich meinen eigenen API-Key mitbringen?",
    answer:
      "Ja. Das öffentliche Startangebot ist Hosting mit eigenem Modell-Key. Dadurch bleiben Nutzung, Modellkosten und Verantwortung am Anfang klar getrennt.",
  },
  {
    question: "Was bedeutet Managed konkret?",
    answer:
      "Später kann es einen begrenzten Plan mit von uns gestelltem Modell-Key geben. Dieser wird aber erst geöffnet, wenn wir Verbrauch und Limits pro Kunde technisch sauber messen können.",
  },
  {
    question: "Brauche ich eigene Server oder Docker-Kenntnisse?",
    answer:
      "Nein. Du musst keinen eigenen Server betreiben und keine Infrastruktur selbst rund um die Uhr am Laufen halten.",
  },
  {
    question: "Ist das schon ein komplett ausgereiftes SaaS?",
    answer:
      "Nein. Es ist eine bezahlte Beta mit klarem Nutzen und bewusst begrenztem Scope. Genau deshalb starten wir mit einem verständlichen Kernangebot.",
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
                Frozenclaw hostet deine private OpenClaw-Instanz auf deutscher Infrastruktur.
                Du bringst deinen eigenen Modell-Key mit, wir kümmern uns um Bereitstellung,
                Erreichbarkeit und den technischen Betrieb der Instanz. Dazu bekommst du eine
                Startanleitung und Support per E-Mail.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <CheckoutButton planId="hosted_byok" className="fc-button fc-button-primary">
                Jetzt starten
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
                  <span className="stat-label">Provisionierung</span>
                  <strong className="stat-value">Gleicher Tag</strong>
                </div>
                <div className="stat-block">
                  <span className="stat-label">Standort</span>
                  <strong className="stat-value">Nur EU</strong>
                </div>
                <div className="stat-block">
                  <span className="stat-label">Startmodell</span>
                  <strong className="stat-value">Eigener Key</strong>
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
            <span>Eigener Modell-Key</span>
            <span>E-Mail-Support</span>
            <span>Startanleitung inklusive</span>
          </div>
        </section>

        <section id="ablauf" className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Ablauf</p>
            <h2 className="section-title">So startet Frozenclaw.</h2>
            <p className="section-copy">
              Frozenclaw richtet sich an Founder, Power-User und kleine Teams, die ihren
              eigenen Agenten nutzen möchten, ohne den Server selbst zu betreiben.
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
                  Der Start richtet sich nicht an alle. Er richtet sich an Leute, die wissen,
                  warum sie OpenClaw nutzen möchten, und den technischen Betrieb nicht selbst
                  übernehmen wollen.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Einsatzbereiche</p>
            <h2 className="section-title">Wofür Frozenclaw am Anfang gedacht ist.</h2>
            <p className="section-copy">
              Nicht für jeden denkbaren KI-Anwendungsfall, sondern für klare, wiederkehrende
              Aufgaben, bei denen eine eigene gehostete Instanz sinnvoll ist.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {useCases.map((item) => (
              <article key={item.title} className="panel-cut fc-panel">
                <p className="section-kicker">{item.title}</p>
                <p className="mt-4 text-base leading-8 text-[var(--fc-text-muted)]">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="preise" className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Preise</p>
            <h2 className="section-title">Das Startangebot ist bewusst klar aufgebaut.</h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <article className="panel-cut fc-panel pricing-panel">
              <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--fc-border)] pb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-[var(--fc-accent-soft)]">
                    Jetzt buchbar
                  </p>
                  <h3 className="mt-2 font-display text-5xl uppercase text-[var(--fc-text)]">
                    Standardplan
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
                  Jetzt starten
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
                    Später im Pilot
                  </p>
                  <h3 className="mt-2 font-display text-5xl uppercase text-[var(--fc-text)]">
                    Managed
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
                Dieses Angebot wird erst geöffnet, wenn Verbrauchstracking, Limits und
                Warnschwellen technisch sauber stehen. Bis dahin bleibt es ein kleiner Pilot
                mit fester Kapazitätsgrenze.
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#preise" className="fc-button fc-button-secondary">
                  Interesse vormerken
                </a>
                <a href="#faq" className="fc-button fc-button-secondary">
                  Mehr dazu
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
                Der Start konzentriert sich auf ein Angebot, das sofort verständlich ist.
              </h3>
              <p className="mt-4 text-base leading-7 text-[var(--fc-text-muted)]">
                Private Instanz, Hosting in Deutschland, eigener Modell-Key, Startanleitung und
                Support per E-Mail. Bereitstellung in der Regel am selben Tag. Mehr muss die
                erste Version nicht versprechen.
              </p>
            </div>

            <div className="panel-cut fc-panel">
              <p className="section-kicker">Nach der Bestellung</p>
              <ol className="mt-4 space-y-4 text-base text-[var(--fc-text-muted)]">
                <li>01. Checkout erfasst die Bestellung.</li>
                <li>02. Provisionierung legt deine Instanz an.</li>
                <li>03. Du erhältst Zugang und Startanleitung.</li>
                <li>04. Du hinterlegst deinen eigenen Modell-Key.</li>
                <li>05. Danach kannst du deine Instanz direkt nutzen.</li>
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
