// Presentational blocks extracted from LayoutsListPage.tsx so that file stays inside the
// 300-line rule. No data-fetching, no side-effects here.

import { CheckCircle2, LayoutTemplate, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { LibraryEmpty, LibrarySummary } from "../../content-library/LibraryChrome";

export { LibraryRowsSkeleton as ListSkeleton, LibrarySummarySkeleton as SummarySkeleton } from "../../content-library/LibraryChrome";

export type EmptyCause = "no-layouts" | "no-match";

const EMPTY_MESSAGES: Record<EmptyCause, [string, string]> = {
  "no-layouts": ["ยังไม่มี Template", "กด + New Template เพื่อเริ่มต้น"],
  "no-match": ["ไม่พบ Template ที่ตรงกับตัวกรอง", "ลองปรับคำค้นหรือตัวกรอง"],
};

export function LayoutsSummary({ stats }: { stats: { total: number; active: number; inactive: number } }) {
  return (
    <LibrarySummary
      label="Template summary"
      cards={[
        { label: "Total Templates", value: stats.total, detail: "All templates", icon: LayoutTemplate },
        { label: "Active", value: stats.active, detail: "Available to layouts", icon: CheckCircle2, tone: "text-success bg-success-soft" },
        { label: "Inactive", value: stats.inactive, detail: "Archived", icon: PauseCircle, tone: "text-muted-foreground bg-muted" },
      ]}
    />
  );
}

export function ListEmpty({ cause, onClearFilters }: { cause: EmptyCause; onClearFilters: () => void }) {
  const [title, hint] = EMPTY_MESSAGES[cause];
  return <LibraryEmpty title={title} hint={hint} action={cause === "no-match" ? <Button variant="outline" size="sm" onClick={onClearFilters}>ล้างตัวกรอง</Button> : undefined} />;
}

export function ListError({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying: boolean }) {
  return <LibraryEmpty tone="danger" title={message} action={<Button variant="outline" size="sm" disabled={retrying} onClick={onRetry}>{retrying ? "กำลังลองใหม่…" : "ลองใหม่"}</Button>} />;
}
