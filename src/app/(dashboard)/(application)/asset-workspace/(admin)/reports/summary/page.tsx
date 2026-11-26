import { BreakdownBody } from "@/features/asset-workspace/components/overview/OverviewPage";
import { AssetReportView } from "@/features/asset-workspace/components/reports/ReportViews";
import {
  ExportCsvButton,
  REPORTS_BASE,
  ReportBody,
  ReportTabs,
  StatusKpis,
  ToneDonut,
  Widget,
} from "@/features/asset-workspace/components/reports/ReportWidgets";
import { ASSET_STATUSES } from "@/features/asset-workspace/domain/asset-status";
import { STATUS_TONE } from "@/features/asset-workspace/domain/status-tone";
import {
  getAssetFilters,
  getAssetRows,
  getAssetSummaryReport,
  getCustodyReport,
  getLocationReport,
  reportAuth,
  type NamedCount,
  type SearchParams,
} from "@/features/asset-workspace/services/asset-reports-api";

const sum = (items: { count: number }[]) => items.reduce((total, item) => total + item.count, 0);
const asInput = (items: NamedCount[]) => items.map((item) => ({ id: item.id, label: item.name, count: item.count }));

// Asset Summary tab = PO reports Asset Summary + Assets by Location + Assets by Custody (05 §4.13.5).
export default async function ReportsSummaryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const auth = await reportAuth();
  const [summary, byLocation, byCustody, rows, filters] = auth
    ? await Promise.all([
        getAssetSummaryReport(auth.token, auth.tenantId, sp),
        getLocationReport(auth.token, auth.tenantId, sp),
        getCustodyReport(auth.token, auth.tenantId, sp),
        getAssetRows(auth.token, auth.tenantId, sp),
        getAssetFilters(auth.token, auth.tenantId),
      ])
    : [null, null, null, null, null];

  const drill = (key: string) => (id: string) => `${REPORTS_BASE}/summary?${key}=${id}`;

  return (
    <AssetReportView
      subtitle="Asset counts by status, category, location and custodian"
      slots={{
        nav: <ReportTabs active="summary" />,
        primaryAction: <ExportCsvButton />,
        summary: (
          <>
            <StatusKpis data={summary} />
            <div className="grid gap-3 lg:grid-cols-2">
              <Widget title="Assets by Category">
                <ReportBody data={summary}>
                  {(s) => (
                    <BreakdownBody
                      items={asInput(s.byCategory)}
                      total={sum(s.byCategory)}
                      href={drill("category_id")}
                      chart="donut"
                    />
                  )}
                </ReportBody>
              </Widget>
              <Widget title="Assets by Lifecycle Status">
                <ReportBody data={summary}>
                  {(s) => (
                    <ToneDonut
                      counts={s.byStatus}
                      order={ASSET_STATUSES}
                      tone={STATUS_TONE}
                    />
                  )}
                </ReportBody>
              </Widget>
              <Widget title="Assets by Location">
                <ReportBody data={byLocation}>
                  {(items) => (
                    <BreakdownBody
                      items={asInput(items)}
                      // by-location leaves out assets without a location: count them against the summary total.
                      total={summary && summary !== "unavailable" ? summary.total : sum(items)}
                      href={drill("location_id")}
                      chart="bars"
                      restLabel="No location"
                    />
                  )}
                </ReportBody>
              </Widget>
              <Widget title="Assets by Custody">
                <ReportBody data={byCustody}>
                  {(c) => (
                    <BreakdownBody
                      items={c.targets.map((t) => ({ id: `${t.targetType}:${t.targetId}`, label: t.name, count: t.count }))}
                      total={sum(c.targets) + c.noCustody}
                      href={(id) => {
                        const [type, targetId] = id.split(":");
                        return `${REPORTS_BASE}/summary?custody_type=${type}&custody_id=${targetId}`;
                      }}
                      chart="bars"
                      restLabel="No custody"
                    />
                  )}
                </ReportBody>
              </Widget>
            </div>
          </>
        ),
      }}
      data={rows}
      filters={filters}
    />
  );
}
