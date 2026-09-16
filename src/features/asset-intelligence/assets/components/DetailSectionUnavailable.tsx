import { Card } from "@/components/ui/Card";
import { InfoIcon } from "@/components/ui/icons";

/**
 * Shown in place of a Detail-page section Core has no data source for at
 * all (Lifecycle timeline, Warranty & Support, Related Documents, Latest
 * Count, Activity History) — `GET .../assets/{assetId}` only returns the
 * same fields as a List row (asset-list-api.ts's AssetListRow), nothing
 * else. Deliberately not showing the old mock content dressed up with a
 * disclaimer — that risks reading as real for a specific asset it isn't
 * describing (Nie, 2026-08-26: "wire real fields, placeholder the rest").
 */
export function DetailSectionUnavailable({ title, note }: { title: string; note?: string }) {
  return (
    <Card className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <h2 className="self-start text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-zinc-400">
        <InfoIcon className="h-5 w-5" />
        <p className="text-sm">ยังไม่มีข้อมูลนี้ในระบบ</p>
        {note && <p className="text-xs text-zinc-300 dark:text-zinc-600">{note}</p>}
      </div>
    </Card>
  );
}
