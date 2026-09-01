import { Button } from "@/components/ui/Button";
import { PlusIcon, UploadIcon } from "@/components/ui/icons";

// Export/Import stay inert (no backend) — "เพิ่มบุคลากร" is real, opening
// AddPersonModal (see PersonnelPage).
export function PersonnelHeader({ onAddPerson }: { onAddPerson: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">บุคลากร</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">รายชื่อบุคลากรทั้งหมดในองค์กร</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <UploadIcon className="h-4 w-4 rotate-180" />
          Export
        </span>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <UploadIcon className="h-4 w-4" />
          นำเข้า (Import)
        </span>
        <Button variant="primary" onClick={onAddPerson}>
          <PlusIcon className="h-4 w-4" />
          เพิ่มบุคลากร
        </Button>
      </div>
    </div>
  );
}
