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
      <label className="text-sm font-medium text-muted-foreground">
        {label} {required && <span className="text-danger">*</span>}
        {optional && <span className="text-muted-foreground">(Optional)</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
