// Tiny stateless JSX atoms shared across the 3 add-person wizards' review/
// summary steps — extracted 2026-09-17 (readability audit) alongside the
// step split. Pure structural move, byte-for-byte what each wizard already
// had as a local component.

export const requiredMark = <span className="text-error">*</span>;

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-t1-gray-400">{label}</span>
      <span className="truncate text-right font-medium text-foreground">{value || "-"}</span>
    </div>
  );
}

/** Contractor only — jumps back to an earlier step from the review screen. */
export function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-xs font-medium text-primary hover:underline">
      แก้ไข
    </button>
  );
}
