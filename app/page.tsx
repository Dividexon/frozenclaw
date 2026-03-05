"use client";

import { useState } from "react";

type CodeTab = "python" | "curl";

type SchemaOption = "Auto" | "Pricing" | "Products" | "Custom";

const fakeMarkdown = `# Example.com\n\n## Product Overview\n\n| Name | Price | Availability |\n|---|---:|---|\n| Polar Sensor X1 | $129 | In stock |\n| Frost Lens Pro | $89 | Limited |\n\n## Key Links\n- Docs: https://example.com/docs\n- API: https://example.com/api\n\n_Last scraped: 2026-03-05T11:34:00Z_`;

const useCases = [
  {
    title: "Real Estate",
    description:
      "Monitor property portals, extract listings, track price changes",
  },
  {
    title: "Compliance",
    description:
      "Track regulatory updates from ADR, IMDG, government sources",
  },
  {
    title: "E-Commerce",
    description:
      "Price monitoring, product data, competitor tracking",
  },
  {
    title: "Research",
    description:
      "Extract structured data from any blog, paper, or documentation",
  },
];

const pricing = [
  {
    tier: "Free",
    pages: "100 pages/month",
    price: "$0",
    cta: "Start building",
    features: ["100 pages/month", "API access", "Community support"],
    featured: false,
  },
  {
    tier: "Developer",
    pages: "5,000 pages/month",
    price: "$29/month",
    cta: "Most Popular",
    features: [
      "5k pages/month",
      "Priority scraping",
      "Custom schemas",
      "Email support",
    ],
    featured: true,
  },
  {
    tier: "Business",
    pages: "50,000 pages/month",
    price: "$149/month",
    cta: "Scale",
    features: ["50k pages", "Parallel batch", "Custom extractors", "SLA"],
    featured: false,
  },
];

