import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { CATEGORY_PAGE_SIZES } from "../../domain/asset-category";

export function CategoriesPagination({ page, pageSize, total, totalPages, rows, onPage, onPageSize }: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  rows: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((value) => value >= 1 && value <= totalPages).sort((left, right) => left - right);
  const start = rows ? (page - 1) * pageSize + 1 : 0;

  return (
    <footer data-category-controls className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 text-xs">
      <p role="status" className="tabular-nums text-muted-foreground">
        Showing {start}–{rows ? start + rows - 1 : 0} of {total.toLocaleString("en-GB")} visible categories
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="Categories pages" className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" className="max-sm:size-10" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            <ChevronLeftIcon aria-hidden="true" className="size-3" />
          </Button>
          {pages.map((value, index) => (
            <span key={value} className="hidden items-center gap-1 @min-2xl/categories-results:inline-flex">
              {index > 0 && value - pages[index - 1] > 1 && (
                <span aria-hidden="true" className="px-1 text-muted-foreground">…</span>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Page ${value}`}
                aria-current={value === page ? "page" : undefined}
                className={value === page ? "bg-accent text-accent-foreground" : undefined}
                onClick={() => onPage(value)}
              >
                {value}
              </Button>
            </span>
          ))}
          <span className="tabular-nums @min-2xl/categories-results:hidden">
            {page} / {totalPages}
          </span>
          <Button variant="ghost" size="icon-sm" className="max-sm:size-10" aria-label="Next page" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
            <ChevronRightIcon aria-hidden="true" className="size-3" />
          </Button>
        </nav>
        <Select value={String(pageSize)} onValueChange={(value) => onPageSize(Number(value))}>
          <SelectTrigger aria-label="Categories per page" className="h-8 w-28 text-xs max-sm:h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </footer>
  );
}
