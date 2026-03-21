const launchSignals = [
  "EU hosted in Germany",
  "One private OpenClaw instance per customer",
  "Provisioned in minutes, not days",
  "Built for Beta launch, hardened before scale",
];

const steps = [
  {
    id: "01",
    title: "Reserve your slot",
    copy:
      "Join the Founding Member beta and secure a private hosted instance before the public rollout gets noisy.",
  },
  {
    id: "02",
    title: "We provision the gate",
    copy:
      "Frozenclaw deploys your own hosted OpenClaw environment on EU infrastructure with a dedicated access path.",
  },
  {
    id: "03",
    title: "Bring your model key",
    copy:
      "You connect your provider key, tune the agent, and keep it running without local setup or home-lab babysitting.",
  },
];

const features = [
  {
    kicker: "Private Runtime",
    title: "Your own agent, not a shared toy box.",
    copy:
      "Each customer gets a separate hosted instance with its own route, token, and operational state.",
  },
  {
    kicker: "Industrial Simplicity",
    title: "No local setup. No Docker spelunking.",
    copy:
      "The value proposition is brutal in the best way: pay, get provisioned, configure your agent, keep working.",
  },
  {
    kicker: "Operator Visibility",
    title: "Built for controlled rollout, not fake scale theater.",
    copy:
      "The launch path is optimized for real customers, manual fallback, and sane operational recovery instead of hype architecture.",
  },
];

const included = [
  "1 hosted OpenClaw instance",
  "EU hosting footprint",
  "Gateway token delivery",
  "Founding Member pricing lock",
  "Direct support during beta",
  "Launch-focused onboarding",
];

const specRows = [
  ["Region", "Germany"],
  ["Access", "app.frozenclaw.com/agent/..."],
  ["Mode", "Beta hosted deployment"],
  ["Provisioning", "Automatic with manual fallback"],
  ["Billing", "Founding Member"],
  ["Support", "Direct operator support"],
];

