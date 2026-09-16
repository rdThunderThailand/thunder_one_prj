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
  Ready: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
  "In Use": "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  "In Progress": "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400",
  "Retired-Cancelled": "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

export function AssetRegistryStatTilesRow({ summary }: { summary: AssetSummary | null }) {
  if (!summary) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-sm text-zinc-400 dark:border-zinc-800">
        ไม่สามารถโหลดข้อมูลสรุปได้ในขณะนี้
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <Card className="flex flex-col gap-2 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
          <BoxIcon />
        </span>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">ทรัพย์สินทั้งหมด</p>
        <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{summary.total.toLocaleString()}</p>
        <p className="text-xs text-zinc-400">รายการ</p>
      </Card>
      {summary.byStatus.map((entry) => (
        <Card key={entry.status} className="flex flex-col gap-2 p-4">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneFor[entry.status]}`}>
            {iconFor[entry.status]}
          </span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{ASSET_STATUS_LABEL_TH[entry.status]}</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{entry.count.toLocaleString()}</p>
          <p className="text-xs text-zinc-400">{entry.percent}% ของทั้งหมด</p>
        </Card>
      ))}
    </div>
  );
}
