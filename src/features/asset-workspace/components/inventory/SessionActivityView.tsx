"use client";

// Session Activity tab (05 §4.9 · checklist §1 I4, read only): KPI tiles, filters and a newest-first table of results,
// discrepancy reports / decisions and session lifecycle. Filters live in the URL; the server page fetches. No sorting
// (Core returns newest first only) and no user role under the name (Core does not send it).
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { CheckCircleIcon, FileTextIcon, SettingsIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { ACTIVITY_TYPES, activityText, type Activity, type ActivityRow } from "../../domain/inventory";
import { activityTone, INVENTORY_RESULT_TONE, TONE_SOLID } from "../../domain/status-tone";
import { useListUrlState } from "../list-page/useListUrlState";
import { ReportFilterBar } from "../reports/ReportFilterBar";
import { EmptyState, LoadingState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { activityIcon } from "./activity-icon";
import { Avatar } from "./parts";
import { KpiTile, toneTile } from "./kpi-tile";
import { share } from "./scope-parts";

const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
const clockFmt = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Bangkok" });
const HEADERS = ["Date & Time", "Activity", "Asset / Reference", "User", "Details"];

function Kpi({ counts }: { counts: Activity["counts"] }) {
  const of = (n: number) => `${share(n, counts.total)} of all activities`;
  return (
    <Card className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        icon={<FileTextIcon />}
        iconClass="text-primary"
        tint="bg-card"
        value={counts.total}
        label="Total Activities"
        note="All actions in this session"
      />
      <KpiTile
        icon={<CheckCircleIcon />}
        {...toneTile(INVENTORY_RESULT_TONE.Verified)}
        value={counts.verification}
        label="Verification Activities"
        note={of(counts.verification)}
      />
      <KpiTile
        icon={<WarningTriangleIcon />}
        {...toneTile(INVENTORY_RESULT_TONE.Mismatch)}
        value={counts.discrepancy}
        label="Discrepancy Activities"
        note={of(counts.discrepancy)}
      />
      <KpiTile
        icon={<SettingsIcon />}
        iconClass="text-t1-purple-700"
        tint="bg-t1-purple-50"
        value={counts.system}
        label="System & Other"
        note={of(counts.system)}
      />
    </Card>
  );
}

function Row({ r }: { r: ActivityRow }) {
  const { icon, tone } = activityIcon(r);
  const when = new Date(r.at);
  const { subtitle, details } = activityText(r);
  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="whitespace-nowrap py-3 pr-4">
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base text-white ${TONE_SOLID[activityTone(tone)]}`}
          >
            {icon}
          </span>
          <time dateTime={r.at}>
            <span className="block">{dayFmt.format(when)}</span>
            <span className="block text-xs text-muted-foreground">{clockFmt.format(when)}</span>
          </time>
        </span>
      </td>
      <td className="min-w-48 py-3 pr-4">
        <p className="font-medium">{r.summary}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </td>
      <td className="min-w-40 py-3 pr-4">
        {r.asset ? (
          <>
            <Link
              href={`/asset-workspace/assets/${encodeURIComponent(r.asset.id)}`}
              className="font-medium text-primary hover:underline"
            >
              {r.asset.name}
            </Link>
            <p className="text-xs text-muted-foreground">{r.asset.assetTag}</p>
          </>
        ) : r.unexpectedIdentifier ? (
          <>
            <p className="font-medium">{r.unexpectedIdentifier}</p>
            <p className="text-xs text-muted-foreground">(Unregistered)</p>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 pr-4">
        <span className="flex items-center gap-2">
          <Avatar name={r.actorName ?? "System"} />
          <span className="min-w-0 break-words">{r.actorName ?? "System"}</span>
        </span>
      </td>
      <td className="min-w-48 py-3 text-muted-foreground">{details}</td>
    </tr>
  );
}

export function SessionActivityView({ data, users }: {
  data: Activity | null;
  /** User filter choices: the session owner and assignees. */
  users: { id: string; name: string }[];
}) {
  const url = useListUrlState();
  const filtered = Boolean(url.get("q") || url.get("type") || url.get("actorId") || url.get("from") || url.get("to"));

  return (
    <div className="space-y-3">
      {data && <Kpi counts={data.counts} />}
      <div className="flex flex-wrap items-center gap-2">
        <ReportFilterBar
          url={url}
          searchPlaceholder="Search by asset name, tag or activity"
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    {HEADERS.map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap py-2 pr-4 font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((r) => (
                    <Row
                      key={r.id}
                      r={r}
                    />
                  ))}
                </tbody>
              </table>
            </div>
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
