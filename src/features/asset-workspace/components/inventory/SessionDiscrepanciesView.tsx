"use client";

// Session Discrepancies tab (05 §4.9 · checklist §1 I3): KPIs + findings table in PO words (Not Found / Unexpected /
// Mismatch, never "Missing" / "Other Issues"), no checkboxes. Filters live in the URL; the server page fetches.
// A Completed session adds Reconcile on each open row (I4).
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { StatTile } from "@/components/ui/StatTile";
import { Button } from "@/components/ui/lovable/button";
import { SearchXIcon, WarningTriangleIcon, XCircleIcon } from "@/components/ui/icons";
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
import { ReconcileDialog } from "./ReconcileDialog";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const HEADERS = ["Asset", "Asset Tag", "Category", "Expected Location", "Result", "Found Location", "Verified By", "Date", "Status"];

export function SessionDiscrepanciesView({ sessionId, data, canReconcile, options }: {
  sessionId: string;
  data: Findings | null;
  /** Completed: Reconcile on open rows (Core: Asset Admin only). */
  canReconcile: boolean;
  options: { categories: { id: string; name: string | null }[]; locations: { id: string; name: string | null }[] };
}) {
  const url = useListUrlState();
  const [reconciling, setReconciling] = useState<Finding | null>(null);
  const filtered = Boolean(url.get("q") || url.get("type") || url.get("category_id") || url.get("location_id") || url.get("state"));
  const c = data?.counts;
  const mismatch = c ? c.mismatch.location + c.mismatch.custody + c.mismatch.condition : 0;
  const opts = (list: { id: string; name: string | null }[]) => list.map((x) => ({ value: x.id, label: x.name ?? "Unnamed" }));

  return (
    <div className="space-y-3">
      {c && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Total Discrepancies"
            value={c.total.toLocaleString()}
            hint={`${c.open.toLocaleString()} open`}
            color="zinc"
            icon={<WarningTriangleIcon aria-hidden="true" />}
          />
          <StatTile
            label="Not Found"
            value={c.notFound.toLocaleString()}
            color="red"
            icon={<XCircleIcon aria-hidden="true" />}
          />
          <StatTile
            label="Unexpected"
            value={c.unexpected.toLocaleString()}
            color="blue"
            icon={<SearchXIcon aria-hidden="true" />}
          />
          <StatTile
            label="Mismatch"
            value={mismatch.toLocaleString()}
            trend={`Location ${c.mismatch.location} · Custody ${c.mismatch.custody} · Condition ${c.mismatch.condition}`}
            color="amber"
            icon={<WarningTriangleIcon aria-hidden="true" />}
          />
        </div>
      )}
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
