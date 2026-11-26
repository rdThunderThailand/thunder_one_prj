import { CalendarIcon, ChartIcon, ClockIcon, FileTextIcon } from "@/components/ui/icons";
import { LocationHistorySection } from "@/features/asset-workspace/components/locations/LocationDetailSections";
import { LocationTabHeader } from "@/features/asset-workspace/components/locations/LocationHero";
import { KpiGrid } from "@/features/asset-workspace/components/reports/ReportWidgets";
import { getLocationHistory } from "@/features/asset-workspace/services/asset-locations-api";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

const bangkokToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
const minusDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
const atFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", hour12: false, timeZone: "Asia/Bangkok" });

// Location History (05 §4.8, Core #329): location master events + asset moves, read-only, no export (Figma).
export default async function LocationHistoryTab({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locationId }, sp] = await Promise.all([params, searchParams]);
  const today = bangkokToday();
  // KPIs: counts come from each call's `total` (pageSize 1); Last Updated = the newest event.
  const [events, all, todays, week] = await Promise.all([
    getLocationHistory(locationId, sp),
    getLocationHistory(locationId, { pageSize: "1" }),
    getLocationHistory(locationId, { from: today, pageSize: "1" }),
    getLocationHistory(locationId, { from: minusDays(today, 6), pageSize: "1" }),
  ]);
  const count = (r: typeof all) => (r.data && !r.unavailable ? r.data.total : null);
  const latest = all.data?.rows[0];

  return (
    <div className="space-y-3">
      <LocationTabHeader
        title="History"
        count={count(all)}
        subtitle="Changes and activity related to this location."
      />
      <KpiGrid
        tiles={[
          { label: "Total Events", value: count(all), hint: "All time events", icon: <FileTextIcon className="h-4 w-4" />, tone: "blue" },
          { label: "Today", value: count(todays), hint: "Events today", icon: <CalendarIcon className="h-4 w-4" />, tone: "green" },
          { label: "Last 7 Days", value: count(week), hint: "Events in last 7 days", icon: <ChartIcon className="h-4 w-4" /> },
          {
            label: "Last Updated",
            value: count(all) === null ? null : latest ? atFmt.format(new Date(latest.at)) : "—",
            hint: "Most recent event",
            icon: <ClockIcon className="h-4 w-4" />,
          },
        ]}
      />
      <LocationHistorySection
        data={events.data}
        unavailable={events.unavailable}
      />
    </div>
  );
}
