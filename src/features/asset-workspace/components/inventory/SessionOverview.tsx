// Session Overview tab (05 §4.9 · checklist §1 I2): progress, KPIs, information, scope and assignees, location and
// category progress and the five latest activities. No Verification Method (§5).
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatTile } from "@/components/ui/StatTile";
import { CheckCircleIcon, ClockIcon, InventoryIcon, WarningTriangleIcon } from "@/components/ui/icons";
import {
  detailHref,
  REASON_LABEL,
  sessionProgress,
  type Activity,
  type Assignments,
  type Breakdown,
  type SessionAssets,
  type SessionDetail,
} from "../../domain/inventory";
import type { StatusTone } from "../../domain/status-tone";
import { ToneDonut } from "../reports/ReportWidgets";
import { EmptyState } from "../states/states";
import { ActivityList } from "./SessionActivityView";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const date = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "—");

const RING = ["Verified", "Mismatch", "Not Found", "Remaining"] as const;
const RING_TONE: Record<(typeof RING)[number], StatusTone> = { Verified: "green", Mismatch: "yellow", "Not Found": "red", Remaining: "zinc" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="space-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2"
        >
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Bar({ label, detail, done, expected }: { label: ReactNode; detail?: string; done: number; expected: number }) {
  const pct = expected ? Math.round((done / expected) * 100) : 0;
  return (
    <li className="space-y-1">
      <div className="flex justify-between gap-2 text-sm">
        <span className="min-w-0 truncate">
          {label}
          {detail && <span className="text-muted-foreground"> · {detail}</span>}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {done.toLocaleString()} / {expected.toLocaleString()}
        </span>
      </div>
      <ProgressBar
        value={pct}
        color={pct >= 100 ? "emerald" : "indigo"}
      />
    </li>
  );
}

function ProgressList({ rows }: { rows: Breakdown[] | undefined }) {
  if (!rows) return <p className="text-sm text-muted-foreground">Could not be loaded. Reload to try again.</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No assets in this session.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <Bar
          key={r.id}
          label={r.name}
          done={r.done}
          expected={r.expected}
        />
      ))}
    </ul>
  );
}

export function SessionOverview({ session, assignments, assets, activity }: {
  session: SessionDetail;
  /** `null` = the fetch failed. */
  assignments: Assignments | null;
  assets: SessionAssets | null;
  activity: Activity | null;
}) {
  const { counts, scope } = session;
  const progress = sessionProgress(counts);
  const names = (list: { name: string }[], none: string) => (list.length ? list.map((x) => x.name).join(", ") : none);
  const info: [string, ReactNode][] = [
    ["Name", session.name],
    ["Description", session.description || "—"],
    ["Owner", session.owner?.name ?? "—"],
    ["Created By", session.createdBy?.name ?? "—"],
    ["Start Date", date(session.startedAt)],
    ["Due Date", session.dueDate ? dateFmt.format(new Date(session.dueDate)) : "—"],
  ];
  if (session.completedAt) info.push(["Completed", date(session.completedAt)]);
  if (session.cancelledAt) info.push(["Cancelled", `${date(session.cancelledAt)}${session.cancelReason ? ` · ${session.cancelReason}` : ""}`]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Section title="Verification Progress">
          <p className="text-sm text-muted-foreground">
            <span className="text-2xl font-semibold tabular-nums text-foreground">{progress.pct}%</span> checked ·{" "}
            {progress.done.toLocaleString()} of {counts.expected.toLocaleString()}
          </p>
          <ToneDonut
            counts={{ Verified: counts.verified, Mismatch: counts.mismatch, "Not Found": counts.notFound, Remaining: counts.remaining }}
            order={RING}
            tone={RING_TONE}
          />
        </Section>
        <div className="grid h-fit grid-cols-2 gap-3">
          <StatTile
            label="Verified"
            value={counts.verified.toLocaleString()}
            color="emerald"
            icon={<CheckCircleIcon aria-hidden="true" />}
          />
          <StatTile
            label="Discrepancies"
            value={progress.discrepancies.toLocaleString()}
            hint="Mismatch, Not Found, Unexpected"
            color="red"
            icon={<WarningTriangleIcon aria-hidden="true" />}
          />
          <StatTile
            label="Remaining"
            value={counts.remaining.toLocaleString()}
            color="amber"
            icon={<ClockIcon aria-hidden="true" />}
          />
          <StatTile
            label="Total Assets"
            value={counts.expected.toLocaleString()}
            hint="Frozen at start"
            color="indigo"
            icon={<InventoryIcon aria-hidden="true" />}
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Section title="Session Information">
          <Rows rows={info} />
        </Section>
        <Section title="Scope & Targets">
          <Rows
            rows={
              session.scopeMode === "specific_assets"
                ? [["Scope Type", `Specific Assets (${scope.assetIds.length.toLocaleString()})`]]
                : [
                    ["Locations", `${names(scope.locations, "—")} (with sub-locations)`],
                    ["Org Units", names(scope.orgUnits, "All")],
                    ["Categories", names(scope.categories, "All")],
                    ["Custodian", names(scope.custodians, "Any")],
                  ]
            }
          />
          <h3 className="pt-2 text-xs font-semibold uppercase text-muted-foreground">Assignees</h3>
          {!assignments ? (
            <p className="text-sm text-muted-foreground">Could not be loaded. Reload to try again.</p>
          ) : assignments.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nobody is assigned.</p>
          ) : (
            <ul className="space-y-3">
              {assignments.data.map((g) => (
                <Bar
                  key={g.assignee.id}
                  label={<span className="font-medium">{g.assignee.name}</span>}
                  detail={g.reasons.map((r) => REASON_LABEL[r] ?? r).join(", ")}
                  done={g.done}
                  expected={g.expectedAssets}
                />
              ))}
            </ul>
          )}
        </Section>
        <Section title="Locations in Scope">
          <ProgressList rows={assets?.byLocation} />
        </Section>
        <Section title="Category Breakdown">
          <ProgressList rows={assets?.byCategory} />
        </Section>
      </div>

      <Section title="Recent Activity">
        {!activity ? (
          <p className="text-sm text-muted-foreground">Could not be loaded. Reload to try again.</p>
        ) : activity.data.length === 0 ? (
          <EmptyState
            title="No activity yet"
            body="Results, discrepancies and session changes appear here."
          />
        ) : (
          <>
            <ActivityList rows={activity.data} />
            <Link
              href={detailHref(session.id, "activity")}
              className="text-sm font-medium text-primary hover:underline"
            >
              View all activity
            </Link>
          </>
        )}
      </Section>
    </div>
  );
}
