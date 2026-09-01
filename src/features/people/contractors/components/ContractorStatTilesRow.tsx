import { Card } from "@/components/ui/Card";
import { contractorStatTiles } from "../mock-data";

export function ContractorStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {contractorStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</span>
          <p className="text-xs text-zinc-400">{tile.sublabel}</p>
        </Card>
      ))}
    </div>
  );
}
