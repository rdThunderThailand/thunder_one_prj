"use client";

// Start Inventory wizard (UC-007 · PO 05 §4.9 · FigJam Step 1 / Step 2). Step 1 Next creates the Draft (or saves its
// changes); step 2 edits the scope with a live preview; Save as Draft keeps it for later. Step 3 Review & Start is I2.
// The step lives in the URL (`?step=`), so a reload or a Draft link from the list resumes in place.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { AlertCircleIcon, InfoIcon, SearchIcon, XIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { Textarea } from "@/components/ui/lovable/textarea";
import {
  DESCRIPTION_MAX,
  dueHint,
  NAME_MAX,
  scopeForMode,
  scopeReady,
  toScopeInput,
  validateSetup,
  type CustodianType,
  type Person,
  type ScopeInput,
  type ScopeMode,
  type SessionDetail,
  type SetupDraft,
} from "../../domain/inventory";
import {
  cancelSessionAction,
  createSessionAction,
  previewScopeAction,
  searchAssetsAction,
  updateSessionAction,
  type ScopeAsset,
  type ScopePreview,
} from "../../services/asset-inventory-actions";
import type { AssetFilterOptions } from "../../services/assets-list-types";
import { MultiSelect, type MultiOption } from "./MultiSelect";

const STEPS = ["Session Setup", "Define Scope", "Review & Start"];
const DESCRIPTIONS = ["Name, due date and owner", "Which assets to count", "Check and start"];
const LIST = "/asset-workspace/inventory";
const NO_OWNER = "none";

export interface WizardProps {
  session: SessionDetail | null;
  step: 1 | 2 | 3;
  /** `null` = the caller is not an Asset Admin or the fetch failed: the Owner field is hidden. */
  owners: Person[] | null;
  options: AssetFilterOptions | null;
  today: string;
}

export function InventoryWizard({ session, step, owners, options, today }: WizardProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <PageHeader
        title="Start Inventory"
        subtitle={session ? `Draft · ${session.name}` : "Set up a new inventory session."}
      />
      <WizardSteps
        steps={STEPS}
        descriptions={DESCRIPTIONS}
        currentIndex={step - 1}
        variant="detailed"
      />
      {step === 1 && (
        <SetupStep
          session={session}
          owners={owners}
          today={today}
          onCancel={() => setCancelOpen(true)}
        />
      )}
      {step === 2 && session && (
        <ScopeStep
          session={session}
          options={options}
          onCancel={() => setCancelOpen(true)}
        />
      )}
      {step === 3 && session && <ReviewPlaceholder session={session} />}
      {session && (
        <CancelSessionDialog
          session={session}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
        />
      )}
    </div>
  );
}

const setupHref = (id: string, step: number) => `${LIST}/${id}/setup?step=${step}`;

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-error-muted px-3 py-2 text-sm text-t1-red-700"
    >
      <AlertCircleIcon
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0"
      />
      {message}
    </p>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      className="text-xs text-t1-red-700"
    >
      {message}
    </p>
  );
}

// ── Step 1 ──

