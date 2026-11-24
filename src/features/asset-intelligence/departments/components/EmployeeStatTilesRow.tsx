import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ListIcon, MegaphoneIcon, StarIcon, TrendUpIcon } from "@/components/ui/icons";
import { employeeStatTiles, type EmployeeStatTileData } from "../mock-data";

const iconFor: Record<EmployeeStatTileData["icon"], React.ReactNode> = {
  focus: <ListIcon />,
  checkCircle: <CheckCircleIcon />,
  megaphone: <MegaphoneIcon />,
  trendUp: <TrendUpIcon />,
  star: <StarIcon className="h-4 w-4" />,
};

const tone: Record<EmployeeStatTileData["color"], string> = {
  indigo: "bg-accent text-primary",
  emerald: "bg-success-muted text-t1-green-700",
  purple: "bg-in-progress-muted text-t1-purple-700",
  blue: "bg-info-muted text-t1-blue-700",
  amber: "bg-warning-muted text-t1-amber-700",
};

export function EmployeeStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {employeeStatTiles.map((tile) => (
        <Card key={tile.id} className="flex items-center gap-3 p-4">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone[tile.color]}`}>
            {iconFor[tile.icon]}
          </span>
          <div>
            <p className="text-xl font-semibold text-foreground">{tile.value}</p>
            <p className="text-xs text-t1-gray-400">{tile.sublabel}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
