// Tiny stateless JSX atoms shared across the 3 add-person wizards' review/
// summary steps — extracted 2026-09-17 (readability audit) alongside the
// step split. Pure structural move, byte-for-byte what each wizard already
// had as a local component.

export const requiredMark = <span className="text-red-500">*</span>;

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="truncate text-right font-medium text-zinc-900 dark:text-zinc-50">{value || "-"}</span>
    </div>
  );
}

/** Contractor only — jumps back to an earlier step from the review screen. */
export function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
      แก้ไข
    </button>
  );
}
