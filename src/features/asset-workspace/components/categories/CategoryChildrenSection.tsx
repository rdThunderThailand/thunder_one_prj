import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/lovable/input";
import { Button } from "@/components/ui/lovable/button";
import { CategoryIcon, ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, SearchIcon } from "@/components/ui/icons";
import type { CategoryChild } from "../../domain/asset-category";
import { categoryAssetsHref, categoryChildrenView, categoryDetailHref, type ChildSort } from "../../domain/category-detail";
import { CategoriesPagination } from "./CategoriesPagination";
import { CategoryStatusBadge } from "./CategoryStatusBadge";

const columns = [
  { key: "name", label: "Category Name", width: "w-[55%]" },
  { key: "assets", label: "Assets", width: "w-[20%]" },
  { key: "status", label: "Status", width: "w-[25%]" },
] as const;
const link = "rounded-xs text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring";

export function CategoryChildrenSection({ categories }: { categories: CategoryChild[] }) {
  const [query, setQuery] = useState({ q: "", page: 1, pageSize: 10, sort: "default" as ChildSort, direction: "asc" as "asc" | "desc" });
  const view = categoryChildrenView(categories, query);

  function sort(key: ChildSort) {
    setQuery((previous) => ({ ...previous, page: 1, sort: key,
      direction: previous.sort === key && previous.direction === "asc" ? "desc" : "asc" }));
  }

  return (
    <Card role="region" aria-labelledby="category-children-title"
      className="@container/categories-results min-w-0 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <h2 id="category-children-title" tabIndex={-1}
          className="rounded-xs text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring">
          Child Categories ({categories.length.toLocaleString("en-GB")})
        </h2>
        <div className="relative w-full @min-xl/categories-results:w-72">
          <label htmlFor="child-category-search" className="sr-only">Search child categories by name</label>
          <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="child-category-search" type="search" value={query.q} placeholder="Search child categories…"
            className="h-9 pl-9 text-sm max-sm:h-10"
            onChange={(event) => setQuery((previous) => ({ ...previous, q: event.target.value, page: 1 }))} />
        </div>
      </div>
      {categories.length === 0 ? (
        <p className="border-t border-border px-4 py-6 text-xs text-muted-foreground">No child categories</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-96 table-fixed border-separate border-spacing-0 text-left text-xs leading-relaxed">
              <caption className="sr-only">Direct child categories with their descendant-inclusive asset counts and status.</caption>
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} scope="col" className={`border-y border-border px-4 py-1 font-semibold ${column.width}`}
                      aria-sort={query.sort === column.key ? query.direction === "asc" ? "ascending" : "descending" : "none"}>
                      <Button variant="ghost" size="sm" className="h-8 max-w-full justify-start gap-2 px-0 text-xs font-semibold"
                        aria-label={`Sort by ${column.label}, ${query.sort === column.key && query.direction === "asc" ? "descending" : "ascending"}`}
                        onClick={() => sort(column.key)}>
                        <span className="whitespace-normal text-left">{column.label}</span>
                        {query.sort === column.key ? (
                          query.direction === "asc" ? <ChevronUpIcon aria-hidden="true" className="size-3 shrink-0" />
                            : <ChevronDownIcon aria-hidden="true" className="size-3 shrink-0" />
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
                {view.rows.map((child) => (
                  <tr key={child.id} className="group h-11 hover:bg-muted/60 focus-within:bg-muted/60">
                    <td className="border-b border-border px-4 py-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <CategoryIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground group-hover:text-accent-foreground group-focus-within:text-accent-foreground" />
                        <Link href={categoryDetailHref(child.id)} className={`${link} min-w-0 break-words py-1 font-semibold`}>{child.name}</Link>
                      </div>
                    </td>
                    <td className="border-b border-border px-4 py-2 tabular-nums">
                      <Link href={categoryAssetsHref(child.id)} className={`${link} inline-flex min-h-8 items-center underline`}
                        aria-label={`View ${child.assetCount} assets in ${child.name} and its descendants`}>
                        {child.assetCount.toLocaleString("en-GB")}
                      </Link>
                    </td>
                    <td className="border-b border-border px-4 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <CategoryStatusBadge status={child.status} />
                        <ChevronRightIcon aria-hidden="true" className="hidden size-3 text-muted-foreground @min-xl/categories-results:block" />
                      </div>
                    </td>
                  </tr>
                ))}
                {view.rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                      No child categories match your search.
                      <Button variant="ghost" size="sm" className="ml-2 text-xs" onClick={() => setQuery((previous) => ({ ...previous, q: "", page: 1 }))}>
                        Clear search
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <CategoriesPagination page={view.page} pageSize={query.pageSize} total={view.total}
            totalPages={view.totalPages} rows={view.rows.length}
            onPage={(page) => setQuery((previous) => ({ ...previous, page }))}
            onPageSize={(pageSize) => setQuery((previous) => ({ ...previous, pageSize, page: 1 }))} />
        </>
      )}
    </Card>
  );
}
