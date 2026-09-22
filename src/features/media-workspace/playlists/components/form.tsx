"use client";

// Local form primitives for the playlist wizard. Same visual language as the publications
// form fields, factored out here because four steps repeat them.

import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";

export const inputClasses =
  "h-9 w-full rounded-lg border border-border bg-card px-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30";

interface FieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, required, optional, hint, error, children, className = "" }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-danger">*</span>}
        {optional && <span className="text-muted-foreground">(Optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ options, placeholder, className = "", ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${inputClasses} appearance-none pr-9 ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClasses.replace("h-9", "min-h-20")} resize-none ${className}`} />;
}

/** Segmented control — used for Media Fit and the failure-handling choice. */
export function OptionGroup<T extends string>({
  value,
  options,
  onChange,
  columns = 3,
}: {
  value: T | undefined;
  options: { value: T; label: string; description?: string }[];
  onChange: (value: T) => void;
  columns?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={selected}
            className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
              selected
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="font-medium">{o.label}</span>
            {o.description && (
              <span className="mt-0.5 block text-xs text-muted-foreground">{o.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-xs text-muted-foreground"
    >
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-card transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      {label}
    </button>
  );
}
