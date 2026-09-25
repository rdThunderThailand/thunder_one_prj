import { lastUpdatedLabel } from "../mock-data";

// Shown at the bottom of every Customer Workspace page in the mockup —
// its own small component since it's identical across all 4 pages rather
// than four copies of the same markup.
export function WorkspaceFooter() {
  return (
    <div className="flex items-center justify-between border-t border-zinc-100 pt-4 text-xs text-zinc-400">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        อัปเดตล่าสุด: {lastUpdatedLabel}
      </span>
      <span>© 2025 ThunderOne Co., Ltd. All rights reserved.</span>
    </div>
  );
}
