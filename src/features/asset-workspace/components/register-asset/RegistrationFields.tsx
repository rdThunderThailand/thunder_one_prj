import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/lovable/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import type { RegistrationDraft } from "../../domain/registration-draft";
import type { RegistrationErrors } from "../../domain/registration-validation";
import type { RegistrationOptions } from "../../services/asset-registration-contract";

export interface RegistrationStepProps {
  draft: RegistrationDraft;
  options: RegistrationOptions;
  errors: RegistrationErrors;
  patch: (changes: Partial<RegistrationDraft>) => void;
}

export function RegistrationSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-card border border-border bg-card p-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function RegistrationField({ name, label, required, error, hint, children }: {
  name: string; label: string; required?: boolean; error?: string; hint?: string; children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={`registration-${name}`} className="block text-xs font-medium text-foreground">
        {label}{required && <span aria-hidden="true" className="text-error"> *</span>}
      </label>
      {children}
      {hint && <p id={`registration-${name}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`registration-${name}-error`} role="alert" className="text-xs text-error">{error}</p>}
    </div>
  );
}

export function RegistrationTextField({ name, label, error, hint, required, ...props }: ComponentProps<typeof Input> & {
  name: string; label: string; error?: string; hint?: string;
}) {
  return (
    <RegistrationField name={name} label={label} error={error} hint={hint} required={required}>
      <Input
        {...props}
        id={`registration-${name}`}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={[hint ? `registration-${name}-hint` : "", error ? `registration-${name}-error` : ""].filter(Boolean).join(" ") || undefined}
      />
    </RegistrationField>
  );
}

export function RegistrationSelect({ name, label, value, onChange, items, error, required, hint }: {
  name: string; label: string; value: string; onChange: (value: string) => void;
  items: { value: string; label: string }[]; error?: string; required?: boolean; hint?: string;
}) {
  return (
    <RegistrationField name={name} label={label} error={error} hint={hint} required={required}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={`registration-${name}`}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `registration-${name}-error` : hint ? `registration-${name}-hint` : undefined}
          className="[&>span]:min-w-0 [&>span]:truncate"
        >
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </RegistrationField>
  );
}

export function UnavailableRegistrationFields({ labels }: { labels: string[] }) {
  return (
    <fieldset disabled className="space-y-3 border-t border-border pt-4">
      <legend className="sr-only">Fields not available in this version</legend>
      <p className="text-xs text-muted-foreground">These fields are not available in this version and will not be saved.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {labels.map((label) => (
          <RegistrationTextField key={label} name={`unavailable-${label.replaceAll(/[^a-zA-Z]/g, "")}`} label={label} placeholder="Not available yet" />
        ))}
      </div>
    </fieldset>
  );
}
