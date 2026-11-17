"use client";

// Employee Verify and Report Unexpected (EMP-03). Same shell and rules as the admin dialogs (DialogShell, verifyInput),
// but they call the `/me` actions, and Mismatch has no Actual Custodian (employees have no people list; spec).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { Textarea } from "@/components/ui/lovable/textarea";
import { DialogShell } from "../../components/inventory/VerifyDialogs";
import { FieldError, FormError } from "../../components/inventory/parts";
import { CONDITIONS, IDENTIFIER_MAX, NOTE_MAX, VERIFY_RESULTS, verifyInput, type SessionAsset, type VerifyDraft } from "../../domain/inventory";
import { reportMyUnexpectedAction, verifyMyAssetAction } from "./my-tasks-actions";
import { writeFailure } from "./my-tasks";

type Place = { id: string; name: string | null };

const SAME = "__same";

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

const placeOptions = (places: Place[]) => places.map((p) => ({ value: p.id, label: p.name ?? "Unnamed location" }));

/** Mount with a `key` per row so the draft starts from that row's current result. */
export function MyVerifyDialog({ taskId, row, locations, onClose }: {
  taskId: string;
  row: SessionAsset;
  locations: Place[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<VerifyDraft>({ result: row.result ?? "Verified", locationId: "", custody: "", condition: "", note: "" });
  const [fieldError, setFieldError] = useState<{ field: "actual" | "note"; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const set = <K extends keyof VerifyDraft>(key: K) => (value: VerifyDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  async function save() {
    const checked = verifyInput(row, { ...draft, custody: "" });
    if (!checked.ok) {
      setFieldError(checked.field === "actual" ? { field: "actual", message: "Choose what is different: location or condition." } : checked);
      return;
    }
    setFieldError(null);
    setSending(true);
    const res = await verifyMyAssetAction(taskId, checked.input);
    setSending(false);
    if (res.ok) {
      onClose();
      return;
    }
    const failure = writeFailure(res.code, res.message);
    if (failure.reload) router.refresh();
    setError(failure.message);
  }

  return (
    <DialogShell
      open
      onOpenChange={(o) => !o && onClose()}
      busy={sending}
      title={`Verify ${row.name}`}
      description={`${row.assetTag}${row.expectedLocation?.name ? ` · expected at ${row.expectedLocation.name}` : ""}`}
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
          aria-describedby="my-verify-actual-error"
        >
          <p className="text-sm text-muted-foreground">Choose what you found. If someone else has it, say so in the note.</p>
          <Choice
            id="my-verify-location"
            label="Actual Location"
            value={draft.locationId}
            onChange={set("locationId")}
            sameLabel={`As expected${row.expectedLocation?.name ? ` (${row.expectedLocation.name})` : ""}`}
            options={placeOptions(locations)}
          />
          <Choice
            id="my-verify-condition"
            label="Condition"
            value={draft.condition}
            onChange={(v) => set("condition")(v as VerifyDraft["condition"])}
            sameLabel="As expected"
            options={CONDITIONS.map((c) => ({ value: c, label: c }))}
          />
          <FieldError
            id="my-verify-actual-error"
            message={fieldError?.field === "actual" ? fieldError.message : undefined}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="my-verify-note">Note</Label>
        <Textarea
          id="my-verify-note"
          rows={3}
          maxLength={NOTE_MAX}
          value={draft.note}
          onChange={(e) => set("note")(e.target.value)}
          aria-invalid={fieldError?.field === "note" || undefined}
          aria-describedby="my-verify-note-error"
        />
        <FieldError
          id="my-verify-note-error"
          message={fieldError?.field === "note" ? fieldError.message : undefined}
        />
      </div>
    </DialogShell>
  );
}

/** Report Unexpected (D3): records a finding only; no asset is registered (AC-016). */
export function MyReportUnexpectedDialog({ taskId, locations, onClose }: {
  taskId: string;
  locations: Place[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
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
    const res = await reportMyUnexpectedAction(taskId, {
      unexpectedIdentifier: code.trim(),
      ...(locationId ? { foundLocationId: locationId } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    setSending(false);
    if (res.ok) {
      onClose();
      return;
    }
    const failure = writeFailure(res.code, res.message);
    if (failure.reload) router.refresh();
    setError(failure.message);
  }

  return (
    <DialogShell
      open
      onOpenChange={(o) => !o && onClose()}
      busy={sending}
      title="Report Unexpected Asset"
      description="For an item you found that is not on your list. It is recorded as a finding; no asset is registered."
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
        <Label htmlFor="my-unexpected-code">Asset tag, serial or barcode *</Label>
        <Input
          id="my-unexpected-code"
          maxLength={IDENTIFIER_MAX}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-invalid={(touched && empty) || undefined}
          aria-describedby="my-unexpected-code-error"
        />
        <FieldError
          id="my-unexpected-code-error"
          message={touched && empty ? "Enter the tag, serial or barcode on the item." : undefined}
        />
      </div>
      <Choice
        id="my-unexpected-location"
        label="Found Location"
        value={locationId}
        onChange={setLocationId}
        sameLabel="Not specified"
        options={placeOptions(locations)}
      />
      <div className="space-y-1.5">
        <Label htmlFor="my-unexpected-note">Note</Label>
        <Textarea
          id="my-unexpected-note"
          rows={3}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </DialogShell>
  );
}
