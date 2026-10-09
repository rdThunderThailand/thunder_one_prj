import type { ComponentType, ReactNode } from "react";

/** The numbered card frame shared by the four Edit sections (mockup 03). */
export function EditCard({
  step,
  isRequired = false,
  icon: Icon,
  hint,
  error,
  children,
}: {
  step: string;
  /** Red asterisk after the title (QA 2026-10-08 #17: every required marker is red). */
  isRequired?: boolean;
  /** Frame 03's tile beside each section title. */
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  hint?: string;
  /** A backend error tagged for this card (`[details]`, `[content]`, …). */
  error?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-panel">
      <header className="mb-4 flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-sm font-bold text-foreground">
            {step}
            {isRequired && <span className="text-danger"> *</span>}
          </h2>
          {hint && <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>}
        </div>
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
