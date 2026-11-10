import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/lovable/button";
import { CategoryIcon, EditIcon } from "@/components/ui/icons";
import type { AssetCategoryDetail, CategoryStatus } from "../../domain/asset-category";
import { CategoryStatusBadge } from "./CategoryStatusBadge";
import { CategoryStatusActions } from "./CategoryStatusActions";
import { categoryAssetsHref, categoryDetailHref } from "../../domain/category-detail";
import { CategoryRegistrationButton } from "./CategoryRegistrationButton";

export function CategoryDetailHeader({ category, busy, sending, onStatus, showSummary = false }: {
  category: AssetCategoryDetail;
  busy: boolean;
  sending: boolean;
  onStatus: (status: CategoryStatus) => Promise<void>;
  showSummary?: boolean;
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
        {category.parent && !showSummary && (
          <p className="text-xs text-muted-foreground">
            Parent: {" "}
            <Link href={`/asset-workspace/categories/${encodeURIComponent(category.parent.id)}`}
              className="rounded-xs text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
              {category.parent.name}
            </Link>
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CategoryRegistrationButton id={category.id} status={category.status} busy={busy} />
        <Button asChild variant="outline" size="sm" className="border-primary text-accent-foreground hover:border-accent-foreground hover:bg-accent max-sm:h-10">
          <Link href={`/asset-workspace/categories/${encodeURIComponent(category.id)}/edit`}>
            <EditIcon aria-hidden="true" className="size-4" />
            Edit Category
          </Link>
        </Button>
        <CategoryStatusActions category={category} busy={busy} sending={sending} onChange={onStatus} />
      </div>
      {showSummary && (
        <dl className="grid w-full basis-full gap-3 rounded-control border border-border bg-background p-3 text-xs @min-xl/categories:grid-cols-2 @min-4xl/categories:grid-cols-5">
          <div className="min-w-0 space-y-2">
            <dt className="text-muted-foreground">Parent Category</dt>
            <dd className="break-words font-semibold">
              {category.parent ? <Link href={categoryDetailHref(category.parent.id)} className="rounded-xs text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">{category.parent.name}</Link> : "—"}
            </dd>
          </div>
          <div className="space-y-2">
            <dt className="text-muted-foreground">Child Categories</dt>
            <dd className="font-semibold tabular-nums">{category.childCount.toLocaleString("en-GB")}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-muted-foreground">Assets</dt>
            <dd className="font-semibold tabular-nums">
              <Link href={categoryAssetsHref(category.id)} title="Open in Assets"
                aria-label={`Open ${category.assetCount} assets in ${category.name} and its descendants in the Assets list`}
                className="rounded-xs text-accent-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring">
                {category.assetCount.toLocaleString("en-GB")}
              </Link>
            </dd>
          </div>
          <div className="space-y-2">
            <dt className="text-muted-foreground">Serial Number</dt>
            <dd className="font-semibold">{category.isSerialRequired ? "Required" : "Optional"}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-muted-foreground">Status</dt>
            <dd><CategoryStatusBadge status={category.status} /></dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
