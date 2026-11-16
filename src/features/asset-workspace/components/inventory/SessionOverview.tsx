"use client";

// Session Overview tab (05 §4.9 · checklist §1 I2/I4): KPI row, session information, scope and assignees, locations and
// categories in scope, and the five latest activities. Not shown (checklist §5): Session ID and Verification Method.
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { BuildingIcon, EditIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import {
  bangkokToday,
  detailHref,
  dueHint,
  sessionActions,
  type Activity,
  type ActivityRow,
  type Person,
  type SessionAssets,
  type SessionDetail,
} from "../../domain/inventory";
import {
  activityTone,
  SESSION_STATUS_TONE,
  TONE_SOLID,
} from "../../domain/status-tone";
import { EmptyState } from "../states/states";
import { activityIcon } from "./activity-icon";
import { AssetsKpi } from "./AssetsKpi";
import { EditSessionDialog } from "./EditSessionDialog";
import { Avatar } from "./parts";
import { CHART, share, topRows } from "./scope-parts";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Bangkok",
});
const date = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "—");
const SHOWN = 5;

function Section({ title, action, children, id }: { title: string; action?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <Card
      id={id}
      className="min-w-0 space-y-4 p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

const linkClass = "text-sm font-medium text-primary hover:underline";

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-border text-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-2.5 first:pt-0 last:pb-0"
        >
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Timeline({ rows }: { rows: ActivityRow[] }) {
  return (
    <ol className="relative space-y-1 before:absolute before:bottom-6 before:left-[1.125rem] before:top-6 before:w-px before:bg-border">
      {rows.map((r) => {
        const { icon, tone } = activityIcon(r);
        const subject = r.asset ? `${r.asset.name} · ${r.asset.assetTag}` : r.unexpectedIdentifier;
        return (
          <li
            key={r.id}
            className="relative flex items-start gap-3 py-2"
          >
            <span
              aria-hidden="true"
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base text-white ${TONE_SOLID[activityTone(tone)]}`}
            >
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{r.summary}</p>
              {subject && <p className="truncate text-xs text-muted-foreground">{subject}</p>}
            </div>
            <div className="shrink-0 text-right text-xs text-muted-foreground">
              <time dateTime={r.at}>{timeFmt.format(new Date(r.at))}</time>
              <p>by {r.actorName ?? "System"}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function SessionOverview({ session, assets, activity, owners }: {
  session: SessionDetail;
  /** Asset Admins who can own a session; `null` when the caller is not an Asset Admin (no Edit button). */
  owners: Person[] | null;
  assets: SessionAssets | null;
  activity: Activity | null;
}) {
  const { counts, scope } = session;
  const [editing, setEditing] = useState(false);
  const canEdit = owners !== null && sessionActions(session.status).edit;
  const hint = session.status === "In Progress" ? dueHint(session.dueDate, bangkokToday()) : null;
  const names = (list: { name: string }[], none: string) => (list.length ? list.map((x) => x.name).join(", ") : none);
  const notes = session.description || "—";
  const failed = <p className="text-sm text-muted-foreground">Could not be loaded. Reload to try again.</p>;

  const info: [string, ReactNode][] = [
    ["Session Name", session.name],
    ["Scope", session.scopeLabel || "—"],
    ["Description", session.description || "—"],
    [
      "Status",
      <Badge
        key="s"
        variant="pill"
        color={SESSION_STATUS_TONE[session.status]}
      >
        {session.status}
      </Badge>,
    ],
    [
      "Owner",
      session.owner ? (
        <span
          key="o"
          className="flex items-center gap-2"
        >
          <Avatar name={session.owner.name} />
          <span className="min-w-0">
            <span className="block truncate font-medium">{session.owner.name}</span>
            <span className="text-xs text-muted-foreground">Asset Admin</span>
          </span>
        </span>
      ) : (
        "—"
      ),
    ],
    ["Created By", session.createdBy?.name ?? "—"],
    ["Start Date", date(session.startedAt)],
    [
      "Due Date",
      <span key="d">
        {session.dueDate ? dateFmt.format(new Date(session.dueDate)) : "—"}
        {hint && <span className="ml-2 text-t1-red-700">({hint.text})</span>}
      </span>,
    ],
  ];
  if (session.completedAt) info.push(["Completed", date(session.completedAt)]);
  if (session.cancelledAt) info.push(["Cancelled", `${date(session.cancelledAt)}${session.cancelReason ? ` · ${session.cancelReason}` : ""}`]);

  const places = assets?.byLocation.slice(0, SHOWN) ?? [];
  const cats = assets ? topRows(assets.byCategory.map((c) => ({ id: c.id, name: c.name, count: c.expected })), 4) : [];
  const catTotal = cats.reduce((n, c) => n + c.count, 0);

  return (
    <div className="space-y-3">
      <AssetsKpi counts={counts} />

      <div className="grid gap-3 xl:grid-cols-3">
        <div className="min-w-0 space-y-3 xl:col-span-2">
          <div className="grid gap-3 lg:grid-cols-2">
            <Section
              title="Session Information"
              action={
                canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    <EditIcon
                      aria-hidden="true"
                      className="mr-1.5 h-4 w-4"
                    />
                    Edit
                  </Button>
                )
              }
            >
              <Rows rows={info} />
            </Section>
            <Section title="Scope & Targets">
              <Rows
                rows={
                  session.scopeMode === "specific_assets"
                    ? [
                        ["Scope Type", `Specific Assets (${scope.assetIds.length.toLocaleString()})`],
                        ["Expected Assets", counts.expected.toLocaleString()],
                        ["Notes", notes],
                      ]
                    : [
                        [
                          "Locations",
                          <span
                            key="l"
                            className="flex flex-wrap items-center justify-between gap-x-3"
                          >
                            <span>
                              {scope.locations.length} {scope.locations.length === 1 ? "location" : "locations"} (with sub-locations)
                            </span>
                            <a
                              href="#locations-in-scope"
                              className={linkClass}
                            >
                              View locations
                            </a>
                          </span>,
                        ],
                        ["Org Units", names(scope.orgUnits, "All OUs")],
                        ["Categories", names(scope.categories, "All categories")],
                        ["Custodian", names(scope.custodians, "All custodians")],
                        ["Expected Assets", counts.expected.toLocaleString()],
                        ["Notes", notes],
                      ]
                }
              />
            </Section>
          </div>

          <Section
            title="Recent Activity"
            action={
              <Link
                href={detailHref(session.id, "activity")}
                className={linkClass}
              >
                View all
              </Link>
            }
          >
            {!activity ? (
              failed
            ) : activity.data.length === 0 ? (
              <EmptyState
                title="No activity yet"
                body="Results, discrepancies and session changes appear here."
              />
            ) : (
              <Timeline rows={activity.data} />
            )}
          </Section>
        </div>

        <div className="min-w-0 space-y-3">
          <Section
            id="locations-in-scope"
            title="Locations in Scope"
            action={
              <Link
                href={detailHref(session.id, "assets")}
                className={linkClass}
              >
                View all
              </Link>
            }
          >
            {!assets ? (
              failed
            ) : places.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assets in this session.</p>
            ) : (
              <ul className="divide-y divide-border">
                {places.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"
                    >
                      <BuildingIcon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{l.name}</span>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{l.expected.toLocaleString()} assets</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Category Breakdown">
            {!assets ? (
              failed
            ) : catTotal === 0 ? (
              <p className="text-sm text-muted-foreground">No assets in this session.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-5">
                <div className="relative shrink-0">
                  <DonutChart
                    segments={cats.map((c, i) => ({ label: c.name, value: c.count, color: CHART[i % CHART.length] }))}
                    size={124}
                    strokeWidth={22}
                    seamless
                    className="relative z-10"
                  />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold tabular-nums">{catTotal.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">Assets</span>
                  </div>
                </div>
                <ul className="min-w-44 flex-1 space-y-1.5">
                  {cats.map((c, i) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: CHART[i % CHART.length] }}
                      />
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {c.count.toLocaleString()} ({share(c.count, catTotal)})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        </div>
      </div>
      {editing && owners && (
        <EditSessionDialog
          session={session}
          owners={owners}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
