import { Card } from "@/components/ui/Card";
import { ClipboardIcon } from "@/components/ui/icons";
import { policyCategories } from "../mock-data";

export function PolicyCategoriesCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">หมวดหมู่นโยบาย</h2>
      <ul className="flex flex-col gap-1">
        {policyCategories.map((category) => (
          <li key={category.id}>
            <span
              title="Not built yet"
              className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-600 dark:text-zinc-300"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <ClipboardIcon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate">{category.label}</span>
              <span className="shrink-0 text-xs text-zinc-400">{category.count}</span>
            </span>
          </li>
        ))}
      </ul>
      <span
        title="Not built yet"
        className="flex cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
      >
        ดูหมวดหมู่ทั้งหมด
      </span>
    </Card>
  );
}
