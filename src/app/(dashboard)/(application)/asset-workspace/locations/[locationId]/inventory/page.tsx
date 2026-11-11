import { CalendarIcon, CheckCircleIcon, FileTextIcon, InventoryIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { LocationTabHeader } from "@/features/asset-workspace/components/locations/LocationHero";
import { LocationInventorySection } from "@/features/asset-workspace/components/reports/ReportViews";
import { KpiGrid } from "@/features/asset-workspace/components/reports/ReportWidgets";
import { getSessionRows, reportAuth, type SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const OPEN = new Set(["Draft", "In Progress"]);
const DISCREPANCIES = ["Mismatch", "Not Found", "Unexpected"] as const;

// Inventory sessions whose scope includes this location (05 §4.9). Start Inventory waits on the Inventory module.
export default async function LocationInventoryTab({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locationId }, sp, auth] = await Promise.all([params, searchParams, reportAuth()]);
  // Table follows the URL filters; the KPIs read the newest 100 sessions without them.
  // ponytail: Open / Discrepancies count the newest 100 only; move to a Core summary if a location passes that.
  const [sessions, all] = auth
    ? await Promise.all([
        getSessionRows(auth.token, auth.tenantId, { ...sp, location_id: locationId }),
        getSessionRows(auth.token, auth.tenantId, { location_id: locationId, pageSize: "100" }),
      ])
    : [{ data: null, unavailable: false }, { data: null, unavailable: false }];

  const rows = all.data?.rows ?? [];
  const lastDone = rows.find((s) => s.completedAt);
  const known = all.data && !all.unavailable;
  const tile = (value: number | string | null) => (known ? value : null);

  return (
    <div className="space-y-3">
      <LocationTabHeader
        title="Inventory Sessions"
        count={known ? all.data!.total : null}
        subtitle="Stocktake and verification sessions that cover this location."
        action={
          <Button
            disabled
            title="Available when the Inventory module is ready"
          >
            <InventoryIcon className="h-4 w-4" />
            Start Inventory
          </Button>
        }
      />
      <KpiGrid
        tiles={[
          { label: "Total Sessions", value: tile(all.data?.total ?? null), hint: "All inventory sessions", icon: <CalendarIcon className="h-4 w-4" />, tone: "blue" },
          {
            label: "Open Sessions",
            value: tile(rows.filter((s) => OPEN.has(s.status)).length),
            hint: "Draft or In Progress",
            icon: <FileTextIcon className="h-4 w-4" />,
          },
          {
            label: "Last Completion Rate",
            value: tile(lastDone ? `${lastDone.progressPct}%` : "—"),
            hint: lastDone ? dateFmt.format(new Date(lastDone.completedAt!)) : "No completed session",
            icon: <CheckCircleIcon className="h-4 w-4" />,
            tone: "green",
          },
          {
            label: "Total Discrepancies",
            value: tile(rows.reduce((sum, s) => sum + DISCREPANCIES.reduce((n, r) => n + (s.results[r] ?? 0), 0), 0)),
            hint: "Mismatch, Not Found, Unexpected",
            icon: <WarningTriangleIcon className="h-4 w-4" />,
            tone: "red",
          },
        ]}
      />
      <LocationInventorySection
        data={sessions.data}
        unavailable={sessions.unavailable}
      />
    </div>
  );
}
