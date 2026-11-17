import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InfoIcon } from "@/components/ui/icons";
import type { SettingsSaveError } from "../../hooks/use-settings-save";

export function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
      <InfoIcon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0"
      />
      <span>{children}</span>
    </p>
  );
}

/** One tab = one card with its own Save (checklist §1.1). */
export function SettingsSection({
  id,
  title,
  description,
  children,
  dirty,
  saving,
  error,
  onSave,
  onReload,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  dirty: boolean;
  saving: boolean;
  error: SettingsSaveError | null;
  onSave: () => void;
  onReload: () => void;
}) {
  return (
    <Card
      role="region"
      aria-labelledby={`${id}-title`}
      className="space-y-4 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2
            id={`${id}-title`}
            className="text-sm font-semibold text-foreground"
          >
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button
          size="sm"
          disabled={!dirty || saving}
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-error-muted px-3 py-2 text-xs text-error"
        >
          <span>{error.message}</span>
          {error.code === "STALE" && (
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={onReload}
            >
              Reload latest
            </Button>
          )}
        </div>
      )}
      {children}
    </Card>
  );
}
