"use client";

// Start Inventory wizard (UC-007 · PO 05 §4.9 · FigJam Step 1 / Step 2). Step 1 Next creates the Draft (or saves its
// changes); step 2 edits the scope with a live preview; Save as Draft keeps it for later; step 3 reviews and starts.
// The step lives in the URL (`?step=`), so a reload or a Draft link from the list resumes in place.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { WizardSteps } from "@/components/ui/WizardSteps";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BoxIcon,
  BuildingIcon,
  CategoryIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  FileIcon,
  GridIcon,
  InfoIcon,
  ListIcon,
  LocationIcon,
  SearchIcon,
  ShareNodesIcon,
  UserIcon,
  WarningTriangleIcon,
  XIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
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
  addDays,
} from "../../domain/inventory";
import {
  createSessionAction,
  previewScopeAction,
  searchAssetsAction,
  updateSessionAction,
  type ScopeAsset,
  type ScopePreview,
} from "../../services/asset-inventory-actions";
import type { AssetFilterOptions } from "../../services/assets-list-types";
import { MultiSelect, type MultiOption } from "./MultiSelect";
import { CancelSessionDialog, FieldError, FormError } from "./parts";
import { AssetsDialog, CategoryBreakdown, CHART, SHOWN, share, topRows } from "./scope-parts";
import { ReviewStep, type ReviewData } from "./ReviewStep";

const STEPS = ["Session Setup", "Define Scope", "Review & Start"];
const DESCRIPTIONS = ["Basic information", "Select which assets to include", "Confirm and begin"];
const LIST = "/asset-workspace/inventory";
const NO_OWNER = "none";

export interface WizardProps {
  session: SessionDetail | null;
  step: 1 | 2 | 3;
  /** `null` = the caller is not an Asset Admin or the fetch failed: the Owner field is hidden. */
  owners: Person[] | null;
  options: AssetFilterOptions | null;
  today: string;
  /** Step 3 data, fetched by the server page. */
  review?: ReviewData;
  /** `?location=` from a Location's Start Inventory: added to an empty scope in step 2. */
  prefillLocation?: string;
  /** Settings › Inventory Defaults (05 §4.12.3): what a new Draft starts with. `null` = none (not an Asset Admin, or the read failed). */
  defaults?: { dueDays: number; categoryIds: string[] } | null;
}

export function InventoryWizard({ session, step, owners, options, today, review, prefillLocation, defaults }: WizardProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link
          href={LIST}
          className="hover:text-foreground hover:underline"
        >
          Inventory
        </Link>
        <ChevronRightIcon
          aria-hidden="true"
          className="h-3 w-3"
        />
        <span
          aria-current="page"
          className="font-medium text-foreground"
        >
          Start Inventory Session
        </span>
      </nav>
      <PageHeader
        title="Start Inventory Session"
        subtitle="Create a new inventory session to verify assets in your organization."
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
          prefillLocation={prefillLocation}
          defaultDueDays={defaults?.dueDays}
          onCancel={() => setCancelOpen(true)}
        />
      )}
      {step === 2 && session && (
        <ScopeStep
          session={session}
          options={options}
          prefillLocation={prefillLocation}
          defaultCategoryIds={defaults?.categoryIds}
          onCancel={() => setCancelOpen(true)}
        />
      )}
      {step === 3 && session && review && (
        <ReviewStep
          session={session}
          review={review}
          today={today}
          onCancel={() => setCancelOpen(true)}
        />
      )}
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

// ── Step 1 ──

