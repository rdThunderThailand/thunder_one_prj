"use client";

// Start Inventory step 3 Review & Start (UC-007 · PO 05 §4.9 · checklist §1 I2). Shows the Draft as Start will freeze it:
// setup, scope, who verifies what (Reassign moves a whole group before Start) and the expected assets.
// Start Inventory hands over to the session Overview. Nothing is sent to the assignees yet (D13), so the steps listed
// here are only what Start really does. Not shown (PO 05, checklist §5): Priority, Reference, Asset Status and
// Acquisition Date.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BoxIcon,
  BuildingIcon,
  CategoryIcon,
  CheckCircleIcon,
  EditIcon,
  FileIcon,
  LocationIcon,
  PlayIcon,
  SearchIcon,
  ShareNodesIcon,
  UserIcon,
  WarningTriangleIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { Input } from "@/components/ui/lovable/input";
import { detailHref, dueHint, REASON_LABEL, type AssignmentGroup, type Assignments, type SessionDetail } from "../../domain/inventory";
import {
  reassignAction,
  searchPeopleAction,
  startSessionAction,
  type PersonChoice,
  type ScopePreview,
} from "../../services/asset-inventory-actions";
import { Avatar, FormError } from "./parts";
import { AssetsDialog, CategoryBreakdown, CHART, share, topRows } from "./scope-parts";

const LIST = "/asset-workspace/inventory";
const setupHref = (id: string, step: number) => `${LIST}/${id}/setup?step=${step}`;
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export interface ReviewData {
  /** `null` = the fetch failed. */
  assignments: Assignments | null;
  preview: { ok: true; data: ScopePreview } | { ok: false; message: string };
}

