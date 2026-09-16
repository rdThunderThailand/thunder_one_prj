import type { DonutSegment } from "@/components/ui/DonutChart";
import type { BarDatum } from "@/components/ui/BarChart";
import type { OrgUnitNode } from "@/features/people/org-structure";
import { formatThaiDate } from "@/lib/thai-date";
// Cross-feature reuse, same convention as org-structure/personnel already
// importing each other's real types — avoids re-fetching or re-typing the
// same GET /tenants/:id/members?include=onboarding row shape a second time
// just because this card lives in a different feature folder.
import type { CoreOnboardingRow } from "@/features/people/new-hires/services/onboarding-api";

export interface OverviewOnboardingRow {
  id: string;
  name: string;
  role: string;
  startDateLabel: string;
  progress: number;
}

export interface OverviewStats {
  totalHeadcount: number;
  newHiresThisMonth: number;
  onboardingCount: number;
  personnelBreakdown: DonutSegment[];
  tenureDistribution: BarDatum[];
  orgStructureRows: { id: string; name: string; count: number }[];
  onboardingSummary: { total: number; notStarted: number; inProgress: number; completed: number };
  onboardingRows: OverviewOnboardingRow[];
}

const TYPE_LABEL: Record<string, string> = {
  employee: "พนักงาน (Employee)",
  contractor: "ผู้รับเหมา (Contractor)",
  partner: "พันธมิตร (Partner)",
  guest: "แขก (Guest)",
};
const TYPE_COLOR: Record<string, string> = {
  employee: "#6366f1",
  contractor: "#22d3ee",
  partner: "#8b5cf6",
  guest: "#f59e0b",
};

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function tenureBandIndex(startDate: string, now: Date): number | null {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;
  const years = (now.getTime() - start.getTime()) / MS_PER_YEAR;
  if (years < 1) return 0;
  if (years < 3) return 1;
  if (years < 5) return 2;
  if (years < 10) return 3;
  return 4;
}

const TENURE_BANDS = ["น้อยกว่า 1 ปี", "1 - 3 ปี", "3 - 5 ปี", "5 - 10 ปี", "มากกว่า 10 ปี"];

/**
 * Computes every real number this page's cards below TodayActivityCard now
 * need, from data already fetched for other real cards (the onboarding
 * roster and org tree) — one pass, not a fetch per card. `dueSoon` in
 * `onboardingSummary` and `dueLabel` on per-person rows are deliberately
 * NOT computed: Core's onboarding steps have no due-date concept at all
 * (only `completed_at` once a step is actually done), so there is no real
 * "days until due" to derive — see OnboardingStatusCard for how that's
 * shown honestly instead of guessed at.
 */
export function computeOverviewStats(
  rows: CoreOnboardingRow[],
  units: Record<string, OrgUnitNode>,
  now: Date = new Date()
): OverviewStats {
  const currentMonthKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}`;

  let newHiresThisMonth = 0;
  const typeCounts: Record<string, number> = { employee: 0, contractor: 0, partner: 0, guest: 0 };
  const tenureCounts = [0, 0, 0, 0, 0];
  const onboardingRows: OverviewOnboardingRow[] = [];
  let notStarted = 0;
  let inProgress = 0;
  let completed = 0;

  for (const row of rows) {
    const type = row.member_type ?? "employee";
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;

    if (row.start_date) {
      const start = new Date(row.start_date);
      if (!Number.isNaN(start.getTime())) {
        if (`${start.getUTCFullYear()}-${start.getUTCMonth()}` === currentMonthKey) newHiresThisMonth += 1;
        const band = tenureBandIndex(row.start_date, now);
        if (band !== null) tenureCounts[band] += 1;
      }
    }

    const { done, total } = row.onboarding;
    if (done === 0) notStarted += 1;
    else if (done < total) {
      inProgress += 1;
      onboardingRows.push({
        id: row.id,
        name: row.user.full_name,
        role: row.job_title ?? "-",
        startDateLabel: row.start_date ? formatThaiDate(row.start_date) : "-",
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
      });
    } else completed += 1;
  }

  const totalHeadcount = rows.length;
  const personnelBreakdown: DonutSegment[] = Object.entries(typeCounts)
    .filter(([, value]) => value > 0)
    .map(([type, value]) => ({ label: TYPE_LABEL[type] ?? type, value, color: TYPE_COLOR[type] ?? "#a1a1aa" }));

  const tenureTotal = tenureCounts.reduce((a, b) => a + b, 0);
  const tenureDistribution: BarDatum[] = TENURE_BANDS.map((label, i) => ({
    label,
    value: tenureTotal > 0 ? `${tenureCounts[i]} (${((tenureCounts[i] / tenureTotal) * 100).toFixed(1)}%)` : "0",
    count: tenureCounts[i],
  }));

  const orgStructureRows = Object.values(units)
    .filter((unit) => unit.parentId === null)
    .sort((a, b) => b.employeeCount - a.employeeCount)
    .slice(0, 6)
    .map((unit) => ({ id: unit.id, name: unit.name, count: unit.employeeCount }));

  return {
    totalHeadcount,
    newHiresThisMonth,
    onboardingCount: inProgress,
    personnelBreakdown,
    tenureDistribution,
    orgStructureRows,
    onboardingSummary: { total: totalHeadcount, notStarted, inProgress, completed },
    onboardingRows,
  };
}
