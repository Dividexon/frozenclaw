"use client";

import { useState } from "react";

type CopyFieldProps = {
  label: string;
  value: string;
  conceal?: boolean;
  helper?: string;
};

export function CopyField({ label, value, conceal = false, helper }: CopyFieldProps) {
  const [isVisible, setIsVisible] = useState(!conceal);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const displayValue = conceal && !isVisible ? "••••••••••••••••••••" : value;

  return (
    <div className="border border-[var(--fc-border)] bg-black/25 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--fc-text-muted)]">{label}</p>
        <div className="flex flex-wrap gap-2">
          {conceal ? (
            <button
              type="button"
              className="fc-button fc-button-secondary min-h-0 px-3 py-2 text-xs"
              onClick={() => setIsVisible((current) => !current)}
            >
              {isVisible ? "Verbergen" : "Anzeigen"}
            </button>
          ) : null}
          <button
            type="button"
            className="fc-button fc-button-secondary min-h-0 px-3 py-2 text-xs"
            onClick={handleCopy}
          >
            {copied ? "Kopiert" : "Kopieren"}
          </button>
        </div>
      </div>
      <code className="mt-4 block overflow-x-auto border border-[var(--fc-border)] bg-black/35 px-4 py-3 text-sm text-[var(--fc-text)]">
        {displayValue}
      </code>
      {helper ? <p className="mt-3 text-sm leading-7 text-[var(--fc-text-muted)]">{helper}</p> : null}
    </div>
  );
}
