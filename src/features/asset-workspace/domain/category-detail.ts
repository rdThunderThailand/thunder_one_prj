import type { CategoryChild } from "./asset-category.ts";

export const categoryDetailHref = (id: string) => `/asset-workspace/categories/${encodeURIComponent(id)}`;
export const categoryRegistrationHref = (id: string) => `/asset-workspace/assets/register?${new URLSearchParams({ mode: "single", category_id: id })}`;
export const categoryAssetsHref = (id: string) => `/asset-workspace/assets?${new URLSearchParams({
  category_id: id, include_child_categories: "true",
})}`;

export type ChildSort = "default" | "name" | "assets" | "status";

export function categoryChildrenView(children: CategoryChild[], query: {
  q: string; page: number; pageSize: number; sort: ChildSort; direction: "asc" | "desc";
}) {
  const search = query.q.trim().toLocaleLowerCase();
  const filtered = children.filter((child) => child.name.toLocaleLowerCase().includes(search));
  if (query.sort !== "default") {
    const order = query.direction === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      const compared = query.sort === "assets" ? a.assetCount - b.assetCount
        : query.sort === "status" ? a.status.localeCompare(b.status) : a.name.localeCompare(b.name);
      return compared * order || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    });
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);
  return { page, totalPages, total: filtered.length,
    rows: filtered.slice((page - 1) * query.pageSize, page * query.pageSize) };
}
