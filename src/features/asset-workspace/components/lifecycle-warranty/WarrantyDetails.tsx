"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ClipboardIcon } from "@/components/ui/icons";
import { Textarea } from "@/components/ui/lovable/textarea";
import { WARRANTY_LIMITS, type WarrantyDraft } from "../../domain/warranty-form";
import { RegistrationDateField } from "../register-asset/RegistrationDateField";
import { RegistrationTextField } from "../register-asset/RegistrationFields";
import { WarrantyAttachments } from "./WarrantyAttachments";
import type { WarrantyFlow } from "./use-warranty-flow";

type Field = "provider" | "type" | "startDate" | "endDate" | "referenceNo" | "coverageNote";

/** Warranty Information step: the PO "Add Warranty Record" dialog's fields laid out as a page (Q14–15, Q25). */
export function WarrantyDetails({ flow, number }: { flow: WarrantyFlow; number: number }) {
  const { draft, errors } = flow;
  // Edit shows missing dates at once (Q25); Add waits until the user touches a field.
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>(() => (flow.edit
    ? { provider: true, type: true, startDate: true, endDate: true, referenceNo: true, coverageNote: true } : {}));
  const shown = (field: Field) => (touched[field] ? errors[field] ?? undefined : undefined);
  const change = <K extends Field>(field: K, value: WarrantyDraft[K]) => {
    setTouched((previous) => ({ ...previous, [field]: true }));
    flow.set(field, value);
  };
  const noteError = shown("coverageNote");
  return (
    <Card className="space-y-4 p-4 focus-within:border-foreground/20 focus-within:shadow-float">
      <header className="space-y-0.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ClipboardIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          {number}. Warranty Information
        </h2>
        <p className="pl-6 text-xs text-muted-foreground">
          {flow.edit ? "Update the details of this warranty record." : "Enter the warranty details for this asset."}
        </p>
      </header>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <RegistrationTextField
          name="warranty-provider"
          label="Provider"
          required
          maxLength={WARRANTY_LIMITS.provider}
          placeholder="e.g. Dell Thailand"
          value={draft.provider}
          error={shown("provider")}
          onChange={(event) => change("provider", event.target.value)}
          onBlur={() => setTouched((previous) => ({ ...previous, provider: true }))}
        />
        <RegistrationTextField
          name="warranty-type"
          label="Warranty Type"
          required
          maxLength={WARRANTY_LIMITS.type}
          placeholder="e.g. Manufacturer, Extended"
          value={draft.type}
          error={shown("type")}
          onChange={(event) => change("type", event.target.value)}
          onBlur={() => setTouched((previous) => ({ ...previous, type: true }))}
        />
        <RegistrationDateField
          name="warranty-start"
          label="Start Date *"
          value={draft.startDate}
          error={shown("startDate")}
          onChange={(value) => change("startDate", value)}
        />
        <RegistrationDateField
          name="warranty-end"
          label="End Date *"
          value={draft.endDate}
          error={shown("endDate")}
          onChange={(value) => change("endDate", value)}
        />
        <RegistrationTextField
          name="warranty-reference"
          label="Reference No."
          maxLength={WARRANTY_LIMITS.referenceNo}
          placeholder="Contract or claim reference (optional)"
          value={draft.referenceNo}
          error={shown("referenceNo")}
          onChange={(event) => change("referenceNo", event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="warranty-note" className="text-xs font-medium text-foreground">Coverage Note</label>
        <Textarea
          id="warranty-note"
          rows={3}
          maxLength={WARRANTY_LIMITS.coverageNote}
          placeholder="What the warranty covers (optional)…"
          value={draft.coverageNote}
          onChange={(event) => change("coverageNote", event.target.value)}
          aria-invalid={Boolean(noteError)}
          aria-describedby={noteError ? "warranty-note-count warranty-note-error" : "warranty-note-count"}
        />
        <div className="flex items-center justify-between gap-2">
          {noteError && <p id="warranty-note-error" className="text-xs text-error">{noteError}</p>}
          <p id="warranty-note-count" className="ml-auto text-right text-2xs tabular-nums text-muted-foreground">
            {draft.coverageNote.length} / {WARRANTY_LIMITS.coverageNote}
          </p>
        </div>
      </div>
      <WarrantyAttachments evidence={flow.documents} linked={flow.linked} />
      {!flow.edit && (
        <label className="flex items-start gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-primary"
            checked={draft.makeCurrent}
            onChange={(event) => flow.set("makeCurrent", event.target.checked)}
          />
          <span>
            <span className="font-medium">Make this the current warranty</span>
            <span className="block text-2xs text-muted-foreground">
              {flow.currentId ? "The current warranty stays in history." : "This asset has no current warranty."}
            </span>
          </span>
        </label>
      )}
    </Card>
  );
}
