import { AlertCircleIcon, ClockIcon, MinusIcon, ShieldIcon } from "@/components/ui/icons";
import { BarChart } from "@/components/ui/BarChart";
import { BreakdownBody } from "@/features/asset-workspace/components/overview/OverviewPage";
import { WarrantyReportView } from "@/features/asset-workspace/components/reports/ReportViews";
import {
  ExportCsvButton,
  KpiGrid,
  pct,
  REPORTS_BASE,
  ReportBody,
  ReportTabs,
  ToneDonut,
  Widget,
} from "@/features/asset-workspace/components/reports/ReportWidgets";
import { WARRANTY_STATUSES } from "@/features/asset-workspace/domain/report";
import { WARRANTY_TONE } from "@/features/asset-workspace/domain/status-tone";
import { getWarrantyReport, getWarrantyRows, reportAuth, type SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

const STATUS_ICON = { Active: ShieldIcon, "Expiring Soon": ClockIcon, Expired: AlertCircleIcon, "No Warranty": MinusIcon } as const;
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

// Warranty tab = PO Warranty Expiry (05 §4.13.5, 03 §2.7): current warranty only, bucketed by Core on the
// Asia/Bangkok date (Expiring Soon = ends within 90 days).
export default async function ReportsWarrantyPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const auth = await reportAuth();
  const [report, warranties] = auth
    ? await Promise.all([getWarrantyReport(auth.token, auth.tenantId, sp), getWarrantyRows(auth.token, auth.tenantId, sp)])
    : [null, { data: null, unavailable: false }];

  return (
    <WarrantyReportView
      slots={{
        nav: <ReportTabs active="warranty" />,
        primaryAction: <ExportCsvButton />,
        summary: (
          <ReportBody data={report}>
            {(r) => (
              <>
                <KpiGrid
                  tiles={WARRANTY_STATUSES.map((key) => {
                    const Icon = STATUS_ICON[key];
                    const count = r.byStatus[key] ?? 0;
                    return {
                      label: key === "Expiring Soon" ? "Expiring Soon (≤ 90 days)" : key,
                      value: count,
                      hint: `${pct(count, r.totalAssets)}% of ${r.totalAssets.toLocaleString()} assets`,
                      tone: WARRANTY_TONE[key],
                      icon: <Icon />,
                    };
                  })}
                />
                <div className="grid gap-3 lg:grid-cols-3">
                  <Widget title="Warranty Status">
                    <ToneDonut
                      counts={r.byStatus}
                      order={WARRANTY_STATUSES}
                      tone={WARRANTY_TONE}
                    />
                  </Widget>
                  <Widget title="Expiring Warranty (Next 90 Days)">
                    <BarChart
                      data={r.expiringByMonth.map((m) => ({
                        label: monthFmt.format(new Date(`${m.month}-01T00:00:00`)),
                        value: m.count.toLocaleString(),
                        count: m.count,
                      }))}
                      color="var(--color-warning)"
                      className="h-48"
                    />
                  </Widget>
                  <Widget title="Warranty by Provider">
                    <BreakdownBody
                      items={r.byProvider.map((p) => ({ id: p.provider, label: p.provider, count: p.count }))}
                      total={r.byProvider.reduce((sum, p) => sum + p.count, 0)}
                      href={(provider) => `${REPORTS_BASE}/warranty?provider=${encodeURIComponent(provider)}`}
                      chart="bars"
                    />
                  </Widget>
                </div>
              </>
            )}
          </ReportBody>
        ),
      }}
      data={warranties.data}
      unavailable={warranties.unavailable}
      providers={report && report !== "unavailable" ? report.byProvider.map((p) => ({ value: p.provider, label: p.provider })) : []}
    />
  );
}
