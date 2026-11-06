import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { CategoryIcon, ChevronDownIcon, ChevronRightIcon, ChevronUpIcon } from "@/components/ui/icons";
import type { CategoryListQuery, CategoryRow, CategorySortKey } from "../../domain/asset-category";
import { CategoryStatusBadge } from "./CategoryStatusBadge";

const number = new Intl.NumberFormat("en-GB");
const categoryHref = (id: string) => `/asset-workspace/categories/${encodeURIComponent(id)}`;

export function CategoriesTable({ rows, query, onSort, onToggle }: {
  rows: CategoryRow[];
  query: CategoryListQuery;
  onSort: (key: CategorySortKey) => void;
  onToggle: (id: string) => void;
}) {
  const columns: { key: CategorySortKey; label: string; className?: string }[] = [
    { key: "name", label: "Category Name" },
    { key: "parent", label: "Parent Category", className: "hidden @min-2xl/categories-results:w-[28%] @min-2xl/categories-results:table-cell" },
    { key: "assets", label: "Assets", className: "w-20 @min-2xl/categories-results:w-[16%]" },
    { key: "status", label: "Status", className: "w-24 @min-2xl/categories-results:w-[16%]" },
  ];
  const link = "rounded-xs text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring";

  return (
    <table className="w-full min-w-96 table-fixed border-separate border-spacing-0 text-left text-xs leading-relaxed">
      <caption className="sr-only">Categories, their parents, rolled-up asset counts, and availability.</caption>
      <thead data-category-controls className="sticky top-0 z-10 bg-muted text-2xs text-muted-foreground">
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={`h-10 border-b border-border px-3 py-1 font-semibold ${column.className ?? ""}`}
              aria-sort={query.sort === column.key ? query.direction === "asc" ? "ascending" : "descending" : "none"}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-8 max-w-full justify-start gap-2 px-0 text-2xs font-semibold text-muted-foreground"
                aria-label={`Sort by ${column.label}, ${query.sort === column.key && query.direction === "asc" ? "descending" : "ascending"}`}
                onClick={() => onSort(column.key)}
              >
                <span className="whitespace-normal text-left">{column.label}</span>
                {query.sort === column.key ? (query.direction === "asc"
                  ? <ChevronUpIcon aria-hidden="true" className="size-3 shrink-0 text-accent-foreground" />
                  : <ChevronDownIcon aria-hidden="true" className="size-3 shrink-0 text-accent-foreground" />
                ) : (
                  <span aria-hidden="true" className="flex shrink-0 flex-col -space-y-1">
                    <ChevronUpIcon className="size-2.5" />
                    <ChevronDownIcon className="size-2.5" />
                  </span>
                )}
              </Button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ category, depth, hasChildren }) => (
          <tr key={category.id} className="group h-11 transition-colors duration-200 hover:bg-muted/60 focus-within:bg-muted/60 motion-reduce:transition-none">
            <td className="relative border-b border-border px-3 py-2 align-middle">
              {depth > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 border-l border-border"
                  style={{ left: 24 + (Math.min(depth, 4) - 1) * 12 }}
                />
              )}
              <div className="relative flex min-w-0 items-center gap-2" style={{ paddingInlineStart: Math.min(depth, 4) * 12 }}>
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 shrink-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground max-sm:size-10"
                    aria-label={`${query.expanded.includes(category.id) ? "Collapse" : "Expand"} ${category.name}`}
                    aria-expanded={query.expanded.includes(category.id)}
                    onClick={() => onToggle(category.id)}
                  >
                    {query.expanded.includes(category.id)
                      ? <ChevronDownIcon aria-hidden="true" className="size-3" />
                      : <ChevronRightIcon aria-hidden="true" className="size-3" />}
                  </Button>
                ) : (
                  <span aria-hidden="true" className="w-7 shrink-0 max-sm:w-10" />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex min-h-7 items-center gap-2">
                    <CategoryIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent-foreground max-sm:hidden" />
                    <Link href={categoryHref(category.id)} className={`${link} min-w-0 py-1 font-semibold wrap-anywhere`}>
                      <span className="sr-only">Level {depth + 1}: </span>
                      {category.name}
                    </Link>
                  </div>
                  <p className="text-2xs text-muted-foreground @min-2xl/categories-results:hidden">
                    {category.parent ? (
                      <>
                        Parent: {" "}
                        <Link href={categoryHref(category.parent.id)} className={`${link} wrap-anywhere`}>
                          {category.parent.name}
                        </Link>
                      </>
                    ) : "Top level"}
                  </p>
                </div>
              </div>
            </td>
            <td className="hidden border-b border-border px-3 py-2 align-middle @min-2xl/categories-results:table-cell">
              {category.parent ? (
                <Link href={categoryHref(category.parent.id)} className={`${link} wrap-anywhere`}>
                  {category.parent.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
            <td className="border-b border-border px-3 py-2 align-middle tabular-nums">
              {category.assetCount > 0 ? (
                <Link
                  href={`/asset-workspace/assets?category_id=${encodeURIComponent(category.id)}&include_child_categories=true`}
                  className={`${link} font-medium underline decoration-accent-foreground/40 wrap-anywhere hover:decoration-accent-foreground`}
                  aria-label={`${number.format(category.assetCount)} assets in ${category.name} and its child categories`}
                >
                  {number.format(category.assetCount)}
                </Link>
              ) : "0"}
            </td>
            <td className="border-b border-border px-3 py-2 align-middle">
              <CategoryStatusBadge status={category.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
