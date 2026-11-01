import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/lovable/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import type { Icon } from "@/components/ui/icons";
import type { RegistrationDraft } from "../../domain/registration-draft";
import type { RegistrationErrors } from "../../domain/registration-validation";
import type { RegistrationOptions } from "../../services/asset-registration-contract";

export interface RegistrationStepProps {
  draft: RegistrationDraft;
  options: RegistrationOptions;
  errors: RegistrationErrors;
  patch: (changes: Partial<RegistrationDraft>) => void;
}

export function RegistrationSection({ title, description, icon: Icon, children }: { title: string; description?: string; icon?: Icon; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-card border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function RegistrationField({ name, label, required, error, hint, children }: {
  name: string; label: string; required?: boolean; error?: string; hint?: string; children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={`registration-${name}`} className="block text-xs font-medium text-foreground">
        {label}{required && <span aria-hidden="true" className="text-error"> *</span>}
      </label>
      {children}
      {hint && <p id={`registration-${name}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`registration-${name}-error`} role="alert" className="text-xs text-error">{error}</p>}
    </div>
  );
}

export function RegistrationHelp({ children }: { children: ReactNode }) {
  return (
    <details className="group text-xs text-muted-foreground">
      <summary className="min-h-8 w-fit cursor-pointer rounded-control py-2 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Help</summary>
      <div className="space-y-2 pt-1">{children}</div>
    </details>
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
  items: { value: string; label: string; disabled?: boolean }[]; error?: string; required?: boolean; hint?: string;
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
          {items.map((item) => <SelectItem key={item.value} value={item.value} disabled={item.disabled}>{item.label}</SelectItem>)}
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
