// Presentational blocks extracted from PlaylistsListPage.tsx so that file stays
// inside the 300-line rule. No data-fetching, no side-effects here.

import { CheckCircle2, Clock3, FileEdit, Layers3, ListMusic, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { LibraryEmpty, LibrarySummary } from "../../content-library/LibraryChrome";
import type { EmptyCause } from "../list-empty-state";

export { LibraryRowsSkeleton as ListSkeleton, LibrarySummarySkeleton as SummarySkeleton } from "../../content-library/LibraryChrome";

export function PlaylistsSummary({ stats, items, duration }: { stats: { total: number; draft: number; active: number; inactive: number }; items: number; duration: string }) {
  return (
    <LibrarySummary
      label="Playlist summary"
      cards={[
        { label: "Total Playlists", value: stats.total, detail: "All playlists", icon: ListMusic },
        { label: "Active", value: stats.active, detail: "Ready to publish", icon: CheckCircle2, tone: "text-success bg-success-soft" },
        { label: "Scheduled", value: stats.draft, detail: "Not yet ready", icon: FileEdit, tone: "text-warning bg-warning-soft" },
        { label: "Inactive", value: stats.inactive, detail: "Paused", icon: PauseCircle, tone: "text-muted-foreground bg-muted" },
        { label: "Total Items", value: items, detail: "Across playlists", icon: Layers3 },
        { label: "Total Duration", value: duration, detail: "Across playlists", icon: Clock3 },
      ]}
    />
  );
}

const EMPTY_MESSAGES: Record<EmptyCause, [string, string]> = {
  "no-playlists": ["ยังไม่มี playlist", "กด + Create Playlist เพื่อเริ่มต้น"],
  "no-match": ["ไม่พบ playlist ที่ตรงกับตัวกรอง", "ลองปรับคำค้นหรือตัวกรอง"],
  "trash-empty": ["ถังขยะว่าง", "playlist ที่ย้ายไปถังขยะจะแสดงที่นี่"],
  "folder-empty": ["โฟลเดอร์นี้ยังไม่มี playlist", "เลือกโฟลเดอร์อื่นหรือย้าย playlist มาที่นี่"],
  "tag-empty": ["แท็กนี้ยังไม่มี playlist", "เลือกแท็กอื่น"],
};

/** Empty-state message, with a Clear Filters button for the no-match cause only. */
export function ListEmpty({ cause, onClearFilters }: { cause: EmptyCause; onClearFilters: () => void }) {
  const [title, hint] = EMPTY_MESSAGES[cause];
  return (
    <LibraryEmpty
      title={title}
      hint={hint}
      action={cause === "no-match" ? <Button variant="outline" size="sm" onClick={onClearFilters}>ล้างตัวกรอง</Button> : undefined}
    />
  );
}

/** Error card with a ลองใหม่ retry button, disabled while a retry is in-flight. */
export function ListError({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying: boolean }) {
  return (
    <LibraryEmpty
      tone="danger"
      title={message}
      action={<Button variant="outline" size="sm" disabled={retrying} onClick={onRetry}>{retrying ? "กำลังลองใหม่…" : "ลองใหม่"}</Button>}
    />
  );
}
