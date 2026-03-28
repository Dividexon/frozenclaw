"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  FrozenclawConnection,
  FrozenclawMessage,
  FrozenclawTask,
  FrozenclawTaskAction,
  FrozenclawWorkspaceSnapshot,
} from "@/lib/frozenclaw-ui";
import type { DashboardProvider } from "@/lib/dashboard";

type FrozenclawWorkspaceProps = {
  initialSnapshot: FrozenclawWorkspaceSnapshot;
};

type WorkspaceSection = "chat" | "aufgaben" | "verbindungen";

type TaskFormState = {
  name: string;
  message: string;
  scheduleMode: "every" | "cron";
  every: string;
  cron: string;
  enabled: boolean;
};

const INITIAL_TASK_FORM: TaskFormState = {
  name: "",
  message: "",
  scheduleMode: "every",
  every: "1h",
  cron: "",
  enabled: true,
};

async function readApiResponse<T>(response: Response): Promise<(T & { error?: string }) | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T & { error?: string };
  } catch {
    return {
      error: `Unerwartete Serverantwort (${response.status}).`,
    } as T & { error?: string };
  }
}

function formatStandardTokens(value: number | null) {
  if (value === null) {
    return "Nicht aktiv";
  }

  return new Intl.NumberFormat("de-DE").format(value);
}

function sectionButton(
  id: WorkspaceSection,
  label: string,
  activeSection: WorkspaceSection,
  onSelect: (section: WorkspaceSection) => void,
) {
  const active = activeSection === id;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`border px-4 py-3 text-left text-sm uppercase tracking-[0.16em] transition ${
        active
          ? "border-[var(--fc-accent)] bg-[rgba(255,77,77,0.08)] text-[var(--fc-text)]"
          : "border-[var(--fc-border)] bg-black/20 text-[var(--fc-text-muted)] hover:border-[var(--fc-accent)] hover:bg-[rgba(255,77,77,0.08)] hover:text-[var(--fc-text)]"
      }`}
    >
      {label}
    </button>
  );
}

function smallActionButton(label: string, onClick: () => void, disabled = false) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="border border-[var(--fc-border)] bg-black/20 px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--fc-text-muted)] transition hover:border-[var(--fc-accent)] hover:bg-[rgba(255,77,77,0.08)] hover:text-[var(--fc-text)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
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

function TaskCard({
  task,
  pendingTaskId,
  onAction,
}: {
  task: FrozenclawTask;
  pendingTaskId: string | null;
  onAction: (taskId: string, action: FrozenclawTaskAction) => void;
}) {
  const isPending = pendingTaskId === task.id;

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
      {task.message ? (
        <p className="mt-4 text-sm leading-7 text-[var(--fc-text-muted)]">{task.message}</p>
      ) : null}
      <div className="mt-4 grid gap-2 text-sm text-[var(--fc-text-muted)]">
        <p>Letzter Lauf: {task.lastRunAt ?? "Noch nicht ausgeführt"}</p>
        <p>Nächster Lauf: {task.nextRunAt ?? "Nicht geplant"}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {smallActionButton("Jetzt ausführen", () => onAction(task.id, "run"), isPending)}
        {task.enabled
          ? smallActionButton("Pausieren", () => onAction(task.id, "disable"), isPending)
          : smallActionButton("Aktivieren", () => onAction(task.id, "enable"), isPending)}
        {smallActionButton("Löschen", () => onAction(task.id, "delete"), isPending)}
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
      <p className="mt-4 text-sm leading-7 text-[var(--fc-text-muted)]">{connection.statusDetail}</p>
    </div>
  );
}

function ProviderCard({ provider }: { provider: DashboardProvider }) {
  return (
    <div className="border border-[var(--fc-border)] bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--fc-text)]">{provider.label}</p>
          <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">
            {provider.configured
              ? `API-Key aktiv${provider.maskedKey ? ` (${provider.maskedKey})` : ""}.`
              : "Noch kein API-Key hinterlegt."}
          </p>
        </div>
        <span className="text-xs uppercase tracking-[0.16em] text-[var(--fc-accent-soft)]">
          {provider.configured ? "Aktiv" : "Inaktiv"}
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--fc-text-muted)]">
        {provider.lastUsedAt ? `Zuletzt genutzt: ${provider.lastUsedAt}` : "Noch keine Nutzung registriert."}
      </p>
    </div>
  );
}

