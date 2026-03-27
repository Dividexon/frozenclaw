"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  FrozenclawConnection,
  FrozenclawMessage,
  FrozenclawTask,
  FrozenclawThreadSummary,
  FrozenclawWorkspaceSnapshot,
} from "@/lib/frozenclaw-ui";

type FrozenclawWorkspaceProps = {
  initialSnapshot: FrozenclawWorkspaceSnapshot;
};

function formatStandardTokens(value: number | null) {
  if (value === null) {
    return "Nicht aktiv";
  }

  return new Intl.NumberFormat("de-DE").format(value);
}

function sectionLink(id: string, label: string) {
  return (
    <a
      href={`#${id}`}
      className="border border-[var(--fc-border)] bg-black/20 px-4 py-3 text-sm uppercase tracking-[0.16em] text-[var(--fc-text-muted)] transition hover:border-[var(--fc-accent)] hover:bg-[rgba(255,77,77,0.08)] hover:text-[var(--fc-text)]"
    >
      {label}
    </a>
  );
}

function ThreadList({
  threads,
  selectedThreadId,
  onSelect,
  onCreate,
}: {
  threads: FrozenclawThreadSummary[];
  selectedThreadId: string | null;
  onSelect: (threadId: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex h-full flex-col border border-[var(--fc-border)] bg-black/20">
      <div className="flex items-center justify-between border-b border-[var(--fc-border)] px-4 py-4">
        <div>
          <p className="section-kicker">Unterhaltungen</p>
          <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">
            Der Agent arbeitet weiter in derselben Instanz. Du kannst hier zwischen Sitzungen wechseln.
          </p>
        </div>
        <button type="button" className="fc-button fc-button-secondary min-h-0 px-4 py-3" onClick={onCreate}>
          Neu
        </button>
      </div>
      <div className="grid max-h-[34rem] gap-2 overflow-y-auto p-3">
        {threads.length === 0 ? (
          <div className="border border-dashed border-[var(--fc-border)] p-4 text-sm leading-7 text-[var(--fc-text-muted)]">
            Noch keine Sitzung vorhanden. Schreibe die erste Nachricht und Frozenclaw legt die Unterhaltung an.
          </div>
        ) : null}
        {threads.map((thread) => {
          const active = thread.sessionId === selectedThreadId;

          return (
            <button
              key={thread.sessionId}
              type="button"
              onClick={() => onSelect(thread.sessionId)}
              className={`border px-4 py-4 text-left transition ${
                active
                  ? "border-[var(--fc-accent)] bg-[rgba(255,77,77,0.08)]"
                  : "border-[var(--fc-border)] bg-black/10 hover:border-[var(--fc-accent)] hover:bg-[rgba(255,77,77,0.05)]"
              }`}
            >
              <p className="text-sm font-semibold text-[var(--fc-text)]">{thread.title}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--fc-text-muted)]">
                {thread.model ?? "Modell unbekannt"}
              </p>
              <p className="mt-3 text-xs text-[var(--fc-text-muted)]">
                {thread.updatedAt ?? "Noch keine Aktivitaet"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: FrozenclawMessage }) {
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";

  return (
    <div
      className={`max-w-[88%] border px-4 py-4 ${
        isSystem
          ? "mx-auto border-[var(--fc-border)] bg-black/20 text-[var(--fc-text-muted)]"
          : isAssistant
            ? "border-[var(--fc-border)] bg-black/20 text-[var(--fc-text)]"
            : "ml-auto border-[var(--fc-accent)] bg-[rgba(255,77,77,0.08)] text-[var(--fc-text)]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
        {isSystem ? "System" : isAssistant ? "Frozenclaw" : "Du"}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{message.text}</p>
      {message.timestamp ? (
        <p className="mt-3 text-xs text-[var(--fc-text-muted)]">{message.timestamp}</p>
      ) : null}
    </div>
  );
}

function TaskCard({ task }: { task: FrozenclawTask }) {
  return (
    <div className="border border-[var(--fc-border)] bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--fc-text)]">{task.name}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--fc-text-muted)]">
            {task.schedule}
          </p>
        </div>
        <span className="text-xs uppercase tracking-[0.16em] text-[var(--fc-accent-soft)]">
          {task.status}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-[var(--fc-text-muted)]">
        <p>Letzter Lauf: {task.lastRunAt ?? "Noch nicht ausgefuehrt"}</p>
        <p>Naechster Lauf: {task.nextRunAt ?? "Nicht geplant"}</p>
      </div>
    </div>
  );
}

function ConnectionCard({ connection }: { connection: FrozenclawConnection }) {
  return (
    <div className="border border-[var(--fc-border)] bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--fc-text)]">{connection.label}</p>
          <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">{connection.description}</p>
        </div>
        <span className="text-xs uppercase tracking-[0.16em] text-[var(--fc-accent-soft)]">
          {connection.connected ? "Verbunden" : "Nicht verbunden"}
        </span>
      </div>
      <p className="mt-4 text-xs text-[var(--fc-text-muted)]">
        {connection.connected
          ? `Profil: ${connection.authProfileId ?? "aktiv"}`
          : "Wird in OpenClaw im Hintergrund konfiguriert und hier nur uebersichtlich gezeigt."}
      </p>
    </div>
  );
}

export function FrozenclawWorkspace({ initialSnapshot }: FrozenclawWorkspaceProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedThreadId, setSelectedThreadId] = useState(initialSnapshot.selectedThreadId);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const usageText = useMemo(() => {
    if (snapshot.remainingStandardTokens === null || snapshot.includedStandardTokens === null) {
      return "Eigener API-Key aktiv";
    }

    return `${formatStandardTokens(snapshot.remainingStandardTokens)} von ${formatStandardTokens(
      snapshot.includedStandardTokens,
    )} Tokens frei`;
  }, [snapshot.includedStandardTokens, snapshot.remainingStandardTokens]);

  async function loadThread(sessionId: string) {
    setSelectedThreadId(sessionId);
    setError(null);

    const response = await fetch(`/api/chat?sessionId=${encodeURIComponent(sessionId)}`, {
      method: "GET",
      credentials: "same-origin",
    });

    if (!response.ok) {
      setError("Die Unterhaltung konnte nicht geladen werden.");
      return;
    }

    const payload = (await response.json()) as FrozenclawWorkspaceSnapshot;
    setSnapshot(payload);
    setSelectedThreadId(payload.selectedThreadId);
  }

  function handleNewThread() {
    setSelectedThreadId(null);
    setSnapshot((current) => ({
      ...current,
      selectedThreadId: null,
      messages: [],
    }));
    setDraft("");
    setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.trim()) {
      setError("Bitte zuerst eine Nachricht eingeben.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          sessionId: selectedThreadId,
          message: draft,
        }),
      });

      const payload = (await response.json()) as FrozenclawWorkspaceSnapshot & { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Die Nachricht konnte nicht gesendet werden.");
        return;
      }

      setSnapshot(payload);
      setSelectedThreadId(payload.selectedThreadId);
      setDraft("");
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)_20rem]">
      <aside className="panel-cut fc-panel h-fit xl:sticky xl:top-6">
        <p className="section-kicker">Frozenclaw UI</p>
        <h1 className="mt-3 font-display text-4xl uppercase text-[var(--fc-text)]">Chat und Steuerung</h1>
        <p className="mt-4 text-base leading-8 text-[var(--fc-text-muted)]">
          Die gleiche Instanz wie bisher, aber in einer klareren Oberflaeche fuer Chat, Aufgaben und Verbindungen.
        </p>

        <div className="mt-6 grid gap-3">
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>{snapshot.planLabel}</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>{snapshot.usageModeLabel}</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>{snapshot.instanceStatusLabel}</span>
          </div>
          <div className="signal-row">
            <span className="signal-index">+</span>
            <span>{snapshot.modelLabel ?? "Modell wird automatisch gesetzt"}</span>
          </div>
        </div>

        <nav className="mt-8 grid gap-2">
          {sectionLink("chat", "Chat")}
          {sectionLink("aufgaben", "Aufgaben")}
          {sectionLink("verbindungen", "Verbindungen")}
          {sectionLink("uebersicht", "Uebersicht")}
        </nav>
      </aside>

      <div className="space-y-6">
        <section id="chat" className="panel-cut fc-panel">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--fc-border)] pb-5">
            <div>
              <p className="section-kicker">Chat</p>
              <h2 className="mt-3 text-4xl font-semibold text-[var(--fc-text)]">Dein Agent im Browser</h2>
            </div>
            <div className="text-right text-sm uppercase tracking-[0.16em] text-[var(--fc-text-muted)]">
              <p>{snapshot.accountLabel}</p>
              <p className="mt-2">{usageText}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <ThreadList
              threads={snapshot.threads}
              selectedThreadId={selectedThreadId}
              onSelect={(threadId) => {
                void loadThread(threadId);
              }}
              onCreate={handleNewThread}
            />

            <div className="flex min-h-[34rem] flex-col border border-[var(--fc-border)] bg-black/20">
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {snapshot.messages.length === 0 ? (
                  <div className="border border-dashed border-[var(--fc-border)] p-5 text-sm leading-7 text-[var(--fc-text-muted)]">
                    Noch keine Nachricht in dieser Unterhaltung. Starte mit einer kurzen Aufgabe oder Frage.
                  </div>
                ) : null}
                {snapshot.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>

              <form onSubmit={handleSubmit} className="border-t border-[var(--fc-border)] p-4">
                <label className="block text-xs uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">
                  Neue Nachricht
                </label>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Was soll dein Agent als Naechstes tun?"
                  className="mt-3 min-h-32 w-full border border-[var(--fc-border)] bg-black/30 px-4 py-4 text-sm text-[var(--fc-text)] outline-none transition focus:border-[var(--fc-accent)]"
                />
                {error ? <p className="mt-3 text-sm text-[var(--fc-accent-soft)]">{error}</p> : null}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--fc-text-muted)]">
                    Antworten laufen ueber dieselbe OpenClaw-Instanz wie bisher.
                  </p>
                  <button type="submit" className="fc-button fc-button-primary" disabled={isPending}>
                    {isPending ? "Wird gesendet..." : "Nachricht senden"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section id="aufgaben" className="panel-cut fc-panel">
          <div className="border-b border-[var(--fc-border)] pb-5">
            <p className="section-kicker">Wiederkehrende Aufgaben</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">Automationen im Blick</h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--fc-text-muted)]">
              Frozenclaw zeigt hier die laufenden Aufgaben deiner Instanz. Die tiefe Konfiguration bleibt
              vorerst in OpenClaw selbst, damit diese Ansicht fuer normale Nutzer klar bleibt.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {snapshot.tasks.length === 0 ? (
              <div className="border border-dashed border-[var(--fc-border)] p-5 text-sm leading-7 text-[var(--fc-text-muted)]">
                Noch keine wiederkehrenden Aufgaben vorhanden. Sobald Cronjobs aktiv sind, erscheinen sie hier.
              </div>
            ) : null}
            {snapshot.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>

        <section id="verbindungen" className="panel-cut fc-panel">
          <div className="border-b border-[var(--fc-border)] pb-5">
            <p className="section-kicker">Verbindungen</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">Kanaele und Zugang</h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--fc-text-muted)]">
              Hier siehst du, welche Kanaele fuer deine Instanz verbunden sind. So bleibt klar, wo dein
              Agent aktiv werden kann.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {snapshot.connections.map((connection) => (
              <ConnectionCard key={connection.id} connection={connection} />
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section id="uebersicht" className="panel-cut fc-panel">
          <p className="section-kicker">Uebersicht</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">Aktueller Zustand</h2>

          <div className="mt-6 grid gap-4">
            <div className="border border-[var(--fc-border)] bg-black/20 p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">Instanz</p>
              <p className="mt-3 text-xl font-semibold text-[var(--fc-text)]">
                {snapshot.instanceSlug ?? "Nicht hinterlegt"}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">{snapshot.instanceStatusLabel}</p>
            </div>

            <div className="border border-[var(--fc-border)] bg-black/20 p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">Modell</p>
              <p className="mt-3 text-xl font-semibold text-[var(--fc-text)]">
                {snapshot.modelLabel ?? "Automatisch"}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">
                Der sichtbare Chat bleibt einfach. Modellumschaltungen laufen im Hintergrund ueber deinen Plan.
              </p>
            </div>

            <div className="border border-[var(--fc-border)] bg-black/20 p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">Verbrauch</p>
              <p className="mt-3 text-xl font-semibold text-[var(--fc-text)]">{usageText}</p>
              {snapshot.usedStandardTokens !== null ? (
                <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">
                  Bisher genutzt: {formatStandardTokens(snapshot.usedStandardTokens)}
                </p>
              ) : (
                <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">
                  Im Standardplan rechnest du direkt mit deinem eigenen API-Key ab.
                </p>
              )}
            </div>

            <div className="border border-[var(--fc-border)] bg-black/20 p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">Provider</p>
              <div className="mt-3 grid gap-3">
                {snapshot.providers.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[var(--fc-text)]">{provider.label}</span>
                    <span className="text-[var(--fc-text-muted)]">
                      {provider.configured ? "Aktiv" : "Nicht hinterlegt"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
