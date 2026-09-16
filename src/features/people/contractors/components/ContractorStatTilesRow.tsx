import { Card } from "@/components/ui/Card";
import type { ContractorRow } from "../mock-data";

interface ContractorStatTilesRowProps {
  /** Real since 2026-09-15 — computed from the fetched roster, not the old
   *  static mock numbers (48/32/6/10/11). "ใกล้หมดสัญญา" will always read 0:
   *  `core-mapper.ts`'s `deriveStatus()` never returns "expiring-soon" since
   *  Core has no contract-end-date at list level to derive it from — see
   *  that function's own comment. The old 5th tile ("สัญญาที่หมดอายุใน 90
   *  วัน") had no real equivalent at all (same missing-date problem, worse —
   *  no status bucket to approximate it with either), so it's replaced with
   *  "รออนุมัติ" (a real, already-tracked status) rather than left showing a
   *  fabricated or always-zero number with no honest explanation. */
  rows: ContractorRow[];
}

export function ContractorStatTilesRow({ rows }: ContractorStatTilesRowProps) {
  const count = (status: ContractorRow["status"]) => rows.filter((r) => r.status === status).length;

  const tiles = [
    { id: "total", label: "ทั้งหมด", value: rows.length, sublabel: "คน" },
    { id: "active", label: "กำลังปฏิบัติงาน", value: count("active"), sublabel: "คน" },
    { id: "expiring-soon", label: "ใกล้หมดสัญญา", value: count("expiring-soon"), sublabel: "คน" },
    { id: "expired", label: "หมดสัญญาแล้ว", value: count("expired"), sublabel: "คน" },
    { id: "pending-approval", label: "รออนุมัติ", value: count("pending-approval"), sublabel: "คน" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</span>
          <p className="text-xs text-zinc-400">{tile.sublabel}</p>
        </Card>
      ))}
    </div>
  );
}
