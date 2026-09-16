import { Card } from "@/components/ui/Card";
import type { AssetDetail } from "../services/asset-list-api";

function formatTHB(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatWeight(value: number | null): string {
  if (value === null) return "—";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} kg`;
}

// `productGroup` has no column in Core's schema yet (P1, deferred pending a
// product decision on whether it duplicates `category`) — the rest of P1
// shipped 2026-08-26, see the asset-detail-page-api-gap-analysis doc.
export function AssetAdditionalInfoCard({ asset }: { asset: AssetDetail }) {
  const rows: { label: string; value: string }[] = [
    { label: "หมวดหมู่", value: asset.category ?? "—" },
    { label: "มูลค่า (THB)", value: formatTHB(asset.valueTHB) },
    { label: "ขนาด", value: asset.dimensions ?? "—" },
    { label: "น้ำหนัก", value: formatWeight(asset.weight) },
    { label: "อุปกรณ์เสริม", value: asset.accessories && asset.accessories.length > 0 ? asset.accessories.join(", ") : "—" },
    { label: "หมายเหตุ", value: asset.notes ?? "—" },
  ];

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ข้อมูลเพิ่มเติม</h2>
      <dl className="flex flex-col gap-2.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-2">
            <dt className="text-xs text-zinc-400">{row.label}</dt>
            <dd className="text-right text-zinc-700 dark:text-zinc-200">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