export function FrozenclawWorkspace({ initialSnapshot }: FrozenclawWorkspaceProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedThreadId, setSelectedThreadId] = useState(initialSnapshot.selectedThreadId);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("chat");
  const [messageResetIndex, setMessageResetIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormState>(INITIAL_TASK_FORM);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [isChatPending, startChatTransition] = useTransition();
  const [isTaskPending, startTaskTransition] = useTransition();

  const usageText = useMemo(() => {
    if (snapshot.remainingStandardTokens === null || snapshot.includedStandardTokens === null) {
      return "Eigener API-Key aktiv";
    }

    return `${formatStandardTokens(snapshot.remainingStandardTokens)} von ${formatStandardTokens(
      snapshot.includedStandardTokens,
    )} Tokens frei`;
  }, [snapshot.includedStandardTokens, snapshot.remainingStandardTokens]);

  const visibleMessages = useMemo(() => {
    return snapshot.messages.slice(Math.min(messageResetIndex, snapshot.messages.length));
  }, [messageResetIndex, snapshot.messages]);

  function applySnapshot(nextSnapshot: FrozenclawWorkspaceSnapshot) {
    const sessionChanged = nextSnapshot.selectedThreadId !== selectedThreadId;
    setSnapshot(nextSnapshot);
    setSelectedThreadId(nextSnapshot.selectedThreadId);

    if (sessionChanged) {
      setMessageResetIndex(0);
    }
  }

  function handleResetChat() {
    setMessageResetIndex(snapshot.messages.length);
    setDraft("");
    setChatError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.trim()) {
      setChatError("Bitte zuerst eine Nachricht eingeben.");
      return;
    }

    setChatError(null);

    startChatTransition(async () => {
      try {
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

        const payload = await readApiResponse<FrozenclawWorkspaceSnapshot>(response);

        if (!response.ok || !payload) {
          setChatError(payload?.error ?? "Die Nachricht konnte nicht gesendet werden.");
          return;
        }

        applySnapshot(payload);
        setDraft("");
      } catch {
        setChatError("Die Nachricht konnte gerade nicht gesendet werden.");
      }
    });
  }

  function handleTaskCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTaskError(null);

    startTaskTransition(async () => {
      try {
        const response = await fetch("/api/chat/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            name: taskForm.name,
            message: taskForm.message,
            scheduleMode: taskForm.scheduleMode,
            every: taskForm.scheduleMode === "every" ? taskForm.every : null,
            cron: taskForm.scheduleMode === "cron" ? taskForm.cron : null,
            enabled: taskForm.enabled,
            sessionId: selectedThreadId,
          }),
        });

        const payload = await readApiResponse<FrozenclawWorkspaceSnapshot>(response);

        if (!response.ok || !payload) {
          setTaskError(payload?.error ?? "Die Aufgabe konnte nicht erstellt werden.");
          return;
        }

        applySnapshot(payload);
        setTaskForm(INITIAL_TASK_FORM);
      } catch {
        setTaskError("Die Aufgabe konnte gerade nicht erstellt werden.");
      }
    });
  }

  function handleTaskAction(taskId: string, action: FrozenclawTaskAction) {
    setPendingTaskId(taskId);
    setTaskError(null);

    startTaskTransition(async () => {
      try {
        const response = await fetch(`/api/chat/tasks/${encodeURIComponent(taskId)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            action,
            sessionId: selectedThreadId,
          }),
        });

        const payload = await readApiResponse<FrozenclawWorkspaceSnapshot>(response);

        if (!response.ok || !payload) {
          setTaskError(payload?.error ?? "Die Aufgabenaktion konnte nicht ausgeführt werden.");
          return;
        }

        applySnapshot(payload);
      } catch {
        setTaskError("Die Aufgabenaktion konnte gerade nicht ausgeführt werden.");
      } finally {
        setPendingTaskId(null);
      }
    });
  }

  return (
    <div className="grid h-full min-h-0 gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="panel-cut fc-panel h-full min-h-0 overflow-y-auto">
        <p className="section-kicker">Frozenclaw UI</p>
        <h1 className="mt-3 font-display text-4xl uppercase text-[var(--fc-text)]">Chat und Steuerung</h1>
        <p className="mt-4 text-base leading-8 text-[var(--fc-text-muted)]">
          Die gleiche Instanz wie bisher, aber in einer klareren Oberfläche für Chat, Aufgaben und Verbindungen.
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
          {sectionButton("chat", "Chat", activeSection, setActiveSection)}
          {sectionButton("aufgaben", "Aufgaben", activeSection, setActiveSection)}
          {sectionButton("verbindungen", "Verbindungen", activeSection, setActiveSection)}
        </nav>
      </aside>

      <div className="min-h-0 overflow-hidden pr-1">
        {activeSection === "chat" ? (
          <section className="panel-cut fc-panel flex h-full min-h-0 flex-col">
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

            <div className="mt-6 min-h-0 flex-1">
              <div className="flex h-full min-h-0 flex-col border border-[var(--fc-border)] bg-black/20">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--fc-border)] px-4 py-4">
                  <div>
                    <p className="section-kicker">Unterhaltung</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--fc-text-muted)]">
                      Frozenclaw arbeitet hier immer in derselben OpenClaw-Instanz. <code>Neu</code> leert nur die Ansicht.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="fc-button fc-button-secondary min-h-0 px-4 py-3"
                    onClick={handleResetChat}
                  >
                    Neu
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                  {visibleMessages.length === 0 ? (
                    <div className="border border-dashed border-[var(--fc-border)] p-5 text-sm leading-7 text-[var(--fc-text-muted)]">
                      Noch keine sichtbare Nachricht. Starte mit einer kurzen Aufgabe oder Frage.
                    </div>
                  ) : null}
                  {visibleMessages.map((message) => (
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
                    placeholder="Was soll dein Agent als Nächstes tun?"
                    className="mt-3 min-h-32 w-full border border-[var(--fc-border)] bg-black/30 px-4 py-4 text-sm text-[var(--fc-text)] outline-none transition focus:border-[var(--fc-accent)]"
                  />
                  {chatError ? <p className="mt-3 text-sm text-[var(--fc-accent-soft)]">{chatError}</p> : null}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-[var(--fc-text-muted)]">
                      Antworten laufen über dieselbe OpenClaw-Instanz wie bisher.
                    </p>
                    <button type="submit" className="fc-button fc-button-primary" disabled={isChatPending}>
                      {isChatPending ? "Wird gesendet..." : "Nachricht senden"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        ) : null}

        {activeSection === "aufgaben" ? (
          <section className="panel-cut fc-panel h-full overflow-y-auto">
            <div className="border-b border-[var(--fc-border)] pb-5">
              <p className="section-kicker">Wiederkehrende Aufgaben</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">Automationen direkt verwalten</h2>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--fc-text-muted)]">
                Lege wiederkehrende Aufgaben direkt hier an. Frozenclaw schreibt sie in den OpenClaw-Cronstore
                deiner Instanz und zeigt den aktuellen Zustand sofort wieder an.
              </p>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
              <form onSubmit={handleTaskCreate} className="border border-[var(--fc-border)] bg-black/20 p-5">
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">Neue Aufgabe</p>
                <div className="mt-5 grid gap-4">
                  <label className="grid gap-2 text-sm text-[var(--fc-text-muted)]">
                    Name
                    <input
                      value={taskForm.name}
                      onChange={(event) => setTaskForm((current) => ({ ...current, name: event.target.value }))}
                      className="border border-[var(--fc-border)] bg-black/30 px-4 py-3 text-[var(--fc-text)] outline-none transition focus:border-[var(--fc-accent)]"
                      placeholder="Morgendliche Zusammenfassung"
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-[var(--fc-text-muted)]">
                    Auftrag
                    <textarea
                      value={taskForm.message}
                      onChange={(event) => setTaskForm((current) => ({ ...current, message: event.target.value }))}
                      className="min-h-32 border border-[var(--fc-border)] bg-black/30 px-4 py-3 text-[var(--fc-text)] outline-none transition focus:border-[var(--fc-accent)]"
                      placeholder="Prüfe neue Dateien und schicke eine kurze Zusammenfassung."
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm text-[var(--fc-text-muted)]">
                      Zeitplan
                      <select
                        value={taskForm.scheduleMode}
                        onChange={(event) =>
                          setTaskForm((current) => ({
                            ...current,
                            scheduleMode: event.target.value === "cron" ? "cron" : "every",
                          }))}
                        className="border border-[var(--fc-border)] bg-black/30 px-4 py-3 text-[var(--fc-text)] outline-none transition focus:border-[var(--fc-accent)]"
                      >
                        <option value="every">Intervall</option>
                        <option value="cron">Cron-Ausdruck</option>
                      </select>
                    </label>

                    {taskForm.scheduleMode === "every" ? (
                      <label className="grid gap-2 text-sm text-[var(--fc-text-muted)]">
                        Intervall
                        <input
                          value={taskForm.every}
                          onChange={(event) =>
                            setTaskForm((current) => ({ ...current, every: event.target.value }))}
                          className="border border-[var(--fc-border)] bg-black/30 px-4 py-3 text-[var(--fc-text)] outline-none transition focus:border-[var(--fc-accent)]"
                          placeholder="1h"
                        />
                      </label>
                    ) : (
                      <label className="grid gap-2 text-sm text-[var(--fc-text-muted)]">
                        Cron-Ausdruck
                        <input
                          value={taskForm.cron}
                          onChange={(event) =>
                            setTaskForm((current) => ({ ...current, cron: event.target.value }))}
                          className="border border-[var(--fc-border)] bg-black/30 px-4 py-3 text-[var(--fc-text)] outline-none transition focus:border-[var(--fc-accent)]"
                          placeholder="0 8 * * *"
                        />
                      </label>
                    )}
                  </div>

                  <label className="flex items-center gap-3 text-sm text-[var(--fc-text-muted)]">
                    <input
                      type="checkbox"
                      checked={taskForm.enabled}
                      onChange={(event) =>
                        setTaskForm((current) => ({ ...current, enabled: event.target.checked }))}
                      className="h-4 w-4 accent-[var(--fc-accent)]"
                    />
                    Aufgabe direkt aktiv schalten
                  </label>
                </div>

                {taskError ? <p className="mt-4 text-sm text-[var(--fc-accent-soft)]">{taskError}</p> : null}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--fc-text-muted)]">
                    Beispiele: <span className="text-[var(--fc-text)]">30m</span>,{" "}
                    <span className="text-[var(--fc-text)]">1h</span>,{" "}
                    <span className="text-[var(--fc-text)]">24h</span>
                  </p>
                  <button type="submit" className="fc-button fc-button-primary" disabled={isTaskPending}>
                    {isTaskPending ? "Wird gespeichert..." : "Aufgabe anlegen"}
                  </button>
                </div>
              </form>

              <div className="grid gap-4">
                {snapshot.tasks.length === 0 ? (
                  <div className="border border-dashed border-[var(--fc-border)] p-5 text-sm leading-7 text-[var(--fc-text-muted)]">
                    Noch keine wiederkehrenden Aufgaben vorhanden. Lege rechts die erste Routine an.
                  </div>
                ) : null}
                {snapshot.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    pendingTaskId={pendingTaskId}
                    onAction={handleTaskAction}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {activeSection === "verbindungen" ? (
          <section className="panel-cut fc-panel h-full overflow-y-auto">
            <div className="border-b border-[var(--fc-border)] pb-5">
              <p className="section-kicker">Verbindungen</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--fc-text)]">Kanäle und Modellzugang</h2>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--fc-text-muted)]">
                Hier siehst du, über welche Kanäle dein Agent erreichbar ist und welcher Modellzugang im
                Hintergrund für deine Instanz bereitsteht.
              </p>
            </div>

            <div className="mt-6 grid gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">Messenger</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {snapshot.connections.map((connection) => (
                    <ConnectionCard key={connection.id} connection={connection} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">Modellzugang</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {snapshot.providers.map((provider) => (
                    <ProviderCard key={provider.id} provider={provider} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