export function ReviewStep({ session, review, today, onCancel }: {
  session: SessionDetail;
  review: ReviewData;
  today: string;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [moving, setMoving] = useState<AssignmentGroup | null>(null);
  const [showAssets, setShowAssets] = useState(false);
  const preview = review.preview.ok ? review.preview.data : null;
  const total = preview?.total ?? 0;
  const groups = review.assignments?.data ?? [];

  async function start() {
    setError(null);
    setStarting(true);
    const res = await startSessionAction(session.id, session.updatedAt);
    if (!res.ok) {
      setStarting(false);
      setError(res.message);
      return;
    }
    router.push(detailHref(session.id));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <Card className="min-w-0 space-y-6 p-6">
          <FormError message={error} />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Review &amp; Confirm</h2>
              <p className="text-sm text-muted-foreground">
                Please review the session details, expected assets and verification assignments before starting.
              </p>
            </div>
            <Link
              href={setupHref(session.id, 1)}
              className={buttonClasses("secondary")}
            >
              <EditIcon
                aria-hidden="true"
                className="mr-2 h-4 w-4"
              />
              Edit
            </Link>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <SessionCard
              session={session}
              today={today}
            />
            <ScopeCard session={session} />
          </div>
          <AssignmentsSection
            assignments={review.assignments}
            onMove={setMoving}
          />
        </Card>

        <Card
          className="h-fit space-y-5 p-5"
          aria-live="polite"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <BoxIcon
              aria-hidden="true"
              className="h-5 w-5 text-primary"
            />
            Expected Assets
          </h2>
          {!preview ? (
            <FormError message={review.preview.ok ? null : review.preview.message} />
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
                    <span className="text-sm text-muted-foreground">Total Expected Assets</span>
                  </p>
                </div>
                {total > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAssets(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    View Assets
                    <ArrowRightIcon
                      aria-hidden="true"
                      className="h-4 w-4"
                    />
                  </button>
                )}
              </div>
              {total > 0 && (
                <>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {topRows(preview.byLocation, 3).map((r, i) => (
                      <li
                        key={r.id}
                        className="space-y-2 rounded-xl border border-border p-3 only:sm:col-span-2"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"
                          >
                            <BuildingIcon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1 text-sm">
                            <span className="block truncate font-medium">{r.name}</span>
                            <span className="text-muted-foreground">{r.count.toLocaleString()} assets</span>
                          </span>
                          <span className="text-sm font-semibold tabular-nums">{share(r.count, total)}</span>
                        </div>
                        <span
                          aria-hidden="true"
                          className="block h-1.5 overflow-hidden rounded-full bg-muted"
                        >
                          <span
                            className="block h-full rounded-full"
                            style={{ width: share(r.count, total), backgroundColor: CHART[i % CHART.length] }}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
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
                  No assets match this scope. Go back and change it before you start.
                </p>
              ) : (
                <div className="space-y-3 rounded-xl bg-success-muted p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-success"
                    />
                    <div>
                      <p className="font-semibold">Ready to Start</p>
                      <p className="text-muted-foreground">
                        Start freezes the expected asset list from your scope and the asset master as it is now.
                      </p>
                    </div>
                  </div>
                  <ol className="space-y-2">
                    {[
                      `Freeze the expected asset list (${total.toLocaleString()} ${total === 1 ? "asset" : "assets"})`,
                      `Create verification assignments (${groups.length} ${groups.length === 1 ? "assignee" : "assignees"})`,
                      "Change the session status to In Progress",
                    ].map((text, i) => (
                      <li
                        key={text}
                        className="flex items-center gap-3"
                      >
                        <span
                          aria-hidden="true"
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary"
                        >
                          {i + 1}
                        </span>
                        {text}
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs text-muted-foreground">Assignees are not notified yet.</p>
                </div>
              )}
            </>
          )}
          <p className="text-xs text-muted-foreground">Assets added after Start are not counted in this session.</p>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-center lg:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={starting}
            onClick={() => router.push(setupHref(session.id, 2))}
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
            disabled={starting}
            onClick={onCancel}
          >
            Cancel Session
          </Button>
        </div>
        <div className="flex gap-2">
          <Link
            href={LIST}
            className={`${buttonClasses("secondary")} shrink-0`}
          >
            <FileIcon
              aria-hidden="true"
              className="mr-2 h-4 w-4"
            />
            Save as Draft
          </Link>
          <Button
            className="h-auto flex-1 justify-start py-2"
            disabled={starting || !total}
            onClick={() => void start()}
          >
            <PlayIcon
              aria-hidden="true"
              className="mr-3 h-4 w-4"
            />
            <span className="flex flex-col items-start leading-tight">
              <span>{starting ? "Starting…" : "Start Inventory"}</span>
              <span className="text-xs font-normal opacity-90">Freeze the list and assign verifiers</span>
            </span>
          </Button>
        </div>
      </div>

      <ReassignDialog
        session={session}
        group={moving}
        onClose={() => setMoving(null)}
      />
      <AssetsDialog
        open={showAssets}
        onOpenChange={setShowAssets}
        mode={session.scopeMode}
        scope={{
          locationIds: session.scope.locations.map((l) => l.id),
          orgUnitIds: session.scope.orgUnits.map((u) => u.id),
          categoryIds: session.scope.categories.map((c) => c.id),
          custodians: session.scope.custodians.map(({ type, id }) => ({ type, id })),
          assetIds: session.scope.assetIds,
        }}
        total={total}
      />
    </div>
  );
}

function SubCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-4 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 text-sm">
      <dt className="flex items-center gap-2 text-muted-foreground">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function SessionCard({ session, today }: { session: SessionDetail; today: string }) {
  const hint = dueHint(session.dueDate, today);
  return (
    <SubCard title="Session Information">
      <dl className="space-y-3">
        <Row label="Session Name">{session.name}</Row>
        <Row label="Description">{session.description || "—"}</Row>
        <Row label="Due Date">
          {session.dueDate ? dateFmt.format(new Date(session.dueDate)) : "—"}
          {hint && <span className={`ml-2 text-t1-red-700`}>({hint.text})</span>}
        </Row>
        <Row label="Owner">
          {session.owner ? (
            <span className="flex items-center gap-2">
              <Avatar name={session.owner.name} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{session.owner.name}</span>
                <span className="text-xs text-muted-foreground">Asset Admin</span>
              </span>
            </span>
          ) : (
            "—"
          )}
        </Row>
      </dl>
    </SubCard>
  );
}

function ScopeCard({ session }: { session: SessionDetail }) {
  const names = (list: { name: string }[], none: string) => (list.length ? list.map((x) => x.name).join(", ") : none);
  const { scope } = session;
  const icon = "h-4 w-4";
  return (
    <SubCard
      title="Scope Summary"
      action={
        <Link
          href={setupHref(session.id, 2)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
        >
          <EditIcon
            aria-hidden="true"
            className="h-3.5 w-3.5"
          />
          Edit
        </Link>
      }
    >
      {session.scopeMode === "specific_assets" ? (
        <dl className="space-y-3">
          <Row
            label="Scope Type"
            icon={<LocationIcon className={icon} />}
          >
            Specific Assets
          </Row>
          <Row
            label="Assets"
            icon={<BoxIcon className={icon} />}
          >
            {scope.assetIds.length.toLocaleString()} selected
          </Row>
        </dl>
      ) : (
        <dl className="space-y-3">
          <Row
            label="Locations"
            icon={<LocationIcon className={icon} />}
          >
            {names(scope.locations, "—")} (with sub-locations)
          </Row>
          <Row
            label="Organization Units"
            icon={<ShareNodesIcon className={icon} />}
          >
            {names(scope.orgUnits, "All OUs")}
          </Row>
          <Row
            label="Categories"
            icon={<CategoryIcon className={icon} />}
          >
            {names(scope.categories, "All categories")}
          </Row>
          <Row
            label="Custodian"
            icon={<UserIcon className={icon} />}
          >
            {names(scope.custodians, "All custodians")}
          </Row>
        </dl>
      )}
    </SubCard>
  );
}

function AssignmentsSection({ assignments, onMove }: { assignments: Assignments | null; onMove: (group: AssignmentGroup) => void }) {
  const groups = assignments?.data ?? [];
  const sum = groups.reduce((n, g) => n + g.expectedAssets, 0);
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-semibold">Verification Assignments{assignments ? ` (${groups.length})` : ""}</h3>
        <p className="text-sm text-muted-foreground">
          Each asset goes to its custodian, the manager of its OU, or the session owner. Reassign moves a whole group.
        </p>
      </div>
      {!assignments ? (
        <FormError message="The assignments could not be loaded. Reload to try again." />
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No assets in scope, so nobody is assigned.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-2 py-2.5 font-medium">Assignee</th>
                <th className="px-2 py-2.5 font-medium">Type</th>
                <th className="px-2 py-2.5 font-medium">Scope</th>
                <th className="px-2 py-2.5 text-center font-medium">Expected Assets</th>
                <th className="px-2 py-2.5 font-medium">Notification</th>
                <th className="px-2 py-2.5 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr
                  key={g.assignee.id}
                  className="border-t border-border"
                >
                  <td className="px-2 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={g.assignee.name} />
                      <span className="font-medium">{g.assignee.name}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground">{g.reasons.map((r) => REASON_LABEL[r] ?? r).join(", ")}</td>
                  <td className="px-2 py-2.5">{g.scopeLabel || "—"}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{g.expectedAssets.toLocaleString()}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">Not sent yet</td>
                  <td className="px-2 py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Reassign ${g.assignee.name}`}
                      onClick={() => onMove(g)}
                    >
                      Reassign
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-accent font-medium">
                <td className="px-2 py-2.5">Total</td>
                <td className="px-2 py-2.5 text-muted-foreground">
                  {groups.length} {groups.length === 1 ? "assignee" : "assignees"}
                </td>
                <td />
                <td className="px-2 py-2.5 text-center tabular-nums">{sum.toLocaleString()}</td>
                <td className="px-2 py-2.5 text-muted-foreground">—</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

/** Pick an active member for a group; Core checks the member and saves the move. */
function ReassignDialog({ session, group, onClose }: { session: SessionDetail; group: AssignmentGroup | null; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<{ key: string; people?: PersonChoice[]; error?: string } | null>(null);
  const [chosen, setChosen] = useState<PersonChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const term = q.trim();
  const current = result?.key === term ? result : null;
  const open = group !== null;

  useEffect(() => {
    if (!open || term.length < 2) return;
    let live = true;
    const t = setTimeout(async () => {
      const people = await searchPeopleAction(term);
      if (live) setResult(people ? { key: term, people } : { key: term, error: "People could not be loaded. Try again." });
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [open, term]);

  function close() {
    if (saving) return;
    setQ("");
    setChosen(null);
    setError(null);
    onClose();
  }

  async function save() {
    if (!group || !chosen) return;
    setError(null);
    setSaving(true);
    const res = await reassignAction(session.id, session.updatedAt, [{ fromUserId: group.assignee.id, toUserId: chosen.id }]);
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    // The page re-renders with the new assignments and remounts the wizard.
    close();
  }

  const people = (current?.people ?? []).filter((p) => p.id !== group?.assignee.id);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-xl"
        aria-busy={saving}
      >
        <DialogHeader>
          <DialogTitle className="break-words pr-6 leading-snug">Reassign {group?.assignee.name}</DialogTitle>
          <DialogDescription>
            All {group?.expectedAssets.toLocaleString()} assets in this group go to the person you choose.
          </DialogDescription>
        </DialogHeader>
        <FormError message={error ?? current?.error ?? null} />
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search people"
            placeholder="Search by name or employee code"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setChosen(null);
            }}
            className="pl-9"
          />
        </div>
        {term.length < 2 ? (
          <p className="text-sm text-muted-foreground">Type at least 2 characters.</p>
        ) : !current ? (
          <p className="text-sm text-muted-foreground">Searching…</p>
        ) : current.people && people.length === 0 ? (
          <p className="text-sm text-muted-foreground">No people match.</p>
        ) : (
          <ul
            role="listbox"
            aria-label="People"
            className="max-h-64 space-y-1 overflow-y-auto"
          >
            {people.map((p) => (
              <li
                key={p.id}
                role="option"
                aria-selected={chosen?.id === p.id}
              >
                <button
                  type="button"
                  onClick={() => setChosen(p)}
                  className={`flex w-full flex-col rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${chosen?.id === p.id ? "bg-accent" : ""}`}
                >
                  <span className="font-medium">{p.name}</span>
                  {p.detail && <span className="text-xs text-muted-foreground">{p.detail}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button
            variant="outline"
            disabled={saving}
            onClick={close}
          >
            Keep Assignment
          </Button>
          <Button
            disabled={saving || !chosen}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : chosen ? `Move to ${chosen.name}` : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
