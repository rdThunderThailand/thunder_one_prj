"use client";

// Reconcile one open finding (PO 05 D6 · checklist §1.2 · slice I4). The decision only records: an asset change runs
// first through the asset's own controlled action (link opens in a new tab), and Core refuses the decision until the
// asset shows the found value. Register Asset records the asset registered for an Unexpected identifier.
import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import { Textarea } from "@/components/ui/lovable/textarea";
import {
  assetActionHref,
  DECISION_LABEL,
  decisionsFor,
  FINDING_LABEL,
  NOTE_MAX,
  REASON_MAX,
  reconcileInput,
  type Decision,
  type Finding,
} from "../../domain/inventory";
import { reconcileFindingAction, searchAssetsAction, type ScopeAsset } from "../../services/asset-inventory-actions";
import { FieldError, FormError } from "./parts";
import { DialogShell } from "./VerifyDialogs";

const ACTION_HINT: Partial<Record<Decision, string>> = {
  update_location: "Move the asset to the found location first.",
  transfer_custody: "Transfer the asset to the found custodian first.",
  update_condition: "Change the asset's condition to the found one first.",
  register_asset: "Register the item as a new asset first, then choose it below.",
};

function RegisteredAssetPicker({ initial, value, onChange, error }: {
  initial: string;
  value: ScopeAsset | null;
  onChange: (asset: ScopeAsset | null) => void;
  error?: string;
}) {
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<ScopeAsset[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function search() {
    if (!q.trim()) return;
    setSearching(true);
    setResults((await searchAssetsAction(q)) ?? []);
    setSearching(false);
  }

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
        <span className="min-w-0 truncate">
          <span className="font-medium">{value.name}</span> · {value.assetTag}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange(null)}
        >
          Change
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <Input
          id="reconcile-asset"
          aria-label="Search the registered asset by tag, serial or name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby="reconcile-asset-error"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={searching}
        >
          {searching ? "Searching…" : "Search"}
        </Button>
      </form>
      {results && results.length === 0 && <p className="text-sm text-muted-foreground">No asset matches. Register it first.</p>}
      {results && results.length > 0 && (
        <ul className="max-h-48 divide-y divide-border overflow-y-auto rounded-lg border border-border">
          {results.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => onChange(a)}
              >
                <span className="font-medium">{a.name}</span>
                <span className="text-muted-foreground"> · {a.assetTag}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <FieldError
        id="reconcile-asset-error"
        message={error}
      />
    </div>
  );
}

export function ReconcileDialog({ sessionId, finding, onClose }: { sessionId: string; finding: Finding; onClose: () => void }) {
  const options = decisionsFor(finding.type);
  const [decision, setDecision] = useState<Decision>(options[0]);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [asset, setAsset] = useState<ScopeAsset | null>(null);
  const [fields, setFields] = useState<Partial<Record<"reason" | "assetId" | "note", string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const href = assetActionHref(decision, finding.assetId);
  const subject = finding.asset ? `${finding.asset.name} · ${finding.asset.assetTag}` : finding.unexpectedIdentifier ?? "";

  async function save() {
    const checked = reconcileInput({ decision, reason, note, assetId: asset?.id ?? "" });
    if (!checked.ok) {
      setFields(checked.fields);
      return;
    }
    setFields({});
    setSending(true);
    const res = await reconcileFindingAction(sessionId, finding.id, checked.input);
    setSending(false);
    if (res.ok) onClose();
    else setError(res.message);
  }

  return (
    <DialogShell
      open
      onOpenChange={(o) => !o && onClose()}
      busy={sending}
      title={`Reconcile ${FINDING_LABEL[finding.type]}`}
      description={subject}
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
            {sending ? "Saving…" : "Save Decision"}
          </Button>
        </>
      }
    >
      <FormError message={error} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Decision *</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((d) => (
            <label
              key={d}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                decision === d ? "border-primary bg-accent" : "border-border"
              }`}
            >
              <input
                type="radio"
                name="reconcile-decision"
                value={d}
                checked={decision === d}
                onChange={() => setDecision(d)}
              />
              {DECISION_LABEL[d]}
            </label>
          ))}
        </div>
      </fieldset>
      {ACTION_HINT[decision] && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
          {ACTION_HINT[decision]}{" "}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Open in a new tab
            </a>
          )}
        </p>
      )}
      {decision === "register_asset" && (
        <div className="space-y-1.5">
          <Label htmlFor="reconcile-asset">Registered Asset *</Label>
          <RegisteredAssetPicker
            initial={finding.unexpectedIdentifier ?? ""}
            value={asset}
            onChange={setAsset}
            error={fields.assetId}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="reconcile-reason">Reason *</Label>
        <Textarea
          id="reconcile-reason"
          rows={2}
          maxLength={REASON_MAX}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          aria-invalid={Boolean(fields.reason) || undefined}
          aria-describedby="reconcile-reason-error"
        />
        <FieldError
          id="reconcile-reason-error"
          message={fields.reason}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reconcile-note">Note</Label>
        <Textarea
          id="reconcile-note"
          rows={2}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-invalid={Boolean(fields.note) || undefined}
          aria-describedby="reconcile-note-error"
        />
        <FieldError
          id="reconcile-note-error"
          message={fields.note}
        />
      </div>
    </DialogShell>
  );
}
