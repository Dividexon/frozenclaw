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
    <div className="relative z-10 min-h-screen bg-frost-bg text-[#e8f4ff]">
      <header className="glass sticky top-0 z-50 mx-auto mt-4 flex w-[95%] max-w-6xl items-center justify-between px-5 py-3">
        <a href="#" className="text-lg font-bold tracking-tight text-white">
          frozenclaw
        </a>
        <nav className="flex items-center gap-3 sm:gap-4">
          <a href="#docs" className="text-sm text-[#e8f4ff] hover:text-arctic-300">
            Docs
          </a>
          <a href="#pricing" className="text-sm text-[#e8f4ff] hover:text-arctic-300">
            Pricing
          </a>
          <button className="rounded-xl border border-arctic-300/30 bg-arctic-300/20 px-4 py-2 text-sm text-arctic-300 transition hover:bg-arctic-300/30">
            Start free
          </button>
        </nav>
      </header>

      <main className="mx-auto flex w-[95%] max-w-6xl flex-col gap-24 pb-20 pt-16">
        <section className="space-y-8">
          <div className="max-w-3xl space-y-4">
            <h1 className="glow-text text-4xl font-extrabold leading-tight text-white sm:text-6xl">
              Grab any web data.
              <br />
              Freeze it. Ship it.
            </h1>
            <p className="max-w-2xl text-base text-[rgba(168,237,255,0.7)] sm:text-lg">
              FrozenClaw scrapes any website and returns clean, structured markdown
              ready for your AI pipeline. No JS rendering issues. No boilerplate.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl bg-arctic-300 px-5 py-3 text-sm font-bold text-[#02080f] transition hover:bg-arctic-200">
              Start free -&gt;
            </button>
            <button className="rounded-xl border border-arctic-300/30 bg-arctic-300/20 px-5 py-3 text-sm text-arctic-300 transition hover:bg-arctic-300/30">
              View docs
            </button>
          </div>

          <div className="glass space-y-4 p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <input
                type="url"
                placeholder="https://example.com"
                className="rounded-xl border border-[rgba(168,237,255,0.2)] bg-[rgba(3,14,24,0.8)] px-4 py-3 text-sm text-[#e8f4ff] outline-none placeholder:text-[rgba(168,237,255,0.45)] focus:border-arctic-300/60"
              />
              <select
                value={schema}
                onChange={(event) => setSchema(event.target.value as SchemaOption)}
                className="rounded-xl border border-[rgba(168,237,255,0.2)] bg-[rgba(3,14,24,0.8)] px-4 py-3 text-sm text-[#e8f4ff] outline-none"
              >
                <option>Auto</option>
                <option>Pricing</option>
                <option>Products</option>
                <option>Custom</option>
              </select>
              <button className="rounded-xl bg-arctic-300 px-5 py-3 text-sm font-bold text-[#02080f] transition hover:bg-arctic-200">
                Scrape -&gt;
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-[rgba(168,237,255,0.15)] bg-[rgba(2,8,15,0.7)] p-4 text-xs text-arctic-100 sm:text-sm">
              <code>{fakeMarkdown}</code>
            </pre>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">How it works</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="glass p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-arctic-300">Step 1</p>
              <h3 className="mb-2 text-lg font-semibold text-white">Paste any URL</h3>
              <p className="text-sm text-[rgba(168,237,255,0.7)]">
                Drop in any link. FrozenClaw handles JS rendering, auth-free scraping,
                bot detection.
              </p>
            </article>
            <article className="glass p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-arctic-300">Step 2</p>
              <h3 className="mb-2 text-lg font-semibold text-white">We extract and freeze</h3>
              <p className="text-sm text-[rgba(168,237,255,0.7)]">
                Playwright renders the page. GPT-4o extracts clean, structured markdown.
              </p>
            </article>
            <article className="glass p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-arctic-300">Step 3</p>
              <h3 className="mb-2 text-lg font-semibold text-white">Ship structured data</h3>
              <p className="text-sm text-[rgba(168,237,255,0.7)]">
                Get back clean markdown, tables, links via API or Python SDK.
              </p>
            </article>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Use cases</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {useCases.map((item) => (
              <article key={item.title} className="glass p-5">
                <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-[rgba(168,237,255,0.7)]">{item.description}</p>
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
                className={`glass flex flex-col p-6 ${
                  plan.featured ? "ring-1 ring-arctic-300/60" : ""
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{plan.tier}</h3>
                  {plan.featured ? (
                    <span className="rounded-full border border-arctic-300/40 bg-arctic-300/20 px-3 py-1 text-xs font-semibold text-arctic-200">
                      Most Popular
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-arctic-300">{plan.pages}</p>
                <p className="mt-2 text-3xl font-bold text-white">{plan.price}</p>
                <p className="mb-4 mt-1 text-sm text-[rgba(168,237,255,0.7)]">{plan.cta}</p>
                <ul className="mb-6 mt-2 space-y-2 text-sm text-[rgba(168,237,255,0.78)]">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <button
                  className={`mt-auto rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    plan.featured
                      ? "bg-arctic-300 text-[#02080f] hover:bg-arctic-200"
                      : "border border-arctic-300/30 bg-arctic-300/20 text-arctic-300 hover:bg-arctic-300/30"
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
          <div className="glass p-5 sm:p-6">
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setCodeTab("python")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  codeTab === "python"
                    ? "bg-arctic-300 text-[#02080f]"
                    : "border border-arctic-300/30 bg-arctic-300/20 text-arctic-300 hover:bg-arctic-300/30"
                }`}
              >
                Python
              </button>
              <button
                onClick={() => setCodeTab("curl")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  codeTab === "curl"
                    ? "bg-arctic-300 text-[#02080f]"
                    : "border border-arctic-300/30 bg-arctic-300/20 text-arctic-300 hover:bg-arctic-300/30"
                }`}
              >
                cURL
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-[rgba(168,237,255,0.15)] bg-[rgba(2,8,15,0.7)] p-4 text-xs text-arctic-100 sm:text-sm">
              <code>
                {codeTab === "python"
                  ? `from frozenclaw import scrape\n\nresult = scrape("https://example.com")\nprint(result.markdown)  # Clean markdown ->`
                  : `curl -X POST https://api.frozenclaw.com/scrape \\\n  -H "Authorization: Bearer fc_your_key" \\\n  -d '{"url": "https://example.com"}'`}
              </code>
            </pre>
          </div>
        </section>
      </main>

      <footer className="glass relative z-10 mx-auto mb-6 mt-8 flex w-[95%] max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold text-white">frozenclaw</p>
          <p className="text-sm text-[rgba(168,237,255,0.7)]">Freeze the web. Build faster.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-[rgba(168,237,255,0.8)]">
          <a href="#docs" className="hover:text-arctic-300">Docs</a>
          <a href="#docs" className="hover:text-arctic-300">API</a>
          <a href="#pricing" className="hover:text-arctic-300">Pricing</a>
          <a href="#" className="hover:text-arctic-300">Terms</a>
          <a href="#" className="hover:text-arctic-300">Privacy</a>
        </div>
        <p className="text-xs text-[rgba(168,237,255,0.6)]">Built in Germany - DSGVO compliant</p>
      </footer>
    </div>
  );
}