export default function Home() {
  const [codeTab, setCodeTab] = useState<CodeTab>("python");
  const [schema, setSchema] = useState<SchemaOption>("Auto");

  return (
    <div className="relative z-10 min-h-screen bg-[#020c15] text-[#e8f6fb]">
      <header className="glass sticky top-0 z-50 mx-auto mt-4 flex w-[95%] max-w-6xl items-center justify-between border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.3)] px-5 py-3 backdrop-blur-2xl">
        <a href="#" className="text-lg font-bold tracking-tight text-white">
          frozenclaw
        </a>
        <nav className="flex items-center gap-3 sm:gap-4">
          <a href="#docs" className="text-sm text-[#e8f6fb] hover:text-[#0fb5d3]">
            Docs
          </a>
          <a href="#pricing" className="text-sm text-[#e8f6fb] hover:text-[#0fb5d3]">
            Pricing
          </a>
          <button className="rounded-xl border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.35)] px-4 py-2 text-sm text-[#0fb5d3] transition hover:bg-[rgba(10,50,80,0.5)]">
            Start free
          </button>
        </nav>
      </header>

      <main className="mx-auto flex w-[95%] max-w-6xl flex-col gap-24 pb-20 pt-16">
        {/* Hero mit Ice Cave Effekt */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
          {/* Ice Cave Background Layers */}
          <div className="absolute inset-0 z-0">
            {/* Haupt-Gradient: Eishoehlen-Atmosphaere */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#020c15] via-[#041824] to-[#020c15]" />

            {/* Glowing Center: Licht aus der Hoehle */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(15,181,211,0.12)_0%,transparent_65%)]" />

            {/* Eis-Stalaktiten Effect: vertikale Linien oben */}
            <div className="absolute left-0 right-0 top-0 h-48 overflow-hidden opacity-20">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bg-gradient-to-b from-[#aee7f7] to-transparent"
                  style={{
                    left: `${5 + i * 5}%`,
                    height: `${40 + ((i * 17) % 80)}px`,
                    opacity: 0.3 + ((i * 7) % 7) / 10,
                    width: `${1 + (i % 3)}px`,
                  }}
                />
              ))}
            </div>

            {/* Eis-Stalaktiten unten */}
            <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden opacity-15">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute bottom-0 bg-gradient-to-t from-[#0fb5d3] to-transparent"
                  style={{
                    left: `${3 + i * 7}%`,
                    height: `${30 + ((i * 11) % 60)}px`,
                    width: `${1 + (i % 4)}px`,
                    opacity: 0.4 + ((i * 5) % 6) / 10,
                  }}
                />
              ))}
            </div>

            {/* Subtile Eis-Partikel (Kreise) */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-[#0fb5d3]"
                  style={{
                    left: `${(i * 13) % 100}%`,
                    top: `${(i * 19) % 100}%`,
                    width: `${2 + (i % 4)}px`,
                    height: `${2 + (i % 4)}px`,
                    opacity: 0.1 + (i % 3) / 10,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Hero Content (bestehend, nur z-10 hinzugefuegt) */}
          <div className="relative z-10 w-full max-w-5xl px-6 text-center">
            <div className="space-y-8 text-left">
              <div className="max-w-3xl space-y-4">
                <h1 className="glow-text text-4xl font-extrabold leading-tight text-white sm:text-6xl">
                  Grab any web data.
                  <br />
                  Freeze it. Ship it.
                </h1>
                <p className="max-w-2xl text-base text-[rgba(174,231,247,0.7)] sm:text-lg">
                  FrozenClaw scrapes any website and returns clean, structured markdown
                  ready for your AI pipeline. No JS rendering issues. No boilerplate.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="rounded-xl bg-[#0fb5d3] px-5 py-3 text-sm font-bold text-[#020c15] transition hover:bg-[#1dbfd6]">
                  Start free -&gt;
                </button>
                <button className="rounded-xl border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.35)] px-5 py-3 text-sm text-[#0fb5d3] transition hover:bg-[rgba(10,50,80,0.5)]">
                  View docs
                </button>
              </div>

              <div className="glass space-y-4 border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.3)] p-5 backdrop-blur-2xl sm:p-6">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <input
                    type="url"
                    placeholder="https://example.com"
                    className="rounded-xl border border-[rgba(15,181,211,0.18)] bg-[rgba(2,12,21,0.75)] px-4 py-3 text-sm text-[#e8f6fb] outline-none placeholder:text-[rgba(174,231,247,0.4)] focus:border-[rgba(15,181,211,0.5)]"
                  />
                  <select
                    value={schema}
                    onChange={(event) => setSchema(event.target.value as SchemaOption)}
                    className="rounded-xl border border-[rgba(15,181,211,0.18)] bg-[rgba(2,12,21,0.75)] px-4 py-3 text-sm text-[#e8f6fb] outline-none"
                  >
                    <option>Auto</option>
                    <option>Pricing</option>
                    <option>Products</option>
                    <option>Custom</option>
                  </select>
                  <button className="rounded-xl bg-[#0fb5d3] px-5 py-3 text-sm font-bold text-[#020c15] transition hover:bg-[#1dbfd6]">
                    Scrape -&gt;
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl border border-[rgba(15,181,211,0.18)] bg-[rgba(2,12,21,0.75)] p-4 text-xs text-[#aee7f7] sm:text-sm">
                  <code>{fakeMarkdown}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">How it works</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="glass border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.3)] p-5 backdrop-blur-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0fb5d3]">Step 1</p>
              <h3 className="mb-2 text-lg font-semibold text-white">Paste any URL</h3>
              <p className="text-sm text-[rgba(174,231,247,0.7)]">
                Drop in any link. FrozenClaw handles JS rendering, auth-free scraping,
                bot detection.
              </p>
            </article>
            <article className="glass border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.3)] p-5 backdrop-blur-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0fb5d3]">Step 2</p>
              <h3 className="mb-2 text-lg font-semibold text-white">We extract and freeze</h3>
              <p className="text-sm text-[rgba(174,231,247,0.7)]">
                Playwright renders the page. GPT-4o extracts clean, structured markdown.
              </p>
            </article>
            <article className="glass border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.3)] p-5 backdrop-blur-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0fb5d3]">Step 3</p>
              <h3 className="mb-2 text-lg font-semibold text-white">Ship structured data</h3>
              <p className="text-sm text-[rgba(174,231,247,0.7)]">
                Get back clean markdown, tables, links via API or Python SDK.
              </p>
            </article>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Use cases</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {useCases.map((item) => (
              <article
                key={item.title}
                className="glass border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.3)] p-5 backdrop-blur-2xl"
              >
                <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-[rgba(174,231,247,0.7)]">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="space-y-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Pricing</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {pricing.map((plan) => (
              <article
                key={plan.tier}
                className={`glass flex flex-col border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.3)] p-6 backdrop-blur-2xl ${
                  plan.featured ? "ring-1 ring-[rgba(15,181,211,0.6)]" : ""
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{plan.tier}</h3>
                  {plan.featured ? (
                    <span className="rounded-full bg-[#0fb5d3] px-3 py-1 text-xs font-semibold text-[#020c15]">
                      Most Popular
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-[#0fb5d3]">{plan.pages}</p>
                <p className="mt-2 text-3xl font-bold text-white">{plan.price}</p>
                <p className="mb-4 mt-1 text-sm text-[rgba(174,231,247,0.7)]">{plan.cta}</p>
                <ul className="mb-6 mt-2 space-y-2 text-sm text-[rgba(174,231,247,0.8)]">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <button
                  className={`mt-auto rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    plan.featured
                      ? "bg-[#0fb5d3] text-[#020c15] hover:bg-[#1dbfd6]"
                      : "border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.35)] text-[#0fb5d3] hover:bg-[rgba(10,50,80,0.5)]"
                  }`}
                >
                  Choose {plan.tier}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="docs" className="space-y-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">API in seconds</h2>
          <div className="glass border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.3)] p-5 backdrop-blur-2xl sm:p-6">
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setCodeTab("python")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  codeTab === "python"
                    ? "bg-[#0fb5d3] text-[#020c15] hover:bg-[#1dbfd6]"
                    : "border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.35)] text-[#0fb5d3] hover:bg-[rgba(10,50,80,0.5)]"
                }`}
              >
                Python
              </button>
              <button
                onClick={() => setCodeTab("curl")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  codeTab === "curl"
                    ? "bg-[#0fb5d3] text-[#020c15] hover:bg-[#1dbfd6]"
                    : "border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.35)] text-[#0fb5d3] hover:bg-[rgba(10,50,80,0.5)]"
                }`}
              >
                cURL
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-[rgba(15,181,211,0.18)] bg-[rgba(2,12,21,0.75)] p-4 text-xs text-[#aee7f7] sm:text-sm">
              <code>
                {codeTab === "python"
                  ? `from frozenclaw import scrape\n\nresult = scrape("https://example.com")\nprint(result.markdown)  # Clean markdown ->`
                  : `curl -X POST https://api.frozenclaw.com/scrape \\\n  -H "Authorization: Bearer fc_your_key" \\\n  -d '{"url": "https://example.com"}'`}
              </code>
            </pre>
          </div>
        </section>
      </main>

      <footer className="glass relative z-10 mx-auto mb-6 mt-8 flex w-[95%] max-w-6xl flex-col gap-4 border border-[rgba(15,181,211,0.18)] bg-[rgba(10,50,80,0.3)] px-5 py-6 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold text-white">frozenclaw</p>
          <p className="text-sm text-[rgba(174,231,247,0.7)]">Freeze the web. Build faster.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-[rgba(174,231,247,0.8)]">
          <a href="#docs" className="hover:text-[#0fb5d3]">
            Docs
          </a>
          <a href="#docs" className="hover:text-[#0fb5d3]">
            API
          </a>
          <a href="#pricing" className="hover:text-[#0fb5d3]">
            Pricing
          </a>
          <a href="#" className="hover:text-[#0fb5d3]">
            Terms
          </a>
          <a href="#" className="hover:text-[#0fb5d3]">
            Privacy
          </a>
        </div>
        <p className="text-xs text-[rgba(174,231,247,0.6)]">Built in Germany - DSGVO compliant</p>
      </footer>
    </div>
  );
}
