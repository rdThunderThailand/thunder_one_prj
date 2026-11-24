import { Card } from "@/components/ui/Card";
import { BoxIcon, CheckCircleIcon, RepeatIcon, SettingsIcon, XIcon } from "@/components/ui/icons";
import { ASSET_STATUS_LABEL_TH } from "../asset-status-display";
import type { AssetListStatus, AssetSummary } from "../services/asset-list-api";

const iconFor: Record<AssetListStatus, React.ReactNode> = {
  Ready: <CheckCircleIcon />,
  "In Use": <SettingsIcon />,
  "In Progress": <RepeatIcon />,
  "Retired-Cancelled": <XIcon />,
};

const toneFor: Record<AssetListStatus, string> = {
  Ready: "bg-success-muted text-success",
  "In Use": "bg-info-muted text-info",
  "In Progress": "bg-in-progress-muted text-in-progress",
  "Retired-Cancelled": "bg-error-muted text-error",
};

export function AssetRegistryStatTilesRow({ summary }: { summary: AssetSummary | null }) {
  if (!summary) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-t1-gray-400">
        ไม่สามารถโหลดข้อมูลสรุปได้ในขณะนี้
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <Card className="flex flex-col gap-2 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <BoxIcon />
        </span>
        <p className="text-xs text-muted-foreground">ทรัพย์สินทั้งหมด</p>
        <p className="text-2xl font-semibold text-foreground">{summary.total.toLocaleString()}</p>
        <p className="text-xs text-t1-gray-400">รายการ</p>
      </Card>
      {summary.byStatus.map((entry) => (
        <Card key={entry.status} className="flex flex-col gap-2 p-4">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneFor[entry.status]}`}>
            {iconFor[entry.status]}
          </span>
          <p className="text-xs text-muted-foreground">{ASSET_STATUS_LABEL_TH[entry.status]}</p>
          <p className="text-2xl font-semibold text-foreground">{entry.count.toLocaleString()}</p>
          <p className="text-xs text-t1-gray-400">{entry.percent}% ของทั้งหมด</p>
        </Card>
      ))}
    </div>
  );
}
