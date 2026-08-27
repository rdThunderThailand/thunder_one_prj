import { RepeatIcon, SettingsIcon } from "@/components/ui/icons";

// No session lookup here — Asset Intelligence has no RBAC/session wiring
// yet (unlike Thunder One's shell), matching this session's "mock pages
// first, real RBAC later" plan. Name is a placeholder until that lands.
export function AssetAdminDashboardHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          สวัสดีครับ กนกวรรณ 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          ภาพรวมสถานะทรัพย์สินขององค์กร ณ วันนี้
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
          <RepeatIcon className="h-3.5 w-3.5" />
          อัปเดตล่าสุด 10:30 น.
        </span>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          ปรับแต่งหน้าแดชบอร์ด
          <SettingsIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
