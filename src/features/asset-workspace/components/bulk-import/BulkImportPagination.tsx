import { Button } from "@/components/ui/lovable/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/lovable/select";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { formatCount } from "../../domain/asset-import-format";
import type { RowsPage } from "../../domain/asset-import-types";

export function BulkImportPagination({
  data,
  pending,
  onPage,
  onPageSize,
}: {
  data: RowsPage;
  pending: boolean;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const { page, pageSize, total, rows } = data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = [...new Set([1, totalPages, page - 1, page, page + 1])]
    .filter((value) => value > 0 && value <= totalPages)
    .sort((a, b) => a - b);
  const start = rows.length ? (page - 1) * pageSize + 1 : 0;
  const end = rows.length ? Math.min(start + rows.length - 1, total) : 0;

  return (
    <div className="@container/pagination flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-2xs">
      <label className="flex items-center gap-2 text-muted-foreground">
        <span>Rows per page</span>
        <Select
          value={String(pageSize)}
          disabled={pending}
          onValueChange={(value) => onPageSize(Number(value))}
        >
          <SelectTrigger aria-label="Rows per page" className="h-8 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <span className="tabular-nums text-muted-foreground">
          {formatCount(start)}–{formatCount(end)} of {formatCount(total)} rows
        </span>
        <nav aria-label="Import rows pagination" className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Previous page"
            disabled={pending || page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeftIcon className="size-3" />
          </Button>
          {pages.map((value, index) => (
            <span key={value} className="hidden items-center gap-1 @min-lg/pagination:inline-flex">
              {index > 0 && value - pages[index - 1] > 1 && (
                <span className="text-muted-foreground">…</span>
              )}
              <Button
                size="icon-sm"
                variant={value === page ? "secondary" : "ghost"}
                aria-label={`Page ${value}`}
                aria-current={value === page ? "page" : undefined}
                disabled={pending}
                onClick={() => onPage(value)}
              >
                {value}
              </Button>
            </span>
          ))}
          <span className="tabular-nums @min-lg/pagination:hidden">
            {page} / {totalPages}
          </span>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Next page"
            disabled={pending || page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRightIcon className="size-3" />
          </Button>
        </nav>
      </div>
    </div>
  );
}
