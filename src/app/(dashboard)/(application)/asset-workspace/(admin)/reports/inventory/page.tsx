import { CheckCircleIcon, FileTextIcon, InfoIcon, InventoryIcon, WarningTriangleIcon, XCircleIcon } from "@/components/ui/icons";
import { InventoryReportView } from "@/features/asset-workspace/components/reports/ReportViews";
import {
  ExportCsvButton,
  KpiGrid,
  pct,
  ReportBody,
  ReportTabs,
  StackedBars,
  ToneDonut,
  Widget,
} from "@/features/asset-workspace/components/reports/ReportWidgets";
import { INVENTORY_RESULTS } from "@/features/asset-workspace/domain/report";
import { INVENTORY_RESULT_TONE } from "@/features/asset-workspace/domain/status-tone";
import { getLocationCounts } from "@/features/asset-workspace/services/asset-overview-api";
import { getInventoryReport, getSessionRows, reportAuth, type SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

const RESULT_ICON = { Verified: CheckCircleIcon, Mismatch: WarningTriangleIcon, "Not Found": XCircleIcon, Unexpected: InfoIcon } as const;

// Inventory tab = PO Inventory Summary (05 §4.13.5, §4.5, §4.9). Session detail lives in the Inventory module;
// a row opens it there.
export default async function ReportsInventoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const auth = await reportAuth();
  const [report, sessions, locations] = auth
    ? await Promise.all([
        getInventoryReport(auth.token, auth.tenantId, sp),
        getSessionRows(auth.token, auth.tenantId, sp),
        getLocationCounts(auth.token, auth.tenantId),
      ])
    : [null, { data: null, unavailable: false }, null];

  return (
    <InventoryReportView
      slots={{
        nav: <ReportTabs active="inventory" />,
        primaryAction: <ExportCsvButton />,
        summary: (
          <ReportBody data={report}>
            {(r) => {
              const results = INVENTORY_RESULTS.reduce((sum, key) => sum + (r.results[key] ?? 0), 0);
              return (
                <>
                  <KpiGrid
                    tiles={[
                      { label: "Total Sessions", value: r.sessions.total, hint: `${r.sessions.open} open`, icon: <InventoryIcon /> },
                      ...INVENTORY_RESULTS.map((key) => {
                        const Icon = RESULT_ICON[key];
                        const count = r.results[key] ?? 0;
                        return { label: key, value: count, hint: `${pct(count, results)}%`, tone: INVENTORY_RESULT_TONE[key], icon: <Icon /> };
                      }),
                      { label: "Open Findings", value: r.openFindings, icon: <FileTextIcon /> },
                    ]}
                  />
                  <div className="grid gap-3 lg:grid-cols-3">
                    <Widget title="Findings by Type">
                      <ToneDonut
                        counts={r.results}
                        order={INVENTORY_RESULTS}
                        tone={INVENTORY_RESULT_TONE}
                        unit="Results"
                      />
                    </Widget>
                    <Widget title="Findings by Location">
                      <StackedBars
                        rows={r.byLocation.map((l) => ({ id: l.id, name: l.name, counts: l.results }))}
                        order={INVENTORY_RESULTS}
                        tone={INVENTORY_RESULT_TONE}
                      />
                    </Widget>
                    <Widget title="Top Categories with Findings">
                      <StackedBars
                        rows={r.topCategories.map((c) => ({ id: c.id, name: c.name, counts: c.results }))}
                        order={INVENTORY_RESULTS}
                        tone={INVENTORY_RESULT_TONE}
                      />
                    </Widget>
                  </div>
                </>
              );
            }}
          </ReportBody>
        ),
      }}
      data={sessions.data}
      unavailable={sessions.unavailable}
      locations={(locations ?? []).map((l) => ({ value: l.id, label: l.label }))}
    />
  );
}