function SetupStep({ session, owners, today, onCancel }: {
  session: SessionDetail | null;
  owners: Person[] | null;
  today: string;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<SetupDraft>({
    name: session?.name ?? "",
    description: session?.description ?? "",
    dueDate: session?.dueDate ?? "",
    ownerUserId: session?.owner?.id ?? "",
  });
  const [fields, setFields] = useState<Partial<Record<keyof SetupDraft, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const hint = dueHint(draft.dueDate || null, today);
  const set = (key: keyof SetupDraft) => (value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setFields((f) => ({ ...f, [key]: undefined }));
  };

  async function next() {
    const checked = validateSetup(draft);
    if (!checked.ok) {
      setFields(checked.fields);
      return;
    }
    setFields({});
    setError(null);
    setSending(true);
    const res = session
      ? await updateSessionAction(session.id, session.updatedAt, checked.input)
      : await createSessionAction(checked.input);
    setSending(false);
    if (!res.ok) {
      setError(res.message);
      if (res.fieldErrors) {
        setFields(Object.fromEntries(Object.entries(res.fieldErrors).map(([k, v]) => [k, v[0]])));
      }
      return;
    }
    router.push(setupHref(res.data.id, 2));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="space-y-5 p-5">
        <FormError message={error} />
        <div className="space-y-1.5">
          <Label htmlFor="inv-name">Session Name *</Label>
          <Input
            id="inv-name"
            value={draft.name}
            maxLength={NAME_MAX}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. Q4 2026 Annual Count – HQ"
            aria-invalid={!!fields.name || undefined}
            aria-describedby="inv-name-error"
          />
          <div className="flex justify-between gap-2">
            <FieldError
              id="inv-name-error"
              message={fields.name}
            />
            <span className="ml-auto text-xs text-muted-foreground">{draft.name.length}/{NAME_MAX}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-description">Description</Label>
          <Textarea
            id="inv-description"
            rows={3}
            value={draft.description}
            maxLength={DESCRIPTION_MAX}
            onChange={(e) => set("description")(e.target.value)}
            placeholder="Purpose or notes for the counting team"
            aria-invalid={!!fields.description || undefined}
            aria-describedby="inv-description-error"
          />
          <div className="flex justify-between gap-2">
            <FieldError
              id="inv-description-error"
              message={fields.description}
            />
            <span className="ml-auto text-xs text-muted-foreground">{draft.description.length}/{DESCRIPTION_MAX}</span>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="inv-due">Due Date *</Label>
            <Input
              id="inv-due"
              type="date"
              min={today}
              value={draft.dueDate}
              onChange={(e) => set("dueDate")(e.target.value)}
              aria-invalid={!!fields.dueDate || undefined}
              aria-describedby="inv-due-hint"
            />
            {fields.dueDate ? (
              <FieldError
                id="inv-due-hint"
                message={fields.dueDate}
              />
            ) : (
              hint && (
                <p
                  id="inv-due-hint"
                  className={hint.overdue ? "text-xs text-t1-red-700" : "text-xs text-muted-foreground"}
                >
                  {hint.text}
                </p>
              )
            )}
          </div>
          {owners && (
            <div className="space-y-1.5">
              <Label htmlFor="inv-owner">Owner</Label>
              <Select
                value={draft.ownerUserId || NO_OWNER}
                onValueChange={(v) => set("ownerUserId")(v === NO_OWNER ? "" : v)}
              >
                <SelectTrigger id="inv-owner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_OWNER}>Me (default)</SelectItem>
                  {owners.map((o) => (
                    <SelectItem
                      key={o.id}
                      value={o.id}
                    >
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError
                id="inv-owner-error"
                message={fields.ownerUserId}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          {session ? (
            <Button
              variant="ghost"
              className="text-t1-red-700"
              onClick={onCancel}
            >
              Cancel Session
            </Button>
          ) : (
            <Link
              href={LIST}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Link>
          )}
          <Button
            disabled={sending}
            onClick={() => void next()}
          >
            {sending ? "Saving…" : "Next"}
          </Button>
        </div>
      </Card>
      <AboutPanel />
    </div>
  );
}

function AboutPanel() {
  return (
    <Card className="h-fit space-y-3 p-5 text-sm">
      <h2 className="flex items-center gap-2 font-semibold">
        <InfoIcon
          aria-hidden="true"
          className="h-4 w-4 text-primary"
        />
        About Inventory Session
      </h2>
      <p className="text-muted-foreground">A session checks the assets in its scope against what is on site.</p>
      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
        <li>It stays a Draft until you start it. Drafts can be edited or cancelled.</li>
        <li>Starting it freezes the list of expected assets.</li>
        <li>The owner follows progress and closes the session.</li>
      </ul>
    </Card>
  );
}

// ── Step 2 ──

type Picks = Omit<ScopeInput, "custodians" | "assetIds"> & { custodianKeys: string[]; assetIds: string[] };

const custodianKey = (type: CustodianType, id: string) => `${type}:${id}`;

function toPicks(scope: ScopeInput): Picks {
  return {
    locationIds: scope.locationIds,
    orgUnitIds: scope.orgUnitIds,
    categoryIds: scope.categoryIds,
    custodianKeys: scope.custodians.map((c) => custodianKey(c.type, c.id)),
    assetIds: scope.assetIds,
  };
}

function toScope(picks: Picks): ScopeInput {
  return {
    locationIds: picks.locationIds,
    orgUnitIds: picks.orgUnitIds,
    categoryIds: picks.categoryIds,
    custodians: picks.custodianKeys.map((key) => {
      const [type, ...rest] = key.split(":");
      return { type: type as CustodianType, id: rest.join(":") };
    }),
    assetIds: picks.assetIds,
  };
}

/** Core choices plus whatever the Draft already holds (an inactive Location still shows its name). */
function choices(list: { id: string; name: string | null }[], saved: { id: string; name: string }[], key = (id: string) => id): MultiOption[] {
  const seen = new Map<string, string>();
  for (const s of saved) seen.set(key(s.id), s.name);
  for (const o of list) seen.set(key(o.id), o.name ?? "Unnamed");
  return [...seen].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}

function ScopeStep({ session, options, onCancel }: {
  session: SessionDetail;
  options: AssetFilterOptions | null;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ScopeMode>(session.scopeMode);
  const [picks, setPicks] = useState<Picks>(() => toPicks(toScopeInput(session.scope)));
  // The preview answers one scope; it shows only while that scope is still on screen.
  const [result, setResult] = useState<{ key: string; preview?: ScopePreview; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<"draft" | "next" | null>(null);
  const [showAssets, setShowAssets] = useState(false);
  const [known, setKnown] = useState<Record<string, ScopeAsset>>({});
  const remember = (list: ScopeAsset[]) => setKnown((k) => ({ ...k, ...Object.fromEntries(list.map((a) => [a.id, a])) }));
  const scope = scopeForMode(mode, toScope(picks));
  const ready = scopeReady(mode, scope);
  const scopeKey = JSON.stringify([mode, scope]);
  const current = result?.key === scopeKey ? result : null;

  const custodians = options?.custodyTargets ?? [];
  const locationOptions = choices(options?.locations ?? [], session.scope.locations);
  const orgUnitOptions = choices(custodians.filter((c) => c.type === "org_unit"), session.scope.orgUnits);
  const categoryOptions = choices(options?.categories ?? [], session.scope.categories);
  const custodianOptions = choices(
    custodians.map((c) => ({ id: custodianKey(c.type, c.id), name: c.name ? `${c.name}${c.type === "org_unit" ? " (OU)" : ""}` : null })),
    session.scope.custodians.map((c) => ({ id: custodianKey(c.type, c.id), name: c.name })),
  );

  // Debounced preview on every change; a late reply for an older scope is ignored by the key check above.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(async () => {
      const res = await previewScopeAction(mode, scope);
      if (res.ok) {
        setResult({ key: scopeKey, preview: res.data });
        remember(res.data.assets.data);
      } else {
        setResult({ key: scopeKey, error: res.message });
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scopeKey covers mode and scope
  }, [scopeKey, ready]);

  async function save(then: "draft" | "next") {
    setError(null);
    setSending(then);
    const res = await updateSessionAction(session.id, session.updatedAt, { scopeMode: mode, scope });
    setSending(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.push(then === "draft" ? LIST : setupHref(session.id, 3));
  }

  const set = (key: keyof Picks) => (value: string[]) => setPicks((p) => ({ ...p, [key]: value }));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="space-y-5 p-5">
        <FormError message={error} />
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Scope Type</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ["by_scope", "By Scope", "Locations, OUs, categories and custodians"],
              ["specific_assets", "Specific Assets", "Pick assets one by one"],
            ] as const).map(([value, label, help]) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-checked:border-primary has-checked:bg-accent"
              >
                <input
                  type="radio"
                  name="scope-mode"
                  value={value}
                  checked={mode === value}
                  onChange={() => setMode(value)}
                  className="mt-1 accent-(--color-primary)"
                />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-xs text-muted-foreground">{help}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {options === null && mode === "by_scope" && (
          <FormError message="The scope choices could not be loaded. Reload to try again." />
        )}

        {mode === "by_scope" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="scope-locations">Locations *</Label>
              <MultiSelect
                id="scope-locations"
                options={locationOptions}
                value={picks.locationIds}
                onChange={set("locationIds")}
                placeholder="Choose locations"
              />
              <p className="text-xs text-muted-foreground">Required. Sub-locations are included.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scope-ous">Organization Units</Label>
              <MultiSelect
                id="scope-ous"
                options={orgUnitOptions}
                value={picks.orgUnitIds}
                onChange={set("orgUnitIds")}
                placeholder="All OUs in these locations"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scope-categories">Categories</Label>
              <MultiSelect
                id="scope-categories"
                options={categoryOptions}
                value={picks.categoryIds}
                onChange={set("categoryIds")}
                placeholder="All categories"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scope-custodians">Custodian</Label>
              <MultiSelect
                id="scope-custodians"
                options={custodianOptions}
                value={picks.custodianKeys}
                onChange={set("custodianKeys")}
                placeholder="Any custodian"
              />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">Filters combine: an asset must match every one you set.</p>
          </div>
        ) : (
          <AssetPicker
            value={picks.assetIds}
            onChange={set("assetIds")}
            known={known}
            onFound={remember}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            variant="ghost"
            className="text-t1-red-700"
            onClick={onCancel}
          >
            Cancel Session
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!!sending}
              onClick={() => router.push(setupHref(session.id, 1))}
            >
              Back
            </Button>
            <Button
              variant="outline"
              disabled={!!sending}
              onClick={() => void save("draft")}
            >
              {sending === "draft" ? "Saving…" : "Save as Draft"}
            </Button>
            <Button
              disabled={!!sending || !ready}
              onClick={() => void save("next")}
            >
              {sending === "next" ? "Saving…" : "Next"}
            </Button>
          </div>
        </div>
      </Card>

      <PreviewPanel
        ready={ready}
        mode={mode}
        preview={current?.preview ?? null}
        error={current?.error ?? null}
        onViewAssets={() => setShowAssets(true)}
      />
      <AssetsDialog
        open={showAssets}
        onOpenChange={setShowAssets}
        mode={mode}
        scope={scope}
        total={current?.preview?.total ?? 0}
      />
    </div>
  );
}

function AssetPicker({ value, onChange, known, onFound }: {
  value: string[];
  onChange: (next: string[]) => void;
  known: Record<string, ScopeAsset>;
  onFound: (assets: ScopeAsset[]) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ScopeAsset[] | null>(null);
  const [searching, setSearching] = useState(false);
  const chosen = new Set(value);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setSearching(true);
    const found = await searchAssetsAction(q);
    setSearching(false);
    setResults(found);
    onFound(found ?? []);
  }

  return (
    <div className="space-y-3">
      <form
        role="search"
        onSubmit={(e) => void search(e)}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search assets"
            placeholder="Search by name, tag or serial number"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          disabled={searching}
        >
          Search
        </Button>
      </form>
      {results === null && searching === false && q && <p className="text-xs text-muted-foreground">Press Search to find assets.</p>}
      {results && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {results.map((a) => (
            <li key={a.id}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 text-sm hover:bg-muted">
                <Checkbox
                  checked={chosen.has(a.id)}
                  onCheckedChange={(on) => onChange(on === true ? [...value, a.id] : value.filter((id) => id !== a.id))}
                />
                <span className="min-w-0 flex-1 truncate">{a.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{a.assetTag}</span>
              </label>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-3 text-sm text-muted-foreground">No assets match.</li>}
        </ul>
      )}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Selected ({value.length})</p>
        {value.length === 0 ? (
          <p className="text-xs text-t1-red-700">Select at least one asset.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {value.map((id) => (
              <li
                key={id}
                className="flex items-center gap-1 rounded-full bg-muted py-1 pl-3 pr-1 text-xs"
              >
                {known[id]?.name ?? "Selected asset"}
                <button
                  type="button"
                  aria-label={`Remove ${known[id]?.name ?? "asset"}`}
                  onClick={() => onChange(value.filter((x) => x !== id))}
                  className="rounded-full p-1 hover:bg-card"
                >
                  <XIcon
                    aria-hidden="true"
                    className="h-3 w-3"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: { id: string; name: string; count: number }[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground">{title}</h3>
      <ul className="space-y-1 text-sm">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex justify-between gap-2"
          >
            <span className="truncate">{r.name}</span>
            <span className="tabular-nums text-muted-foreground">{r.count.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewPanel({ ready, mode, preview, error, onViewAssets }: {
  ready: boolean;
  mode: ScopeMode;
  preview: ScopePreview | null;
  error: string | null;
  onViewAssets: () => void;
}) {
  return (
    <Card
      className="h-fit space-y-4 p-5"
      aria-live="polite"
    >
      <h2 className="font-semibold">Expected Assets Preview</h2>
      {!ready ? (
        <p className="text-sm text-muted-foreground">
          {mode === "by_scope" ? "Choose at least one location to see the assets in scope." : "Select assets to see them here."}
        </p>
      ) : error ? (
        <FormError message={error} />
      ) : !preview ? (
        <p className="text-sm text-muted-foreground">Counting assets…</p>
      ) : (
        <>
          <p>
            <span className="text-3xl font-semibold tabular-nums">{preview.total.toLocaleString()}</span>
            <span className="ml-2 text-sm text-muted-foreground">{preview.total === 1 ? "asset" : "assets"}</span>
          </p>
          {preview.total === 0 && <p className="text-sm text-t1-amber-700">No assets match this scope. Change the filters before you start.</p>}
          <Breakdown
            title="By Location"
            rows={preview.byLocation}
          />
          <Breakdown
            title="By Category"
            rows={preview.byCategory}
          />
          {preview.total > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onViewAssets}
            >
              View Assets
            </Button>
          )}
        </>
      )}
      <p className="text-xs text-muted-foreground">The list is frozen when the session starts.</p>
    </Card>
  );
}

function AssetsDialog({ open, onOpenChange, mode, scope, total }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ScopeMode;
  scope: ScopeInput;
  total: number;
}) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ key: string; data?: ScopePreview["assets"]; error?: string } | null>(null);
  const key = JSON.stringify([mode, scope, page]);
  const current = result?.key === key ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? null;

  useEffect(() => {
    if (!open) return;
    let live = true;
    void previewScopeAction(mode, scope, page, 20).then((res) => {
      if (live) setResult(res.ok ? { key, data: res.data.assets } : { key, error: res.message });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key covers mode, scope and page
  }, [open, key]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setPage(1);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Expected Assets ({total.toLocaleString()})</DialogTitle>
          <DialogDescription>Assets that match the scope right now.</DialogDescription>
        </DialogHeader>
        <FormError message={error} />
        {!data && !error && <p className="text-sm text-muted-foreground">Loading…</p>}
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Asset</th>
                  <th className="py-2 pr-3 font-semibold">Tag</th>
                  <th className="py-2 pr-3 font-semibold">Category</th>
                  <th className="py-2 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-3">{a.name}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{a.assetTag}</td>
                    <td className="py-2 pr-3">{a.category?.name ?? "—"}</td>
                    <td className="py-2">{a.location?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.totalPages > 1 && (
          <DialogFooter className="items-center gap-2 sm:justify-between sm:space-x-0">
            <span className="text-xs text-muted-foreground">Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Step 3 (I2) ──

function ReviewPlaceholder({ session }: { session: SessionDetail }) {
  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-semibold">Review &amp; Start is not available yet</h2>
      <p className="text-sm text-muted-foreground">Your draft and its scope are saved. You can start the session when this step is released.</p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={setupHref(session.id, 2)}
          className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-muted"
        >
          Back to Scope
        </Link>
        <Link
          href={LIST}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Go to Inventory
        </Link>
      </div>
    </Card>
  );
}

// ── Cancel ──

function CancelSessionDialog({ session, open, onOpenChange }: {
  session: SessionDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const empty = reason.trim() === "";

  async function confirm() {
    setTouched(true);
    if (empty) return;
    setSending(true);
    const res = await cancelSessionAction(session.id, reason.trim());
    setSending(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    onOpenChange(false);
    router.push(LIST);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!sending) onOpenChange(o);
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-xl"
        aria-busy={sending}
      >
        <DialogHeader>
          <DialogTitle className="break-words pr-6 leading-snug">Cancel {session.name}?</DialogTitle>
          <DialogDescription>The session stays in the list as Cancelled and can no longer be edited or started.</DialogDescription>
        </DialogHeader>
        <FormError message={error} />
        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason">Reason *</Label>
          <Textarea
            id="cancel-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={(touched && empty) || undefined}
            aria-describedby="cancel-reason-error"
          />
          <FieldError
            id="cancel-reason-error"
            message={touched && empty ? "Enter a reason." : undefined}
          />
        </div>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button
            variant="outline"
            disabled={sending}
            onClick={() => onOpenChange(false)}
          >
            Keep Session
          </Button>
          <Button
            variant="destructive"
            disabled={sending}
            onClick={() => void confirm()}
          >
            {sending ? "Cancelling…" : "Cancel Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
