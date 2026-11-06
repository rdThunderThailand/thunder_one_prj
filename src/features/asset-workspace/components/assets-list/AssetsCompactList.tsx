import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { EyeIcon, LocationIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { AssetThumbnail } from "../AssetThumbnail";
import type { AssetsTableProps } from "./AssetsTable";
import { AssetsRowDetails, AssetsStatusValue } from "./AssetsRowDetails";

export function AssetsCompactList({ rows, selected, pending, onSelect, onSelectAll }: AssetsTableProps) {
  const count = rows.filter((row) => selected.has(row.id)).length;
  return (
    <div>
      <label className="flex min-h-10 cursor-pointer items-center gap-3 border-b border-border bg-muted px-3 text-xs text-foreground">
        <Checkbox
          aria-label="Select all assets on this page"
          disabled={pending || !rows.length}
          checked={count === 0 ? false : count === rows.length ? true : "indeterminate"}
          onCheckedChange={(checked) => onSelectAll(checked === true)}
        />
        Select this page
      </label>
      <ul aria-label="Assets in this organization" className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.id} className={cn("min-w-0 space-y-2 p-3", selected.has(row.id) && "bg-accent")}>
            <div className="flex min-w-0 items-start gap-3">
              <label className="flex min-h-10 shrink-0 cursor-pointer items-center">
                <span className="sr-only">Select {row.name || "unnamed asset"}</span>
                <Checkbox
                  disabled={pending}
                  checked={selected.has(row.id)}
                  onCheckedChange={(checked) => onSelect(row.id, checked === true)}
                />
              </label>
              <AssetThumbnail src={row.thumbnail_url} className="size-10" />
              <div className="min-w-0 flex-1 space-y-1">
                <Link
                  href={`/asset-workspace/assets/${encodeURIComponent(row.id)}`}
                  className="break-words rounded-control text-sm font-semibold text-foreground hover:text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {row.name || "Unnamed asset"}
                </Link>
                <p className="break-words text-xs text-muted-foreground">{row.asset_code || "—"}</p>
              </div>
              <Button asChild variant="ghost" size="icon" className="shrink-0 max-sm:size-10">
                <Link href={`/asset-workspace/assets/${encodeURIComponent(row.id)}`} aria-label={`View profile for ${row.name || "asset"}`}>
                  <EyeIcon aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <AssetsStatusValue value={row.status} />
              <span className="min-w-0 break-words text-muted-foreground">{row.category_name || "Uncategorized"}</span>
            </div>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <LocationIcon aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
              <span className="min-w-0 break-words">{row.location_name || "—"}</span>
            </p>
            <AssetsRowDetails row={row} />
          </li>
        ))}
      </ul>
    </div>
  );
}
