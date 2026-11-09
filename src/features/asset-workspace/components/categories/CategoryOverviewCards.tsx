import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { InfoIcon } from "@/components/ui/icons";
import type { AssetCategoryDetail } from "../../domain/asset-category";
import { categoryAssetsHref, categoryDetailHref } from "../../domain/category-detail";
import { CategoryStatusBadge } from "./CategoryStatusBadge";

const link = "rounded-xs text-accent-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring";
const card = "min-w-0 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none";

function InfoRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] items-start gap-3 border-b border-border py-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 whitespace-pre-wrap break-words font-medium">{children}</dd>
    </div>
  );
}

export function CategoryOverviewCards({ category }: { category: AssetCategoryDetail }) {
  return (
    <div className="grid items-stretch gap-3 @min-3xl/category-detail:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <Card className={card} role="region" aria-labelledby="category-information-title">
        <h2 id="category-information-title" className="text-sm font-semibold">Category Information</h2>
        <dl className="mt-1 text-xs leading-relaxed">
          <InfoRow label="Category Name">{category.name}</InfoRow>
          <InfoRow label="Parent Category">
            {category.parent ? (
              <Link className={link} href={categoryDetailHref(category.parent.id)}>{category.parent.name}</Link>
            ) : <span className="text-muted-foreground">— (Top level)</span>}
          </InfoRow>
          <InfoRow label="Description">{category.description || "—"}</InfoRow>
          <InfoRow label="Status">
            <CategoryStatusBadge status={category.status} />
          </InfoRow>
        </dl>
      </Card>
      <Card className={card} role="region" aria-labelledby="category-rules-title">
        <h2 id="category-rules-title" className="text-sm font-semibold">Category Rules</h2>
        <dl className="mt-1 text-xs leading-relaxed">
          <InfoRow label={
            <span className="inline-flex flex-wrap items-center gap-2">
              Serial Number
              <span title="Whether a serial number is required when registering an asset in this category.">
                <InfoIcon aria-hidden="true" className="size-3.5" />
              </span>
              <span className="sr-only">requirement for new asset registration</span>
            </span>
          }>
            {category.isSerialRequired ? "Required" : "Optional"}
          </InfoRow>
          <InfoRow label="Assets">
            <Link href={categoryAssetsHref(category.id)} className={`${link} tabular-nums`}
              aria-label={`View ${category.assetCount} assets in ${category.name} and its descendants`}>
              {category.assetCount.toLocaleString("en-GB")}
            </Link>
          </InfoRow>
          <InfoRow label="Child Categories">
            <button type="button" className={`${link} cursor-pointer tabular-nums`}
              onClick={() => {
                const section = document.getElementById("category-children-title");
                section?.scrollIntoView({ block: "nearest" });
                section?.focus({ preventScroll: true });
              }}>
              {category.childCount.toLocaleString("en-GB")}
            </button>
          </InfoRow>
        </dl>
      </Card>
    </div>
  );
}
