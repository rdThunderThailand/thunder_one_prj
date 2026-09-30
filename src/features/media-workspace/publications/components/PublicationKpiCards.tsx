import type { PublicationsPage } from "../types";

// Paused is not a Program state (no pause/resume exists) and there is no previous period to
// compare, so neither the card nor a % change is shown (plan §2).
const CARDS = [
  { key: "live", label: "Live" },
  { key: "publishing", label: "Publishing" },
  { key: "scheduled", label: "Scheduled" },
  { key: "draft", label: "Draft" },
] as const;

export function PublicationKpiCards({ counts }: { counts: PublicationsPage["counts_by_status"] | null }) {
  const total = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : null;
  const cells = [{ key: "total", label: "Total", value: total }, ...CARDS.map((c) => ({ ...c, value: counts ? counts[c.key] : null }))];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cells.map((cell) => (
        <div
          key={cell.key}
          className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4"
        >
          <span className="text-xs text-muted-foreground">{cell.label}</span>
          <span className="text-2xl font-semibold text-foreground">{cell.value ?? "—"}</span>
          <span className="text-xs text-muted-foreground">Programs</span>
        </div>
      ))}
    </div>
  );
}
