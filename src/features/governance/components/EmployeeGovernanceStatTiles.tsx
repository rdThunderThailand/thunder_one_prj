import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ClipboardIcon, ClockIcon, ShieldIcon, UsersIcon } from "@/components/ui/icons";
import { employeeGovernanceStatTiles, type EmployeeGovernanceStatTileData } from "../mock-data";

const iconFor: Record<EmployeeGovernanceStatTileData["icon"], React.ReactNode> = {
  shield: <ShieldIcon />,
  checkCircle: <CheckCircleIcon />,
  clock: <ClockIcon />,
  document: <ClipboardIcon />,
  users: <UsersIcon />,
};

const tone: Record<EmployeeGovernanceStatTileData["color"], string> = {
  indigo: "bg-accent text-primary",
  emerald: "bg-success-muted text-t1-green-700",
  amber: "bg-warning-muted text-t1-amber-700",
  purple: "bg-in-progress-muted text-t1-purple-700",
  blue: "bg-info-muted text-t1-blue-700",
};

export function EmployeeGovernanceStatTiles() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {employeeGovernanceStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-2 p-4">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone[tile.color]}`}>
            {iconFor[tile.icon]}
          </span>
          <p className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-foreground">{tile.value}</span>
            {tile.deltaLabel && <span className="text-xs font-medium text-success">{tile.deltaLabel}</span>}
          </p>
          <p className="text-xs text-t1-gray-400">{tile.sublabel}</p>
          <button className="mt-1 flex items-center gap-1 text-left text-xs font-medium text-primary hover:text-accent-foreground">
            {tile.linkLabel} →
          </button>
        </Card>
      ))}
    </div>
  );
}
