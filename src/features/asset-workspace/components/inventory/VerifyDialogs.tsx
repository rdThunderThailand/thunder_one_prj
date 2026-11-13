"use client";

// Verify and Report Unexpected dialogs (PO 05 §4.9 · D3 · checklist §1 I3). Core checks the assignee, the state and
// that a Mismatch really differs; these dialogs only shape the request and show Core's answer.
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { Textarea } from "@/components/ui/lovable/textarea";
import {
  CONDITIONS,
  IDENTIFIER_MAX,
  NOTE_MAX,
  VERIFY_RESULTS,
  verifyInput,
  type CustodianType,
  type SessionAsset,
  type VerifyDraft,
} from "../../domain/inventory";
import { reportUnexpectedAction, verifyAssetAction } from "../../services/asset-inventory-actions";
import { FieldError, FormError } from "./parts";

export interface VerifyOptions {
  locations: { id: string; name: string | null }[];
  custodians: { id: string; name: string | null; type: CustodianType }[];
}

const SAME = "__same";
const STALE = "This result changed since the page loaded. The list is reloaded; check it and try again.";

function Choice({ id, label, value, onChange, sameLabel, options }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  sameLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value || SAME}
        onValueChange={(v) => onChange(v === SAME ? "" : v)}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SAME}>{sameLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DialogShell({ open, onOpenChange, busy, title, description, children, footer }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!busy) onOpenChange(o);
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-xl"
        aria-busy={busy}
        // Only Esc / ✕ / Cancel close it: a stray focus or click outside (page load, scanner) must not drop the entry.
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="break-words pr-6 leading-snug">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2 sm:space-x-0">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Mount with a `key` per row so the draft starts from that row's current result. */
export function VerifyDialog({ sessionId, row, options, onClose }: {
  sessionId: string;
  row: SessionAsset;
  options: VerifyOptions;
  onClose: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<VerifyDraft>({ result: row.result ?? "Verified", locationId: "", custody: "", condition: "", note: "" });
  const [fieldError, setFieldError] = useState<{ field: "actual" | "note"; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const set = <K extends keyof VerifyDraft>(key: K) => (value: VerifyDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  async function save() {
    const checked = verifyInput(row, draft);
    if (!checked.ok) {
      setFieldError(checked);
      return;
    }
    setFieldError(null);
    setSending(true);
    const res = await verifyAssetAction(sessionId, checked.input);
    setSending(false);
    if (res.ok) {
      onClose();
      return;
    }
    if (res.code === "STALE") router.refresh();
    setError(res.code === "STALE" ? STALE : res.message);
  }

  const where = [row.expectedLocation?.name, row.expectedCustodian?.name].filter(Boolean).join(" · ");
  return (
    <DialogShell
      open
      onOpenChange={(o) => !o && onClose()}
      busy={sending}
      title={`Verify ${row.name}`}
      description={`${row.assetTag}${where ? ` · expected at ${where}` : ""}`}
      footer={
        <>
          <Button
            variant="outline"
            disabled={sending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={sending}
            onClick={() => void save()}
          >
            {sending ? "Saving…" : row.result ? "Update Result" : "Save Result"}
          </Button>
        </>
      }
    >
      <FormError message={error} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Result *</legend>
        <div className="flex flex-wrap gap-2">
          {VERIFY_RESULTS.map((r) => (
            <label
              key={r}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                draft.result === r ? "border-primary bg-accent" : "border-border"
              }`}
            >
              <input
                type="radio"
                name="verify-result"
                value={r}
                checked={draft.result === r}
                onChange={() => set("result")(r)}
              />
              {r}
            </label>
          ))}
        </div>
      </fieldset>
      {draft.result === "Mismatch" && (
        <div
          className="space-y-3"
          aria-describedby="verify-actual-error"
        >
          <p className="text-sm text-muted-foreground">Choose what you found. Leave the rest as expected.</p>
          <Choice
            id="verify-location"
            label="Actual Location"
            value={draft.locationId}
            onChange={set("locationId")}
            sameLabel={`As expected${row.expectedLocation?.name ? ` (${row.expectedLocation.name})` : ""}`}
            options={options.locations.map((l) => ({ value: l.id, label: l.name ?? "Unnamed location" }))}
          />
          <Choice
            id="verify-custody"
            label="Actual Custodian"
            value={draft.custody}
            onChange={set("custody")}
            sameLabel={`As expected${row.expectedCustodian?.name ? ` (${row.expectedCustodian.name})` : ""}`}
            options={options.custodians.map((c) => ({
              value: `${c.type}:${c.id}`,
              label: `${c.name ?? "Unnamed"}${c.type === "org_unit" ? " (Org unit)" : ""}`,
            }))}
          />
          <Choice
            id="verify-condition"
            label="Condition"
            value={draft.condition}
            onChange={(v) => set("condition")(v as VerifyDraft["condition"])}
            sameLabel="As expected"
            options={CONDITIONS.map((c) => ({ value: c, label: c }))}
          />
          <FieldError
            id="verify-actual-error"
            message={fieldError?.field === "actual" ? fieldError.message : undefined}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="verify-note">Note</Label>
        <Textarea
          id="verify-note"
          rows={3}
          maxLength={NOTE_MAX}
          value={draft.note}
          onChange={(e) => set("note")(e.target.value)}
          aria-invalid={fieldError?.field === "note" || undefined}
          aria-describedby="verify-note-error"
        />
        <FieldError
          id="verify-note-error"
          message={fieldError?.field === "note" ? fieldError.message : undefined}
        />
      </div>
    </DialogShell>
  );
}

/** Report Unexpected Asset (D3): records a finding only; the asset is not registered. */
export function ReportUnexpectedDialog({ sessionId, identifier, locations, onClose }: {
  sessionId: string;
  /** Prefill from the scan / search that found nothing. */
  identifier?: string;
  locations: VerifyOptions["locations"];
  onClose: () => void;
}) {
  const [code, setCode] = useState(identifier ?? "");
  const [locationId, setLocationId] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const empty = code.trim() === "";

  async function save() {
    setTouched(true);
    if (empty) return;
    setSending(true);
    const res = await reportUnexpectedAction(sessionId, {
      unexpectedIdentifier: code.trim(),
      ...(locationId ? { foundLocationId: locationId } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    setSending(false);
    if (res.ok) onClose();
    else setError(res.message);
  }

  return (
    <DialogShell
      open
      onOpenChange={(o) => !o && onClose()}
      busy={sending}
      title="Report Unexpected Asset"
      description="For an item found here that is not in this session. It is recorded as a discrepancy; no asset is registered."
      footer={
        <>
          <Button
            variant="outline"
            disabled={sending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={sending}
            onClick={() => void save()}
          >
            {sending ? "Reporting…" : "Report"}
          </Button>
        </>
      }
    >
      <FormError message={error} />
      <div className="space-y-1.5">
        <Label htmlFor="unexpected-code">Asset tag, serial or barcode *</Label>
        <Input
          id="unexpected-code"
          maxLength={IDENTIFIER_MAX}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-invalid={(touched && empty) || undefined}
          aria-describedby="unexpected-code-error"
        />
        <FieldError
          id="unexpected-code-error"
          message={touched && empty ? "Enter the tag, serial or barcode on the item." : undefined}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="unexpected-location">Found Location</Label>
        <Select
          value={locationId || SAME}
          onValueChange={(v) => setLocationId(v === SAME ? "" : v)}
        >
          <SelectTrigger id="unexpected-location">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SAME}>Not specified</SelectItem>
            {locations.map((l) => (
              <SelectItem
                key={l.id}
                value={l.id}
              >
                {l.name ?? "Unnamed location"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="unexpected-note">Note</Label>
        <Textarea
          id="unexpected-note"
          rows={3}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </DialogShell>
  );
}
