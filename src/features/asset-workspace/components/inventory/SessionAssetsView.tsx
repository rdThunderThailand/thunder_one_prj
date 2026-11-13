"use client";

// Session Assets tab (05 §4.9 · checklist §1 I2, read only): the frozen snapshot with each asset's result. Filters and
// the page live in the URL; the server page fetches. Verify (I3) adds a row action here.
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { SESSION_ASSET_RESULTS, type SessionAssetResult, type SessionAssets } from "../../domain/inventory";
import { INVENTORY_RESULT_TONE, type StatusTone } from "../../domain/status-tone";
import { useListUrlState } from "../list-page/useListUrlState";
import { ReportFilterBar } from "../reports/ReportFilterBar";
import { EmptyState, LoadingState } from "../states/states";
import { ErrorState } from "../states/ErrorState";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const TONE: Record<SessionAssetResult, StatusTone> = { ...INVENTORY_RESULT_TONE, Remaining: "zinc" };
const HEADERS = ["Asset", "Asset Tag", "Category", "Expected Location", "Expected Custodian", "Result", "Verified By", "Verified Date"];

export function SessionAssetsView({ data }: { data: SessionAssets | null }) {
  const url = useListUrlState();
  const filtered = Boolean(url.get("q") || url.get("result") || url.get("category_id"));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ReportFilterBar
          url={url}
          searchPlaceholder="Search name, tag, serial or barcode"
          selects={[
            { key: "result", label: "Result", options: SESSION_ASSET_RESULTS.map((value) => ({ value, label: value })) },
            { key: "category_id", label: "Category", options: (data?.byCategory ?? []).map((c) => ({ value: c.id, label: c.name })) },
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
            title={filtered ? "No assets match" : "No assets in this session"}
            body={filtered ? "Change the search or filters." : "Assets appear here once the session starts."}
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
                  {data.data.map((a) => {
                    const result: SessionAssetResult = a.result ?? "Remaining";
                    return (
                      <tr
                        key={a.snapshotId}
                        className="border-b border-border last:border-0"
                      >
                        <td className="min-w-48 py-3 pr-4">
                          <p className="font-medium">{a.name}</p>
                          {a.serialNumber && <p className="text-xs text-muted-foreground">S/N {a.serialNumber}</p>}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-4">{a.assetTag}</td>
                        <td className="py-3 pr-4">{a.category?.name ?? "—"}</td>
                        <td className="py-3 pr-4">{a.expectedLocation?.name ?? "—"}</td>
                        <td className="py-3 pr-4">{a.expectedCustodian?.name ?? "—"}</td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant="pill"
                            color={TONE[result]}
                            className="whitespace-nowrap"
                          >
                            {result}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">{a.verifiedBy?.name ?? "—"}</td>
                        <td className="whitespace-nowrap py-3 pr-4">{a.verifiedAt ? dateFmt.format(new Date(a.verifiedAt)) : "—"}</td>
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
              itemLabel="assets"
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