function SetupStep({ session, owners, today, prefillLocation, defaultDueDays, onCancel }: {
  session: SessionDetail | null;
  owners: Person[] | null;
  today: string;
  prefillLocation?: string;
  /** Only a brand-new Draft starts from it; an existing Draft keeps its own date. */
  defaultDueDays?: number;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<SetupDraft>({
    name: session?.name ?? "",
    description: session?.description ?? "",
    dueDate: session?.dueDate ?? (defaultDueDays ? addDays(today, defaultDueDays) : ""),
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
    router.push(`${setupHref(res.data.id, 2)}${prefillLocation ? `&location=${encodeURIComponent(prefillLocation)}` : ""}`);
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

function ScopeStep({ session, options, prefillLocation, defaultCategoryIds, onCancel }: {
  session: SessionDetail;
  options: AssetFilterOptions | null;
  prefillLocation?: string;
  /** Settings default; only an empty scope takes it, and only categories the picker offers. */
  defaultCategoryIds?: string[];
  onCancel: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ScopeMode>(session.scopeMode);
  const [picks, setPicks] = useState<Picks>(() => {
    const saved = toPicks(toScopeInput(session.scope));
    // A Location's Start Inventory: only an empty scope takes the prefill, so a saved choice is never overwritten.
    const empty = saved.locationIds.length === 0 && saved.assetIds.length === 0;
    const offered = new Set((options?.categories ?? []).map((c) => c.id));
    const categoryIds = empty && saved.categoryIds.length === 0 ? (defaultCategoryIds ?? []).filter((id) => offered.has(id)) : saved.categoryIds;
    return { ...saved, categoryIds, ...(prefillLocation && empty ? { locationIds: [prefillLocation] } : {}) };
  });
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

  const fieldIcon = "h-4 w-4";
  const fieldLabel = (icon: ReactNode, text: string, htmlFor: string, required = false) => (
    <Label
      htmlFor={htmlFor}
      className="flex items-center gap-2 text-sm font-semibold"
    >
      <span
        aria-hidden="true"
        className="text-muted-foreground"
      >
        {icon}
      </span>
      {text}
      {required && <span className="text-t1-red-700">*</span>}
    </Label>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <Card className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Define Scope</h2>
              <p className="text-sm text-muted-foreground">Choose which assets to count in this session.</p>
            </div>
            <p className="flex max-w-sm items-start gap-3 rounded-lg bg-accent px-4 py-3 text-sm text-muted-foreground">
              <InfoIcon
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              />
              The expected assets are built from the scope you choose. They are frozen as a snapshot when the session starts.
            </p>
          </div>
          <FormError message={error} />
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Scope type</legend>
            {([
              ["by_scope", "By Scope", "Choose by location, unit, category or custodian", <GridIcon key="i" className="h-5 w-5" />, true],
              ["specific_assets", "Specific Assets", "Pick assets one by one", <ListIcon key="i" className="h-5 w-5" />, false],
            ] as const).map(([value, label, help, icon, recommended]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 hover:bg-muted has-checked:border-primary has-checked:bg-accent has-checked:ring-1 has-checked:ring-primary has-focus-visible:ring-2 has-focus-visible:ring-ring"
              >
                <input
                  type="radio"
                  name="scope-mode"
                  value={value}
                  checked={mode === value}
                  onChange={() => setMode(value)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${mode === value ? "text-primary" : "text-muted-foreground"}`}
                >
                  {icon}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${mode === value ? "text-primary" : ""}`}>
                    {label}
                    {recommended && <span className="ml-1.5 font-normal">(Recommended)</span>}
                  </span>
                  <span className="block text-xs text-muted-foreground">{help}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {options === null && mode === "by_scope" && (
            <FormError message="The scope choices could not be loaded. Reload to try again." />
          )}

          {mode === "by_scope" ? (
            <div className="space-y-5">
              <div className="space-y-2">
                {fieldLabel(<LocationIcon className={fieldIcon} />, "Locations", "scope-locations", true)}
                <MultiSelect
                  id="scope-locations"
                  options={locationOptions}
                  value={picks.locationIds}
                  onChange={set("locationIds")}
                  placeholder="Choose locations"
                  icon={<BuildingIcon className={fieldIcon} />}
                />
                <p className="text-xs text-muted-foreground">Choose one or more locations to count. Sub-locations are included.</p>
              </div>
              <div className="space-y-2">
                {fieldLabel(<ShareNodesIcon className={fieldIcon} />, "Organization Units", "scope-ous")}
                <MultiSelect
                  id="scope-ous"
                  options={orgUnitOptions}
                  value={picks.orgUnitIds}
                  onChange={set("orgUnitIds")}
                  placeholder="All OUs"
                  icon={<ShareNodesIcon className={fieldIcon} />}
                />
                <p className="text-xs text-muted-foreground">Leave empty to include every OU in the chosen locations.</p>
              </div>
              <div className="space-y-2">
                {fieldLabel(<CategoryIcon className={fieldIcon} />, "Asset Categories", "scope-categories")}
                <MultiSelect
                  id="scope-categories"
                  options={categoryOptions}
                  value={picks.categoryIds}
                  onChange={set("categoryIds")}
                  placeholder="All categories"
                  icon={<CategoryIcon className={fieldIcon} />}
                />
                <p className="text-xs text-muted-foreground">Leave empty to include every category.</p>
              </div>
              <div className="space-y-2">
                {fieldLabel(<UserIcon className={fieldIcon} />, "Custodian (Person / OU)", "scope-custodians")}
                <MultiSelect
                  id="scope-custodians"
                  options={custodianOptions}
                  value={picks.custodianKeys}
                  onChange={set("custodianKeys")}
                  placeholder="All custodians"
                  icon={<UserIcon className={fieldIcon} />}
                />
                <p className="text-xs text-muted-foreground">Leave empty to include every custodian. An asset must match every filter you set.</p>
              </div>
            </div>
          ) : (
            <AssetPicker
              value={picks.assetIds}
              onChange={set("assetIds")}
              known={known}
              onFound={remember}
            />
          )}
        </Card>

        <PreviewPanel
          ready={ready}
          mode={mode}
          preview={current?.preview ?? null}
          error={current?.error ?? null}
          onViewAssets={() => setShowAssets(true)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={!!sending}
            onClick={() => router.push(setupHref(session.id, 1))}
          >
            <ArrowLeftIcon
              aria-hidden="true"
              className="mr-2 h-4 w-4"
            />
            Back
          </Button>
          <Button
            variant="ghost"
            className="text-t1-red-700"
            onClick={onCancel}
          >
            Cancel Session
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!!sending}
            onClick={() => void save("draft")}
          >
            <FileIcon
              aria-hidden="true"
              className="mr-2 h-4 w-4"
            />
            {sending === "draft" ? "Saving…" : "Save as Draft"}
          </Button>
          <Button
            disabled={!!sending || !ready}
            onClick={() => void save("next")}
          >
            {sending === "next" ? "Saving…" : "Next: Review & Start"}
            <ArrowRightIcon
              aria-hidden="true"
              className="ml-2 h-4 w-4"
            />
          </Button>
        </div>
      </div>

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

function PreviewPanel({ ready, mode, preview, error, onViewAssets }: {
  ready: boolean;
  mode: ScopeMode;
  preview: ScopePreview | null;
  error: string | null;
  onViewAssets: () => void;
}) {
  const total = preview?.total ?? 0;
  const places = preview ? topRows(preview.byLocation, SHOWN) : [];

  return (
    <Card
      className="h-fit space-y-5 p-5"
      aria-live="polite"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <BoxIcon
          aria-hidden="true"
          className="h-5 w-5 text-primary"
        />
        Expected Assets (Preview)
      </h2>
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary"
              >
                <BoxIcon className="h-6 w-6" />
              </span>
              <p>
                <span className="block text-3xl font-semibold tabular-nums">{total.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">{total === 1 ? "asset" : "assets"} in this scope</span>
              </p>
            </div>
            {total > 0 && (
              <Button
                variant="outline"
                onClick={onViewAssets}
              >
                View Assets
                <ArrowRightIcon
                  aria-hidden="true"
                  className="ml-2 h-4 w-4"
                />
              </Button>
            )}
          </div>

          {total > 0 && (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Breakdown by Location</h3>
                <div className="flex flex-wrap items-center gap-5">
                  <div className="relative shrink-0">
                    <DonutChart
                      segments={places.map((r, i) => ({ label: r.name, value: r.count, color: CHART[i % CHART.length] }))}
                      size={124}
                      strokeWidth={22}
                      seamless
                      className="relative z-10"
                    />
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold tabular-nums">{total.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">assets</span>
                    </div>
                  </div>
                  <ul className="min-w-44 flex-1 space-y-1.5">
                    {places.map((r, i) => (
                      <li
                        key={r.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: CHART[i % CHART.length] }}
                        />
                        <span className="min-w-0 flex-1 truncate">{r.name}</span>
                        <span className="w-10 text-right font-semibold tabular-nums">{r.count.toLocaleString()}</span>
                        <span className="w-12 text-right tabular-nums text-muted-foreground">{share(r.count, total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <CategoryBreakdown
                rows={preview.byCategory}
                total={total}
              />
            </>
          )}

          {total === 0 ? (
            <p className="flex items-start gap-3 rounded-xl bg-warning-muted p-4 text-sm">
              <WarningTriangleIcon
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-t1-amber-700"
              />
              No assets match this scope. Change the filters before you start.
            </p>
          ) : (
            <p className="flex items-start gap-3 rounded-xl bg-success-muted p-4 text-sm">
              <CheckCircleIcon
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-success"
              />
              <span>
                <span className="block font-semibold">Scope is ready</span>
                <span className="text-muted-foreground">
                  {total.toLocaleString()} expected {total === 1 ? "asset matches" : "assets match"} your selection. Continue to
                  review who will check them and start the session.
                </span>
              </span>
            </p>
          )}
        </>
      )}
      <p className="text-xs text-muted-foreground">The list is frozen when the session starts.</p>
    </Card>
  );
}
