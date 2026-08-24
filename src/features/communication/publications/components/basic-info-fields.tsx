import type { ReactNode } from "react";

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}

export function FieldWrapper({ label, required, optional, error, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700">
        {label} {required && <span className="text-red-500">*</span>}
        {optional && <span className="text-zinc-400">(Optional)</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

/** Derived metadata (Brand, Format) — the value follows another field, so it is shown
 * rather than picked. Brand lives on the campaign and Format on the publication type. */
export function DerivedField({ value }: { value: string | undefined }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 pl-3.5 pr-3.5 text-sm text-zinc-600">
      {value || <span className="text-zinc-400">—</span>}
    </div>
  );
}
