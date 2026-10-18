import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { SettingsIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { departmentStatTiles, needsAttention, requestsSummary } from "../mock-data";

const badgeColor: Record<(typeof needsAttention)[number]["severity"], string> = {
  red: "bg-error-muted text-error",
  yellow: "bg-warning-muted text-warning",
};

const iconFor: Record<(typeof needsAttention)[number]["severity"], React.ReactNode> = {
  red: <WarningTriangleIcon />,
  yellow: <SettingsIcon />,
};

function NeedsAttentionCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Needs Attention
      </h2>
      <ul className="flex flex-1 flex-col gap-3">
        {needsAttention.map((row) => (
          <li key={row.id} className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badgeColor[row.severity]}`}
            >
              {iconFor[row.severity]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {row.tag}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {row.subtitle} · Assigned: {row.assignee}
              </p>
            </div>
            <button className="shrink-0 text-xs font-medium text-primary hover:text-accent-foreground">
              Review
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RequestsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Requests</h2>
      <ul className="flex flex-1 flex-col gap-2.5">
        <li className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Waiting IT</span>
          <span className="font-medium text-foreground">
            {requestsSummary.waitingIT}
          </span>
        </li>
        <li className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Completed Today</span>
          <span className="font-medium text-foreground">
            {requestsSummary.completedToday}
          </span>
        </li>
      </ul>
    </Card>
  );
}

export function DepartmentPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {departmentStatTiles.map((tile) => (
          <StatTile key={tile.id} label={tile.label} value={tile.value} color={tile.color} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NeedsAttentionCard />
        <RequestsCard />
      </div>
      <Link
        href="/asset-intelligence/departments/assets"
        className="self-start text-sm font-medium text-primary hover:text-accent-foreground"
      >
        View all department assets →
      </Link>
    </div>
  );
}
