"use client";

// Start Inventory step 3 Review & Start (UC-007 · PO 05 §4.9 · checklist §1 I2). Shows the Draft as Start will freeze it:
// setup, scope, who verifies what (Edit Assignments moves a whole group before Start) and the expected assets.
// Start Inventory hands over to the session Overview. Nothing is sent to the assignees yet (D13).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";
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
import { Breakdown, FormError } from "./parts";

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
  const total = review.preview.ok ? review.preview.data.total : null;

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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-4">
        <FormError message={error} />
        <SessionCard
          session={session}
          today={today}
        />
        <ScopeCard session={session} />
        <AssignmentsCard
          assignments={review.assignments}
          onMove={setMoving}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="ghost"
            className="text-t1-red-700"
            disabled={starting}
            onClick={onCancel}
          >
            Cancel Session
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={starting}
              onClick={() => router.push(setupHref(session.id, 2))}
            >
              Back
            </Button>
            <Link
              href={LIST}
              className={buttonClasses("secondary")}
            >
              Save as Draft
            </Link>
            <Button
              disabled={starting || !total}
              onClick={() => void start()}
            >
              {starting ? "Starting…" : "Start Inventory"}
            </Button>
          </div>
        </div>
      </div>

      <Card
        className="h-fit space-y-4 p-5"
        aria-live="polite"
      >
        <h2 className="font-semibold">Expected Assets</h2>
        {!review.preview.ok ? (
          <FormError message={review.preview.message} />
        ) : (
          <>
            <p>
              <span className="text-3xl font-semibold tabular-nums">{review.preview.data.total.toLocaleString()}</span>
              <span className="ml-2 text-sm text-muted-foreground">{review.preview.data.total === 1 ? "asset" : "assets"}</span>
            </p>
            {review.preview.data.total === 0 && (
              <p className="text-sm text-t1-amber-700">No assets match this scope. Go back and change it before you start.</p>
            )}
            <Breakdown
              title="By Location"
              rows={review.preview.data.byLocation}
            />
            <Breakdown
              title="By Category"
              rows={review.preview.data.byCategory}
            />
          </>
        )}
        <p className="text-xs text-muted-foreground">Start freezes this list. Assets added later are not counted.</p>
      </Card>

      <ReassignDialog
        session={session}
        group={moving}
        onClose={() => setMoving(null)}
      />
    </div>
  );
}

function CardHeading({ title, editStep, sessionId }: { title: string; editStep: number; sessionId: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="font-semibold">{title}</h2>
      <Link
        href={setupHref(sessionId, editStep)}
        className="text-sm font-semibold text-primary hover:underline"
      >
        Edit
      </Link>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

function SessionCard({ session, today }: { session: SessionDetail; today: string }) {
  const hint = dueHint(session.dueDate, today);
  return (
    <Card className="space-y-3 p-5">
      <CardHeading
        title="Session Information"
        editStep={1}
        sessionId={session.id}
      />
      <dl className="grid gap-3 sm:grid-cols-2">
        <Field label="Session Name">{session.name}</Field>
        <Field label="Owner">{session.owner?.name ?? "—"}</Field>
        <Field label="Due Date">
          {session.dueDate ? dateFmt.format(new Date(session.dueDate)) : "—"}
          {hint && <span className={`ml-2 text-xs ${hint.overdue ? "text-t1-red-700" : "text-muted-foreground"}`}>{hint.text}</span>}
        </Field>
        <Field label="Description">{session.description || "—"}</Field>
      </dl>
    </Card>
  );
}

function ScopeCard({ session }: { session: SessionDetail }) {
  const names = (list: { name: string }[], none: string) => (list.length ? list.map((x) => x.name).join(", ") : none);
  const { scope } = session;
  return (
    <Card className="space-y-3 p-5">
      <CardHeading
        title="Scope Summary"
        editStep={2}
        sessionId={session.id}
      />
      {session.scopeMode === "specific_assets" ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="Scope Type">Specific Assets</Field>
          <Field label="Assets">{scope.assetIds.length.toLocaleString()} selected</Field>
        </dl>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="Locations">{names(scope.locations, "—")} (with sub-locations)</Field>
          <Field label="Organization Units">{names(scope.orgUnits, "All")}</Field>
          <Field label="Categories">{names(scope.categories, "All")}</Field>
          <Field label="Custodian">{names(scope.custodians, "Any")}</Field>
        </dl>
      )}
    </Card>
  );
}

function AssignmentsCard({ assignments, onMove }: { assignments: Assignments | null; onMove: (group: AssignmentGroup) => void }) {
  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="font-semibold">Verification Assignments</h2>
        <p className="text-xs text-muted-foreground">
          Each asset goes to its custodian, the manager of its OU, or you. Reassign moves a whole group.
        </p>
      </div>
      {!assignments ? (
        <FormError message="The assignments could not be loaded. Reload to try again." />
      ) : assignments.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No assets in scope, so nobody is assigned.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">Assignee</th>
                <th className="py-2 pr-3 font-medium">Why</th>
                <th className="py-2 pr-3 font-medium">Locations</th>
                <th className="py-2 pr-3 text-right font-medium">Assets</th>
                <th className="py-2 pr-3 font-medium">Notification</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {assignments.data.map((g) => (
                <tr
                  key={g.assignee.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-2 pr-3 font-medium">{g.assignee.name}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{g.reasons.map((r) => REASON_LABEL[r] ?? r).join(", ")}</td>
                  <td className="py-2 pr-3">{g.scopeLabel || "—"}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{g.expectedAssets.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-muted-foreground">Not sent yet</td>
                  <td className="py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMove(g)}
                    >
                      Reassign
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
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
