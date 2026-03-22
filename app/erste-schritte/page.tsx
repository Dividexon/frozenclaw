import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Erste Schritte | Frozenclaw",
  description:
    "Praktische Starthilfe für Frozenclaw: OpenClaw öffnen, erste Aufgaben testen, Kanäle anbinden und Cronjobs sinnvoll einsetzen.",
};

const quickStartSteps = [
  {
    title: "Dashboard öffnen",
    description:
      "Prüfe zuerst im Dashboard, ob deine Instanz erreichbar ist und ob dein Plan oder dein API-Key sauber hinterlegt ist.",
  },
  {
    title: "OpenClaw starten",
    description:
      "Öffne danach deine Instanz direkt aus Frozenclaw. So landest du mit dem richtigen Link und dem aktuellen Gateway-Zugang in der Oberfläche.",
  },
  {
    title: "Mit einer kleinen Aufgabe beginnen",
    description:
      'Starte nicht mit einem komplexen Agenten. Ein kurzer Test wie "Fasse mir dieses Thema zusammen" oder "Gib mir drei Ansätze" reicht für den Anfang.',
  },
  {
    title: "Erst dann Routinen bauen",
    description:
      "Wenn Antworten sauber ankommen, lohnt sich der nächste Schritt: Kanäle verbinden, wiederkehrende Aufgaben anlegen und Cronjobs testen.",
  },
];

const exampleIdeas = [
  "Tägliche Zusammenfassungen zu Themen, Quellen oder Beobachtungen",
  "Recherche-Agent für Firmen, Märkte oder Produktideen",
  "Entwürfe für Nachrichten, Antworten oder interne Notizen",
  "Regelmäßige Statusmeldungen in einem Kanal",
];

const nextSteps = [
  {
    title: "Kanäle anbinden",
    description:
      "OpenClaw wird deutlich nützlicher, wenn Antworten dort ankommen, wo du ohnehin arbeitest. Typische erste Ziele sind Telegram, Discord oder andere in deiner OpenClaw-Konfiguration verfügbare Kanäle.",
  },
  {
    title: "Cronjobs für Routinen nutzen",
    description:
      "Lege wiederkehrende Aufgaben erst dann an, wenn ein einzelner Durchlauf sauber funktioniert. Ein täglicher Morgenbericht oder eine regelmäßige Recherche sind gute erste Cronjobs.",
  },
  {
    title: "Prompts schrittweise schärfen",
    description:
      "Halte deine ersten Anweisungen kurz. Sobald die Richtung stimmt, kannst du Anforderungen, Stil und Ausgabeformat gezielt verfeinern.",
  },
];

const practicalTips = [
  "Halte den ersten Workflow bewusst klein. Ein funktionierender Ablauf ist wertvoller als zehn halbfertige Ideen.",
  "Teste neue Kanäle zuerst manuell, bevor du geplante Läufe darauf loslässt.",
  "Wenn du wiederkehrende Aufgaben anlegst, beginne mit einem einfachen Zeitplan statt mit vielen parallelen Jobs.",
  "Bei unerwartetem Verhalten zuerst Dashboard und Zugangsseite prüfen, bevor du OpenClaw komplett neu aufsetzt.",
];

const supportHints = [
  "Wenn OpenClaw eine neue Verbindung anfordert, nutze den aktuellen Gateway-Zugang aus Frozenclaw statt alter Browser-Tabs.",
  "Wenn Antworten ausbleiben, zuerst Modellzugang oder Provider-Status prüfen.",
  "Wenn eine Verbindung in einem Browser hängt, den Link direkt aus Frozenclaw neu öffnen und nicht auf alte lokale Zustände vertrauen.",
];

export default function ErsteSchrittePage() {
  return (
    <main className="mx-auto min-h-screen w-[94%] max-w-6xl py-12 text-[var(--fc-text)]">
      <section className="panel-cut fc-panel">
        <p className="section-kicker">Erste Schritte</p>
        <h1 className="section-title mt-3 max-w-4xl text-5xl">
          So holst du aus Frozenclaw schnell einen echten ersten Nutzen.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--fc-text-muted)]">
          Diese Seite ist keine technische Referenz, sondern eine praktische Starthilfe. Der
          einfachste Weg ist: Instanz öffnen, eine kleine Aufgabe testen, danach Kanäle und
          Routinen sauber aufbauen.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/konto" className="fc-button fc-button-primary">
            Zum Dashboard
          </Link>
          <Link href="/anmelden" className="fc-button fc-button-secondary">
            OpenClaw über dein Konto öffnen
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel-cut fc-panel">
          <p className="section-kicker">Die ersten 5 Minuten</p>
          <div className="mt-6 space-y-4">
            {quickStartSteps.map((step, index) => (
              <article key={step.title} className="border border-[var(--fc-border)] bg-black/20 p-5">
                <div className="flex items-start gap-4">
                  <span className="signal-index mt-1">{index + 1}</span>
                  <div>
                    <h2 className="text-2xl font-semibold text-[var(--fc-text)]">{step.title}</h2>
                    <p className="mt-3 text-base leading-8 text-[var(--fc-text-muted)]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel-cut fc-panel">
          <p className="section-kicker">Sinnvolle erste Aufgaben</p>
          <p className="mt-4 text-base leading-8 text-[var(--fc-text-muted)]">
            Gute Startszenarien sind Aufgaben, bei denen du schnell erkennst, ob der Agent
            grundsätzlich in die richtige Richtung arbeitet.
          </p>
          <div className="mt-6 grid gap-3">
            {exampleIdeas.map((idea) => (
              <div key={idea} className="signal-row">
                <span className="signal-index">+</span>
                <span>{idea}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 border border-[var(--fc-border)] bg-black/20 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
              Wichtiger Hinweis
            </p>
            <p className="mt-3 text-base leading-8 text-[var(--fc-text-muted)]">
              Die erste Nachricht einer frischen Instanz kann mehr Tokens verbrauchen als spätere
              kurze Antworten. Das ist beim ersten Einlesen normal und reduziert sich danach in der
              Regel deutlich.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 panel-cut fc-panel">
        <p className="section-kicker">Was du als Nächstes machen kannst</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {nextSteps.map((item) => (
            <article key={item.title} className="border border-[var(--fc-border)] bg-black/20 p-5">
              <h2 className="text-2xl font-semibold text-[var(--fc-text)]">{item.title}</h2>
              <p className="mt-4 text-base leading-8 text-[var(--fc-text-muted)]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="panel-cut fc-panel">
          <p className="section-kicker">Tipps für einen guten Start</p>
          <div className="mt-6 grid gap-3">
            {practicalTips.map((tip) => (
              <div key={tip} className="signal-row">
                <span className="signal-index">+</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-cut fc-panel">
          <p className="section-kicker">Wenn etwas nicht funktioniert</p>
          <div className="mt-6 grid gap-3">
            {supportHints.map((hint) => (
              <div key={hint} className="signal-row">
                <span className="signal-index">+</span>
                <span>{hint}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/konto" className="fc-button fc-button-secondary">
              Status im Dashboard prüfen
            </Link>
            <a href="mailto:Frozenclaw9@gmail.com" className="fc-button fc-button-secondary">
              Support kontaktieren
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
