import QRCode from "qrcode";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ASSET_STATUS_BADGE_COLOR, ASSET_STATUS_LABEL_TH } from "../asset-status-display";
import type { AssetDetail } from "../services/asset-list-api";

// Real, scannable QR — encodes the Asset ID (no canonical "view asset" URL
// exists in env.ts yet to encode instead). Rendered server-side as an SVG
// string, so this card needs no client JS.
async function AssetQrCode({ assetId }: { assetId: string }) {
  const svg = await QRCode.toString(assetId, {
    type: "svg",
    margin: 1,
    color: { dark: "#18181b", light: "#0000" },
  });

  return (
    <div
      className="aspect-square w-full max-w-[180px] rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 [&_svg]:h-full [&_svg]:w-full [&_svg]:dark:invert"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

export async function AssetIdentityCard({ asset }: { asset: AssetDetail }) {
  const fields: { label: string; value: string }[] = [
    { label: "Asset ID", value: asset.id },
    { label: "Asset Tag", value: asset.assetTag ?? "—" },
    { label: "Serial Number", value: asset.serial ?? "—" },
    { label: "Barcode", value: asset.barcode ?? "—" },
    { label: "ประเภททรัพย์สิน", value: asset.category ?? "—" },
    { label: "ยี่ห้อ / รุ่น", value: asset.name },
    { label: "สี", value: asset.color ?? "—" },
    { label: "วันที่รับเข้า", value: formatDate(asset.receivedDate) },
  ];

  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Asset Identity</h2>

      <div className="mb-3 flex flex-col items-center gap-2">
        <AssetQrCode assetId={asset.id} />
        <span
          title="Not built yet"
          className="cursor-not-allowed text-xs font-medium text-indigo-600 dark:text-indigo-400"
        >
          พิมพ์ Label
        </span>
      </div>

      <dl className="flex flex-col gap-2 text-sm">
        {fields.map((field) => (
          <div key={field.label} className="flex items-center justify-between gap-2">
            <dt className="text-xs text-zinc-400">{field.label}</dt>
            <dd className="truncate text-right text-zinc-700 dark:text-zinc-200">{field.value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2">
          <dt className="text-xs text-zinc-400">สถานะ</dt>
          <dd>
            <Badge variant="pill" color={ASSET_STATUS_BADGE_COLOR[asset.status]}>
              {ASSET_STATUS_LABEL_TH[asset.status]}
            </Badge>
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        <span
          title="Not built yet"
          className="flex flex-1 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 py-2 text-sm font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          ดาวน์โหลด PNG
        </span>
        <span
          title="Not built yet"
          className="flex flex-1 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 py-2 text-sm font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          สร้างใหม่
        </span>
      </div>
    </Card>
  );
}
