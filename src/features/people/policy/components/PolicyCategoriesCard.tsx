import { Card } from "@/components/ui/Card";
import { ClipboardIcon } from "@/components/ui/icons";
import { policyCategories } from "../mock-data";

export function PolicyCategoriesCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-foreground">หมวดหมู่นโยบาย</h2>
      <ul className="flex flex-col gap-1">
        {policyCategories.map((category) => (
          <li key={category.id}>
            <span
              title="Not built yet"
              className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <ClipboardIcon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate">{category.label}</span>
              <span className="shrink-0 text-xs text-t1-gray-400">{category.count}</span>
            </span>
          </li>
        ))}
      </ul>
      <span
        title="Not built yet"
        className="flex cursor-not-allowed items-center justify-center rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground"
      >
        ดูหมวดหมู่ทั้งหมด
      </span>
    </Card>
  );
}
