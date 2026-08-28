import { Card } from "@/components/ui/Card";
import { orgStatTiles, orgStructureUpdatedBy, orgStructureUpdatedLabel } from "../mock-data";

export function OrgStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {orgStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</span>
          <p className="text-xs text-zinc-400">{tile.sublabel}</p>
        </Card>
      ))}

      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">โครงสร้างล่าสุด</p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{orgStructureUpdatedLabel}</p>
        <p className="text-xs text-zinc-400">{orgStructureUpdatedBy}</p>
      </Card>
    </div>
  );
}
