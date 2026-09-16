import { Card } from "@/components/ui/Card";
import { InfoIcon } from "@/components/ui/icons";
import type { AssetDetail } from "../services/asset-list-api";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * P3 (Lifecycle) — `assets.lifecycle_stage` exists but is null for
 * essentially every asset today (0/509 populated as of 2026-08-26, per the
 * asset-detail-page-api-gap-analysis doc): a data-population gap, not a
 * missing feature, so a null `currentStage` shows "ยังไม่ได้กำหนด" rather
 * than the DetailSectionUnavailable "not built yet" state other still-genuinely-
 * unbuilt cards (Warranty, Latest Count) use.
 */
export function AssetLifecycleCard({ asset }: { asset: AssetDetail }) {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Lifecycle</h2>
      {asset.currentStage ? (
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-zinc-400">สถานะวงจรชีวิตปัจจุบัน</dt>
            <dd className="text-zinc-700 dark:text-zinc-200">{asset.currentStage}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-zinc-400">เปลี่ยนสถานะล่าสุดเมื่อ</dt>
            <dd className="text-zinc-700 dark:text-zinc-200">{formatDate(asset.stageChangedAt)}</dd>
          </div>
        </dl>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center text-zinc-400">
          <InfoIcon className="h-5 w-5" />
          <p className="text-sm">ยังไม่ได้กำหนดสถานะวงจรชีวิตสำหรับทรัพย์สินนี้</p>
        </div>
      )}
    </Card>
  );
}
