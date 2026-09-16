import { Button } from "@/components/ui/Button";
import { ChevronDownIcon, PlusIcon, UploadIcon } from "@/components/ui/icons";

export function PolicyHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">นโยบาย</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          ศูนย์รวมนโยบายบริษัท ระเบียบปฏิบัติ และแนวทางการทำงาน
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <UploadIcon className="h-4 w-4 rotate-180" />
          Export
        </span>
        <Button variant="primary" title="Not built yet" disabled>
          <PlusIcon className="h-4 w-4" />
          สร้างนโยบายใหม่
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
