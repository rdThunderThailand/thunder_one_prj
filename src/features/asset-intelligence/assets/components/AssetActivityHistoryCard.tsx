import { Card } from "@/components/ui/Card";
import { InfoIcon } from "@/components/ui/icons";
import type { AssetActivityEntry } from "../services/asset-list-api";

const ACTIVITY_LABEL_TH: Record<string, string> = {
  STATUS_CHANGE: "เปลี่ยนสถานะ",
  DEVICE_LINK: "เชื่อมโยงอุปกรณ์",
  DEVICE_UNLINK: "ยกเลิกการเชื่อมโยงอุปกรณ์",
  ATTACHMENT_ADDED: "เพิ่มเอกสารแนบ",
};

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("th-TH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * P7 (Activity History) — reads `v_asset_activity_log` via Core's
 * `GET .../assets/{assetId}/activity`, per the asset-detail-page-api-gap-
 * analysis doc (2026-08-26). The view is populated by the same write path as
 * P3's lifecycle history, so it's empty for essentially every asset today —
 * an empty *loaded* feed shows a plain "no activity yet" message, distinct
 * from `activity === null` (the fetch itself failed).
 */
export function AssetActivityHistoryCard({ activity }: { activity: AssetActivityEntry[] | null }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ประวัติการดำเนินการ</h2>
      {activity === null ? (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-zinc-400">
          <InfoIcon className="h-5 w-5" />
          <p className="text-sm">ไม่สามารถโหลดประวัติการดำเนินการได้ในขณะนี้</p>
        </div>
      ) : activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-zinc-400">
          <InfoIcon className="h-5 w-5" />
          <p className="text-sm">ยังไม่มีประวัติการดำเนินการสำหรับทรัพย์สินนี้</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {activity.map((entry, i) => (
            <li key={i} className="flex items-start justify-between gap-4 py-2.5 text-sm">
              <div>
                <p className="font-medium text-zinc-700 dark:text-zinc-200">
                  {ACTIVITY_LABEL_TH[entry.action] ?? entry.action}
                </p>
                {entry.detail && <p className="text-xs text-zinc-400">{entry.detail}</p>}
                <p className="text-xs text-zinc-400">{entry.actor ?? "ไม่ทราบผู้ดำเนินการ"}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs text-zinc-400">{formatTimestamp(entry.timestamp)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