const faqs = [
  {
    question: "Is this a shared agent platform?",
    answer:
      "No. The positioning is one hosted OpenClaw instance per customer, not a multi-tenant chat surface pretending to be private.",
  },
  {
    question: "Do I need to self-host anything?",
    answer:
      "No local server is required. The point is to remove home-lab friction and keep the agent available without your machine staying online.",
  },
  {
    question: "Is this already a fully mature SaaS?",
    answer:
      "No. The launch is framed as a beta: functional, paid, and useful, but still being hardened operationally before larger customer volume.",
  },
  {
    question: "Can I get in before the broader launch?",
    answer:
      "Yes. The current page is tuned for founding members who want the hosted setup early and can tolerate a sharper-edged product phase.",
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
            <a href="#how" className="transition hover:text-[var(--fc-text)]">
              Process
            </a>
            <a href="#pricing" className="transition hover:text-[var(--fc-text)]">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-[var(--fc-text)]">
              FAQ
            </a>
          </nav>
          <a href="#pricing" className="fc-button fc-button-secondary hidden md:inline-flex">
            Secure Access
          </a>
        </header>

        <section className="mx-auto grid min-h-[calc(100vh-88px)] w-[94%] max-w-7xl items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="space-y-8">
            <div className="fc-chip">
              <span className="fc-chip-dot" />
              Beta hosted OpenClaw infrastructure
            </div>

            <div className="space-y-5">
              <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--fc-accent-soft)]">
                Metal. Gate. Control.
              </p>
              <h1 className="font-display text-6xl uppercase leading-[0.88] text-[var(--fc-text)] sm:text-7xl lg:text-[7.5rem]">
                Your AI agent
                <span className="block text-[var(--fc-accent)]">behind the vault.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--fc-text-muted)] sm:text-xl">
                Frozenclaw turns OpenClaw into a hosted product: private instance, EU
                infrastructure, fast provisioning, and a visual language that feels like
                sealed machinery instead of soft SaaS wallpaper.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a href="#pricing" className="fc-button fc-button-primary">
                Join Founding Member
              </a>
              <a href="#overview" className="fc-button fc-button-secondary">
                Inspect The System
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
                <span>SITE STATUS</span>
                <span>LOCKED / LIVE</span>
              </div>

              <div className="vault-core-wrap">
                <div className="vault-ring" />
                <div className="vault-door">
                  <div className="vault-spoke vault-spoke-a" />
                  <div className="vault-spoke vault-spoke-b" />
                  <div className="vault-spoke vault-spoke-c" />
                  <div className="vault-center">
                    <span className="font-display text-xs uppercase tracking-[0.35em] text-[var(--fc-accent-soft)]">
                      agent core
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
                  <span className="stat-label">Provisioning</span>
                  <strong className="stat-value">~5 min</strong>
                </div>
                <div className="stat-block">
                  <span className="stat-label">Footprint</span>
                  <strong className="stat-value">EU only</strong>
                </div>
                <div className="stat-block">
                  <span className="stat-label">Mode</span>
                  <strong className="stat-value">Private</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="overview" className="mx-auto w-[94%] max-w-7xl pb-10">
          <div className="data-strip">
            <span>Hosted OpenClaw</span>
            <span>Black / Red industrial UI</span>
            <span>Germany-based deployment</span>
            <span>Founding Member beta</span>
            <span>Manual fallback available</span>
          </div>
        </section>

        <section id="how" className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Deployment Sequence</p>
            <h2 className="section-title">The launch path is simple on purpose.</h2>
            <p className="section-copy">
              The product should feel like opening a secure gate, not assembling a hobby
              stack in the dark.
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
            <p className="section-kicker">Design Direction</p>
            <h2 className="section-title">Industrial pressure outside. Clear control inside.</h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="panel-cut fc-panel">
              <div className="mb-8 flex items-center justify-between gap-4 border-b border-[var(--fc-border)] pb-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--fc-accent-soft)]">
                    Visual system
                  </p>
                  <h3 className="mt-2 font-display text-4xl uppercase text-[var(--fc-text)]">
                    Gate aesthetics
                  </h3>
                </div>
                <span className="fc-chip">Black / steel / red</span>
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
                <p className="section-kicker">Signal stack</p>
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
                <p className="section-kicker">Built for launch</p>
                <h3 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">
                  Enough ceremony to feel premium. Not enough to feel fake.
                </h3>
                <p className="mt-4 text-base leading-7 text-[var(--fc-text-muted)]">
                  This is the right balance for Frozenclaw: visually aggressive, technically
                  restrained, and oriented around a private hosted agent instead of generic AI
                  marketing haze.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Founding Member</p>
            <h2 className="section-title">One clear offer beats three weak tiers.</h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="panel-cut fc-panel pricing-panel">
              <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--fc-border)] pb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-[var(--fc-accent-soft)]">
                    Beta access
                  </p>
                  <h3 className="mt-2 font-display text-5xl uppercase text-[var(--fc-text)]">
                    Founding Member
                  </h3>
                </div>
                <div className="text-right">
                  <p className="font-display text-6xl leading-none text-[var(--fc-text)]">
                    EUR 19
                  </p>
                  <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                    per month
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {included.map((item) => (
                  <div key={item} className="signal-row">
                    <span className="signal-index">+</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#pricing" className="fc-button fc-button-primary">
                  Reserve Founding Slot
                </a>
                <a href="#faq" className="fc-button fc-button-secondary">
                  Read Beta Conditions
                </a>
              </div>
            </article>

            <aside className="grid gap-5">
              <div className="panel-cut fc-panel">
                <p className="section-kicker">Launch note</p>
                <h3 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">
                  Start narrow. Start hard. Expand later.
                </h3>
                <p className="mt-4 text-base leading-7 text-[var(--fc-text-muted)]">
                  The page is intentionally focused on one paid path, one promise, and one
                  technical story. That keeps the product believable.
                </p>
              </div>

              <div className="panel-cut fc-panel">
                <p className="section-kicker">What happens next</p>
                <ol className="mt-4 space-y-4 text-base text-[var(--fc-text-muted)]">
                  <li>01. Checkout captures the order.</li>
                  <li>02. Provisioning allocates your instance.</li>
                  <li>03. Access details are delivered for setup.</li>
                  <li>04. The agent moves from beta utility to production hardening.</li>
                </ol>
              </div>
            </aside>
          </div>
        </section>

        <section id="faq" className="mx-auto w-[94%] max-w-7xl py-14">
          <div className="section-head">
            <p className="section-kicker">Questions</p>
            <h2 className="section-title">No fluff. Just the sharp edges.</h2>
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
              Hosted OpenClaw infrastructure with a black-and-red vault language, built for
              a focused beta instead of soft generic SaaS.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 md:justify-end">
            <a href="#" className="transition hover:text-[var(--fc-text)]">
              Impressum
            </a>
            <a href="#" className="transition hover:text-[var(--fc-text)]">
              Privacy
            </a>
            <a href="#" className="transition hover:text-[var(--fc-text)]">
              Beta Terms
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
