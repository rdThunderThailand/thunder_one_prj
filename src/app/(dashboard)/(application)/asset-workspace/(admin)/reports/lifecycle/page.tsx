import { BarChart } from "@/components/ui/BarChart";
import { AssetReportView } from "@/features/asset-workspace/components/reports/ReportViews";
import {
  AttentionTable,
  ExportCsvButton,
  LifecycleKpis,
  NotAvailable,
  PeriodButton,
  ReportBody,
  ReportTabs,
  StackedBars,
  ToneDonut,
  Widget,
  pct,
} from "@/features/asset-workspace/components/reports/ReportWidgets";
import { ASSET_CONDITIONS } from "@/features/asset-workspace/domain/asset-condition";
import { ASSET_STATUSES } from "@/features/asset-workspace/domain/asset-status";
import { AGE_BUCKETS, topWithOthers } from "@/features/asset-workspace/domain/report";
import { CONDITION_TONE, STATUS_TONE } from "@/features/asset-workspace/domain/status-tone";
import { getAssetFilters, getAssetRows, getLifecycleReport, reportAuth, type SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

// Lifecycle & Condition tab, laid out as Figma (user 2026-11-04). PO Lifecycle Summary + condition counts (05 §4.13.5).
// Age, Near End of Life and Assets Requiring Attention use provisional rules (domain/report.ts) and wait on Core PR 7.
export default async function ReportsLifecyclePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const auth = await reportAuth();
  const [report, rows, filters] = auth
    ? await Promise.all([
        getLifecycleReport(auth.token, auth.tenantId, sp),
        getAssetRows(auth.token, auth.tenantId, sp),
        getAssetFilters(auth.token, auth.tenantId),
      ])
    : [null, null, null];

  return (
    <AssetReportView
      subtitle="Asset lifecycle, age and condition across your organization"
      slots={{
        nav: <ReportTabs active="lifecycle" />,
        primaryAction: (
          <div className="flex gap-2">
            <PeriodButton />
            <ExportCsvButton />
          </div>
        ),
        summary: (
          <>
            <LifecycleKpis data={report} />
            <div className="grid gap-3 lg:grid-cols-2">
              <Widget title="Asset Age Distribution">
                <ReportBody data={report}>
                  {(r) =>
                    r.age ? (
                      <BarChart
                        data={AGE_BUCKETS.map((bucket) => {
                          const count = r.age?.distribution.find((d) => d.bucket === bucket)?.count ?? 0;
                          return { label: bucket, value: `${count.toLocaleString()} (${pct(count, r.age?.counted ?? 0)}%)`, count };
                        })}
                        color="var(--color-info)"
                        className="h-48"
                      />
                    ) : (
                      <NotAvailable />
                    )
                  }
                </ReportBody>
              </Widget>
              <Widget title="Condition Overview">
                <ReportBody data={report}>
                  {(r) => (
                    <ToneDonut
                      counts={r.byCondition}
                      order={ASSET_CONDITIONS}
                      tone={CONDITION_TONE}
                    />
                  )}
                </ReportBody>
              </Widget>
              <Widget title="Lifecycle by Category">
                <ReportBody data={report}>
                  {(r) => (
                    <StackedBars
                      rows={topWithOthers(
                        r.byCategory.map((c) => ({ id: c.id, name: c.name, counts: c.byStatus })),
                        6,
                      )}
                      order={ASSET_STATUSES}
                      tone={STATUS_TONE}
                    />
                  )}
                </ReportBody>
              </Widget>
              <Widget title="Assets Requiring Attention">
                <ReportBody data={report}>
                  {(r) =>
                    r.attention ? (
                      <AttentionTable
                        rows={r.attention}
                        total={r.total}
                      />
                    ) : (
                      <NotAvailable />
                    )
                  }
                </ReportBody>
              </Widget>
            </div>
          </>
        ),
      }}
      data={rows}
      filters={filters}
      lifecycleColumns
    />
  );
}
