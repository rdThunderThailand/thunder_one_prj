import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/lovable/button";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

export function AssetEditHeader({ assetId, name }: { assetId?: string; name?: string }) {
  const href = assetId ? `/asset-workspace/assets/${encodeURIComponent(assetId)}` : "/asset-workspace/assets";
  return (
    <div className="min-w-0 space-y-2">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex min-w-0 flex-wrap items-center gap-1">
          <li>
            <Link href="/asset-workspace/assets" className="inline-flex min-h-8 items-center rounded-control text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">Assets</Link>
          </li>
          <li aria-hidden="true">
            <ChevronRightIcon className="size-3" />
          </li>
          <li className="min-w-0 wrap-anywhere">
            <Link href={href} className="inline-flex min-h-8 items-center rounded-control text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">{name || "Asset Profile"}</Link>
          </li>
          <li aria-hidden="true">
            <ChevronRightIcon className="size-3" />
          </li>
          <li aria-current="page" className="font-medium text-foreground">Edit</li>
        </ol>
      </nav>
      <div className="flex items-start gap-3">
        <Button asChild variant="outline" size="icon" className="shrink-0">
          <Link href={href} aria-label="Back to asset profile">
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
          </Link>
        </Button>
        <PageHeader title="Edit Asset" subtitle="Update asset information. Controlled details remain read-only." />
      </div>
    </div>
  );
}
