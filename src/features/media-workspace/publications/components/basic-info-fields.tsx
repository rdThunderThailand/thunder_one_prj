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
