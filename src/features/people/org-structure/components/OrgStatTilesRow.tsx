import { Card } from "@/components/ui/Card";
import type { OrgUnitNode } from "../mock-data";

interface OrgStatTilesRowProps {
  units: Record<string, OrgUnitNode>;
  rootUnitId: string;
}

interface Tile {
  id: string;
  label: string;
  value: string;
}

// Replaces the old hardcoded "18 units / 56 teams / 128 employees / 142
// positions / 87% fill rate" mock tiles (2026-09-14) — those numbers had no
// relationship to whatever tenant was actually being viewed. Every tile here
// is derived from the same `units`/`rootUnitId` the page already fetches
// from Core; `positionsCount`/`fillRate` stay "ไม่มีข้อมูล" rather than a
// fabricated number, since Core has no backing concept for either yet (see
// core-mapper.ts's header comment).
export function OrgStatTilesRow({ units, rootUnitId }: OrgStatTilesRowProps) {
  const allUnits = Object.values(units);
  const root = units[rootUnitId];

  const tiles: Tile[] = [
    { id: "units", label: "หน่วยงานทั้งหมด", value: String(allUnits.length) },
    {
      id: "sub-units",
      label: "หน่วยงานย่อยทั้งหมด",
      value: String(allUnits.filter((unit) => unit.parentId !== null).length),
    },
    { id: "employees", label: "พนักงานทั้งหมด", value: String(root?.employeeCount ?? 0) },
    { id: "positions", label: "ตำแหน่งงาน", value: "ไม่มีข้อมูล" },
    { id: "fill-rate", label: "อัตราบรรจุ", value: "ไม่มีข้อมูล" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</span>
        </Card>
      ))}
    </div>
  );
}
