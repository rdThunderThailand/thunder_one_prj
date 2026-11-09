import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/lovable/button";
import { CategoryIcon, EditIcon } from "@/components/ui/icons";
import type { AssetCategoryDetail, CategoryStatus } from "../../domain/asset-category";
import { CategoryStatusBadge } from "./CategoryStatusBadge";
import { CategoryStatusActions } from "./CategoryStatusActions";

export function CategoryDetailHeader({ category, busy, sending, onStatus }: {
  category: AssetCategoryDetail;
  busy: boolean;
  sending: boolean;
  onStatus: (status: CategoryStatus) => Promise<void>;
}) {
  return (
    <Card className="flex flex-wrap items-start gap-4 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <div aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-control bg-accent text-accent-foreground">
        <CategoryIcon className="size-7" />
      </div>
      <div className="min-w-0 flex-1 basis-48 space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="min-w-0 max-w-full break-words text-xl font-extrabold leading-7 tracking-tight">{category.name}</h1>
          <CategoryStatusBadge status={category.status} />
        </div>
        {category.description && <p className="max-w-prose whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">{category.description}</p>}
        {category.parent && (
          <p className="text-xs text-muted-foreground">
            Parent: {" "}
            <Link href={`/asset-workspace/categories/${encodeURIComponent(category.parent.id)}`}
              className="rounded-xs text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
              {category.parent.name}
            </Link>
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild variant="outline" size="sm" className="max-sm:h-10">
          <Link href={`/asset-workspace/categories/${encodeURIComponent(category.id)}/edit`}>
            <EditIcon aria-hidden="true" className="size-4" />
            Edit Category
          </Link>
        </Button>
        <CategoryStatusActions category={category} busy={busy} sending={sending} onChange={onStatus} />
      </div>
    </Card>
  );
}
