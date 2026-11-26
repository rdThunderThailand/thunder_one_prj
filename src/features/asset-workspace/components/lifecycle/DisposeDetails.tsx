import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { DisposeIcon, FileTextIcon, InfoIcon } from "@/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { Textarea } from "@/components/ui/lovable/textarea";
import { DISPOSAL_METHODS, LIFECYCLE_TEXT_MAX } from "../../domain/asset-lifecycle-actions";
import type { DisposeFlow } from "../../hooks/use-dispose-flow";
import { AssignAttachments } from "../assignments/AssignAttachments";

function FieldError({ id, message }: { id: string; message: string | null }) {
  return message ? <p id={id} className="text-xs text-error">{message}</p> : null;
}

export function DisposeDetails({ flow }: { flow: DisposeFlow }) {
  const { draft, errors } = flow;
  const [touched, setTouched] = useState({ method: false, reason: false });
  const methodError = touched.method ? errors.method : null;
  const reasonError = touched.reason ? errors.reason : null;
  return (
    <Card className="space-y-4 p-4 focus-within:border-foreground/20 focus-within:shadow-float">
      <header className="space-y-0.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileTextIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          1. Disposal Details
        </h2>
        <p className="pl-6 text-xs text-muted-foreground">Provide information for disposing this asset.</p>
      </header>
      <div className="flex items-start gap-2 rounded-control border border-primary/15 bg-accent/60 p-3 text-xs text-foreground">
        <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
        <p>
          Disposing an asset will permanently remove it from your organization. This action cannot be undone. Please
          ensure the asset has been retired before disposal.
        </p>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-1.5">
          <label htmlFor="dispose-method" className="text-xs font-medium text-foreground">
            Disposal Method <span className="text-error">*</span>
          </label>
          <Select
            value={draft.method}
            onValueChange={(value) => { setTouched((prev) => ({ ...prev, method: true })); flow.setMethod(value); }}
            required
          >
            <SelectTrigger
              id="dispose-method"
              className="min-h-10"
              aria-invalid={Boolean(methodError)}
              aria-describedby={methodError ? "dispose-method-error" : undefined}
            >
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {DISPOSAL_METHODS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  <span className="inline-flex items-center gap-2">
                    <DisposeIcon aria-hidden="true" className="size-4" />
                    {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="dispose-method-error" message={methodError} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="dispose-reason" className="text-xs font-medium text-foreground">
          Reason for Disposal <span className="text-error">*</span>
        </label>
        <Textarea
          id="dispose-reason"
          required
          rows={3}
          maxLength={LIFECYCLE_TEXT_MAX}
          placeholder="Explain why this asset is being disposed…"
          value={draft.reason}
          onChange={(event) => { setTouched((prev) => ({ ...prev, reason: true })); flow.setReason(event.target.value); }}
          onBlur={() => setTouched((prev) => ({ ...prev, reason: true }))}
          aria-invalid={Boolean(reasonError)}
          aria-describedby={reasonError ? "dispose-reason-count dispose-reason-error" : "dispose-reason-count"}
        />
        <div className="flex items-center justify-between gap-2">
          <FieldError id="dispose-reason-error" message={reasonError} />
          <p id="dispose-reason-count" className="ml-auto text-right text-2xs tabular-nums text-muted-foreground">
            {draft.reason.length} / {LIFECYCLE_TEXT_MAX}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="dispose-notes" className="text-xs font-medium text-foreground">Notes</label>
        <Textarea
          id="dispose-notes"
          rows={3}
          maxLength={LIFECYCLE_TEXT_MAX}
          placeholder="Certificate no., partner or location (optional)…"
          value={draft.notes}
          onChange={(event) => flow.setNotes(event.target.value)}
          aria-describedby="dispose-notes-count"
        />
        <p id="dispose-notes-count" className="text-right text-2xs tabular-nums text-muted-foreground">
          {draft.notes.length} / {LIFECYCLE_TEXT_MAX}
        </p>
      </div>
      <AssignAttachments evidence={flow.evidence} />
    </Card>
  );
}
