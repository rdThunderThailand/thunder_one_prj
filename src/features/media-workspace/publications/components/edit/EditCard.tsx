import type { ReactNode } from "react";

/** The numbered card frame shared by the four Edit sections (mockup 03). */
export function EditCard({
  step,
  hint,
  error,
  children,
}: {
  step: string;
  hint?: string;
  /** A backend error tagged for this card (`[details]`, `[content]`, …). */
  error?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-panel">
      <header className="mb-4">
        <h2 className="text-sm font-bold text-foreground">{step}</h2>
        {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
      </header>
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger"
        >
          {error}
        </p>
      )}
      {children}
    </section>
  );
}
