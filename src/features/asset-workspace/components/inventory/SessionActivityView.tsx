"use client";

// Session Activity tab (05 §4.9 · checklist §1 I4, read only): KPIs + filters + newest-first log of results,
// discrepancy reports / decisions and session lifecycle. Filters live in the URL; the server page fetches.
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { StatTile } from "@/components/ui/StatTile";
import { ActivityIcon, CheckCircleIcon, SettingsIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { ACTIVITY_TYPES, type Activity, type ActivityRow, type ActivityType } from "../../domain/inventory";
import type { StatusTone } from "../../domain/status-tone";
import { useListUrlState } from "../list-page/useListUrlState";
import { ReportFilterBar } from "../reports/ReportFilterBar";
import { EmptyState, LoadingState } from "../states/states";
import { ErrorState } from "../states/ErrorState";

const timeFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const TYPE_LABEL = Object.fromEntries(ACTIVITY_TYPES.map((t) => [t.value, t.label])) as Record<ActivityType, string>;
const TYPE_TONE: Record<ActivityType, StatusTone> = { verification: "green", discrepancy: "yellow", system: "zinc" };

export function ActivityList({ rows }: { rows: ActivityRow[] }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3 text-sm"
        >
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium">{r.summary}</p>
            <p className="text-xs text-muted-foreground">
              {[r.asset ? `${r.asset.name} · ${r.asset.assetTag}` : r.unexpectedIdentifier, r.actorName ?? "System"]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              variant="pill"
              color={TYPE_TONE[r.type]}
            >
              {TYPE_LABEL[r.type]}
            </Badge>
            <time
              dateTime={r.at}
              className="whitespace-nowrap text-xs text-muted-foreground"
            >
              {timeFmt.format(new Date(r.at))}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SessionActivityView({ data, users }: {
  data: Activity | null;
  /** User filter choices: the session owner and assignees. */
  users: { id: string; name: string }[];
}) {
  const url = useListUrlState();
  const filtered = Boolean(url.get("q") || url.get("type") || url.get("actorId") || url.get("from") || url.get("to"));
  const c = data?.counts;

  return (
    <div className="space-y-3">
      {c && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Total Activities"
            value={c.total.toLocaleString()}
            color="indigo"
            icon={<ActivityIcon aria-hidden="true" />}
          />
          <StatTile
            label="Verification"
            value={c.verification.toLocaleString()}
            color="emerald"
            icon={<CheckCircleIcon aria-hidden="true" />}
          />
          <StatTile
            label="Discrepancy"
            value={c.discrepancy.toLocaleString()}
            color="amber"
            icon={<WarningTriangleIcon aria-hidden="true" />}
          />
          <StatTile
            label="System & Other"
            value={c.system.toLocaleString()}
            color="zinc"
            icon={<SettingsIcon aria-hidden="true" />}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <ReportFilterBar
          url={url}
          searchPlaceholder="Search activity, asset or identifier"
          selects={[
            { key: "type", label: "Activity Type", options: [...ACTIVITY_TYPES] },
            { key: "actorId", label: "User", options: users.map((u) => ({ value: u.id, label: u.name })) },
          ]}
          dateRange={{ label: "Date", from: "from", to: "to" }}
        />
      </div>
      <Card className="p-4">
        {url.isPending ? (
          <LoadingState />
        ) : data === null ? (
          <ErrorState />
        ) : data.data.length === 0 ? (
          <EmptyState
            title={filtered ? "No activity matches" : "No activity yet"}
            body={filtered ? "Change the search or filters." : "Results, discrepancies and session changes appear here."}
          />
        ) : (
          <>
            <ActivityList rows={data.data} />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              perPage={data.pageSize}
              totalItems={data.total}
              rangeStart={(data.page - 1) * data.pageSize + 1}
              rangeEnd={(data.page - 1) * data.pageSize + data.data.length}
              itemLabel="activities"
              perPageOptions={[20, 50, 100]}
              onPageChange={(page) => url.set({ page: String(page) })}
              onPerPageChange={(size) => url.set({ pageSize: String(size) })}
            />
          </>
        )}
      </Card>
    </div>
  );
}
