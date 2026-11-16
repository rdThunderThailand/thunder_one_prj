"use client";

// Session Discrepancies tab (05 §4.9 · checklist §1 I3): KPIs + findings table in PO words (Not Found / Unexpected /
// Mismatch, never "Missing" / "Other Issues"), no checkboxes. Filters live in the URL; the server page fetches.
// A Completed session adds Reconcile on each open row (I4).
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/lovable/button";
import { LocationIcon, SearchXIcon, UserIcon, WarningTriangleIcon, XCircleIcon } from "@/components/ui/icons";
import {
  FINDING_FILTERS,
  FINDING_LABEL,
  FINDING_STATES,
  findingChange,
  findingResult,
  findingStatus,
  type Finding,
  type Findings,
} from "../../domain/inventory";
import { INVENTORY_RESULT_TONE } from "../../domain/status-tone";
import { useListUrlState } from "../list-page/useListUrlState";
import { ReportFilterBar } from "../reports/ReportFilterBar";
import { EmptyState, LoadingState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { KpiTile, toneTile } from "./kpi-tile";
import { ReconcileDialog } from "./ReconcileDialog";
import { share } from "./scope-parts";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const HEADERS = ["Asset", "Asset Tag", "Category", "Expected Location", "Result", "Found Location", "Verified By", "Date", "Status"];

function Kpi({ counts, expected }: { counts: Findings["counts"]; expected: number }) {
  const notFound = INVENTORY_RESULT_TONE["Not Found"];
  const unexpected = INVENTORY_RESULT_TONE.Unexpected;
  const mismatch = INVENTORY_RESULT_TONE.Mismatch;
  return (
    <Card className="grid gap-3 p-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <KpiTile
        icon={<WarningTriangleIcon />}
        {...toneTile("red")}
        value={counts.total}
        label="Total Discrepancies"
        note={`${share(counts.total, expected)} of expected assets`}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          icon={<XCircleIcon />}
          {...toneTile(notFound)}
          value={counts.notFound}
          label="Not Found"
          note="Not found during verification"
        />
        <KpiTile
          icon={<SearchXIcon />}
          {...toneTile(unexpected)}
          value={counts.unexpected}
          label="Unexpected"
          note="Found but not in this session"
        />
        <KpiTile
          icon={<LocationIcon />}
          {...toneTile(mismatch)}
          value={counts.mismatch.location}
          label="Location Mismatch"
          note="Found in a different location"
        />
        <KpiTile
          icon={<UserIcon />}
          {...toneTile("zinc")}
          value={counts.mismatch.custody + counts.mismatch.condition}
          label="Custody / Condition"
          note="Different custodian or condition"
        />
      </div>
    </Card>
  );
}

export function SessionDiscrepanciesView({ sessionId, expected, data, canReconcile, options }: {
  sessionId: string;
  /** Frozen asset count of the session, for the share in the Total tile. */
  expected: number;
  data: Findings | null;
  /** Completed: Reconcile on open rows (Core: Asset Admin only). */
  canReconcile: boolean;
  options: { categories: { id: string; name: string | null }[]; locations: { id: string; name: string | null }[] };
}) {
  const url = useListUrlState();
  const [reconciling, setReconciling] = useState<Finding | null>(null);
  const filtered = Boolean(url.get("q") || url.get("type") || url.get("category_id") || url.get("location_id") || url.get("state"));
  const c = data?.counts;
  const opts = (list: { id: string; name: string | null }[]) => list.map((x) => ({ value: x.id, label: x.name ?? "Unnamed" }));

  return (
    <div className="space-y-3">
      {c && <Kpi counts={c} expected={expected} />}
      <div className="flex flex-wrap items-center gap-2">
        <ReportFilterBar
          url={url}
          searchPlaceholder="Search name, tag, serial or identifier"
          selects={[
            { key: "type", label: "Result", options: FINDING_FILTERS },
            { key: "category_id", label: "Category", options: opts(options.categories) },
            { key: "location_id", label: "Location", options: opts(options.locations) },
            { key: "state", label: "Status", options: FINDING_STATES },
          ]}
        />
      </div>
      <Card className="p-4">
        {url.isPending ? (
          <LoadingState />
        ) : data === null ? (
          <ErrorState />
        ) : data.data.length === 0 ? (
          <EmptyState
            title={filtered ? "No discrepancies match" : "No discrepancies"}
            body={filtered ? "Change the search or filters." : "Not Found, Unexpected and Mismatch results appear here."}
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
                    {canReconcile && (
                      <th className="py-2 font-medium">
                        <span className="sr-only">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((f) => {
                    const change = findingChange(f);
                    return (
                      <tr
                        key={f.id}
                        className="border-b border-border align-top last:border-0"
                      >
                        <td className="min-w-48 py-3 pr-4">
                          <p className="font-medium">{f.asset?.name ?? f.unexpectedIdentifier ?? "—"}</p>
                          {f.asset?.serialNumber && <p className="text-xs text-muted-foreground">S/N {f.asset.serialNumber}</p>}
                          {f.note && <p className="text-xs text-muted-foreground">{f.note}</p>}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-4">{f.asset?.assetTag ?? "—"}</td>
                        <td className="py-3 pr-4">{f.category?.name ?? "—"}</td>
                        <td className="py-3 pr-4">{f.expectedLocation?.name ?? "—"}</td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant="pill"
                            color={INVENTORY_RESULT_TONE[findingResult(f.type)]}
                            className="whitespace-nowrap"
                          >
                            {FINDING_LABEL[f.type]}
                          </Badge>
                          {change && <p className="mt-1 text-xs text-muted-foreground">{change}</p>}
                        </td>
                        <td className="py-3 pr-4">{f.foundLocation?.name ?? "—"}</td>
                        <td className="py-3 pr-4">{f.reportedBy?.name ?? "—"}</td>
                        <td className="whitespace-nowrap py-3 pr-4">{dateFmt.format(new Date(f.reportedAt))}</td>
                        <td className="py-3 pr-4">
                          <p className="whitespace-nowrap">{findingStatus(f)}</p>
                          {f.decisionReason && <p className="text-xs text-muted-foreground">{f.decisionReason}</p>}
                        </td>
                        {canReconcile && (
                          <td className="py-3 text-right">
                            {f.resolutionState === "open" && (
                              <Button
                                size="sm"
                                aria-label={`Reconcile ${f.asset?.name ?? f.unexpectedIdentifier ?? "finding"}`}
                                onClick={() => setReconciling(f)}
                              >
                                Reconcile
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
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
              itemLabel="discrepancies"
              perPageOptions={[20, 50, 100]}
              onPageChange={(page) => url.set({ page: String(page) })}
              onPerPageChange={(size) => url.set({ pageSize: String(size) })}
            />
          </>
        )}
      </Card>
      {reconciling && (
        <ReconcileDialog
          key={reconciling.id}
          sessionId={sessionId}
          finding={reconciling}
          onClose={() => setReconciling(null)}
        />
      )}
    </div>
  );
}
