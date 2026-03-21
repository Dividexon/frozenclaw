"use client";

import { useEffect, useState } from "react";

type OrderStatus = {
  paymentStatus: string;
  instanceState: string;
  usageMode: string;
  plan: string;
  activationUrl?: string | null;
};

type OrderStatusPanelProps = {
  sessionId: string;
  initialStatus: OrderStatus | null;
};

const stateLabels: Record<string, string> = {
  pending: "Wartet auf Bereitstellung",
  provisioning: "Instanz wird gerade bereitgestellt",
  ready: "Instanz ist bereit",
  failed: "Bereitstellung fehlgeschlagen",
  archived: "Instanz wurde archiviert",
};

export function OrderStatusPanel({ sessionId, initialStatus }: OrderStatusPanelProps) {
  const [status, setStatus] = useState<OrderStatus | null>(initialStatus);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    if (status?.instanceState === "ready" || status?.instanceState === "failed") {
      return;
    }

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/status/${sessionId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const nextStatus = (await response.json()) as OrderStatus;
      setStatus(nextStatus);

      if (nextStatus.instanceState === "ready" || nextStatus.instanceState === "failed") {
        window.clearInterval(interval);
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [sessionId, status?.instanceState]);

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      <div className="signal-row">
        <span className="signal-index">#</span>
        <span>{sessionId}</span>
      </div>
      <div className="signal-row">
        <span className="signal-index">+</span>
        <span>
          {status
            ? `${status.plan} / ${status.paymentStatus} / ${
                stateLabels[status.instanceState] ?? status.instanceState
              }`
            : "Status wird geladen"}
        </span>
      </div>

      {status?.activationUrl ? (
        <a href={status.activationUrl} className="fc-button fc-button-secondary sm:col-span-2">
          Instanz öffnen
        </a>
      ) : null}
    </div>
  );
}
