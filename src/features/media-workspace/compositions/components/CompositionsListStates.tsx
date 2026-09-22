// Presentational blocks extracted from CompositionsListPage.tsx so that file stays inside
// the 300-line rule. No data-fetching, no side-effects here.

import { AlertCircle, LayoutTemplate, PencilRuler, SquareStack } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { LibraryEmpty, LibrarySummary } from "../../content-library/LibraryChrome";

export { LibraryRowsSkeleton as ListSkeleton, LibrarySummarySkeleton as SummarySkeleton } from "../../content-library/LibraryChrome";

export type EmptyCause = "no-compositions" | "no-match";

const EMPTY_MESSAGES: Record<EmptyCause, [string, string]> = {
  "no-compositions": ["ยังไม่มี Layout", "กด + New Layout เพื่อเริ่มต้น"],
  "no-match": ["ไม่พบ Layout ที่ตรงกับตัวกรอง", "ลองปรับคำค้นหรือตัวกรอง"],
};

export function CompositionsSummary({ summary, onNeedsContent }: {
  summary: { total: number; templateBased: number; custom: number; needsContent: number };
  onNeedsContent: () => void;
}) {
  return (
    <LibrarySummary
      label="Layout summary"
      cards={[
        { label: "Total Layouts", value: summary.total, detail: "All layouts", icon: SquareStack },
        { label: "Template-based", value: summary.templateBased, detail: "From a template", icon: LayoutTemplate },
        { label: "Custom", value: summary.custom, detail: "Built from scratch", icon: PencilRuler },
        { label: "Needs content", value: summary.needsContent, detail: "Click to filter", icon: AlertCircle, tone: "text-warning bg-warning-soft", onClick: onNeedsContent },
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
