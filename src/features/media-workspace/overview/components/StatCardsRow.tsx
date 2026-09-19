import { Card } from "@/components/ui/Card";
import { Sparkline } from "@/components/ui/Sparkline";
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  MonitorIcon,
  PaperPlaneIcon,
  WarningTriangleIcon,
} from "@/components/ui/icons";
import { statCards, type StatCardData } from "../mock-data";

// 2026-09-19: matched to the design reference's own stat-tile icon chips —
// a single neutral bg-muted chip with a semantic-colored icon (not a
// per-stat pastel background). indigo/blue/amber/emerald map onto this
// app's closest semantic tokens (primary/info/warning/success); "red" is a
// new addition for Offline (see mock-data.ts's own 2026-09-19 comment —
// Offline+Warning previously both reused "amber" and the calendar glyph).
const textColor: Record<StatCardData["color"], string> = {
  indigo: "text-primary",
  blue: "text-info",
  amber: "text-warning",
  emerald: "text-success",
  red: "text-danger",
};

const badgeColor: Record<StatCardData["color"], string> = {
  indigo: "bg-muted text-primary",
  blue: "bg-muted text-info",
  amber: "bg-muted text-warning",
  emerald: "bg-muted text-success",
  red: "bg-muted text-danger",
};

const iconFor: Record<StatCardData["icon"], React.ReactNode> = {
  monitor: <MonitorIcon />,
  paperPlane: <PaperPlaneIcon />,
  calendar: <CalendarIcon />,
  checkCircle: <CheckCircleIcon />,
  warningTriangle: <WarningTriangleIcon />,
  alertCircle: <AlertCircleIcon />,
};

function StatCard({ stat }: { stat: StatCardData }) {
  return (
    <Card className="flex min-h-31 flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        {/* 2026-09-19: text-sm/text-zinc-500 -> text-[11px]/font-semibold/
            text-muted-foreground, matching the reference's own stat label
            (11px/600). */}
        <p className="text-[11px] font-semibold text-muted-foreground">{stat.label}</p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badgeColor[stat.color]}`}
        >
          {iconFor[stat.icon]}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        {/* font-semibold -> font-bold, text-zinc-900 -> text-foreground,
            matching the reference's stat value (24px/700). */}
        <span className="text-2xl font-bold text-foreground">
          {stat.value}
        </span>
        {stat.total && (
          <span className="text-sm text-muted-foreground">/ {stat.total}</span>
        )}
      </div>
      {/* text-xs -> text-2xs (10px), matching the reference's sub-line. */}
      {stat.delta && <p className="text-2xs text-muted-foreground">{stat.delta}</p>}
      <Sparkline data={stat.trend} className={`h-8 w-full ${textColor[stat.color]}`} />
    </Card>
  );
}

export function StatCardsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  );
}
