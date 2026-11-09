import type { AssetCategory, CategoryListQuery, CategoryRow } from "./asset-category.ts";

const names = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/** Keep Core's rolled-up counts intact; pagination counts rendered category rows. */
export function categoryListView(categories: readonly AssetCategory[], query: CategoryListQuery) {
  const positions = new Map(categories.map((category, index) => [category.id, index]));
  const byId = new Map(categories.map((category) => [category.id, category]));
  const children = new Map<string, AssetCategory[]>();
  const roots: AssetCategory[] = [];

  for (const category of categories) {
    if (!category.parentId || !byId.has(category.parentId) || category.parentId === category.id) {
      roots.push(category);
    } else {
      const siblings = children.get(category.parentId) ?? [];
      siblings.push(category);
      children.set(category.parentId, siblings);
    }
  }

  function compare(left: AssetCategory, right: AssetCategory) {
    const order = query.sort === "name" ? names.compare(left.name, right.name)
      : query.sort === "parent" ? names.compare(left.parent?.name ?? "", right.parent?.name ?? "")
        : query.sort === "assets" ? left.assetCount - right.assetCount
          : query.sort === "status" ? names.compare(left.status, right.status) : 0;
    return (query.direction === "desc" ? -order : order)
      || (positions.get(left.id)! - positions.get(right.id)!);
  }

  const filtered = Boolean(query.q || query.status || query.parent);
  const rows: CategoryRow[] = [];
  const expanded = new Set(query.expanded);
  const seen = new Set<string>();

  function visit(category: AssetCategory, depth: number) {
    if (seen.has(category.id)) return;
    seen.add(category.id);
    const descendants = children.get(category.id) ?? [];
    rows.push({ category, depth, hasChildren: descendants.length > 0 });
    if (expanded.has(category.id)) {
      for (const child of [...descendants].sort(compare)) visit(child, depth + 1);
    }
  }

  if (filtered) {
    const search = query.q.toLocaleLowerCase();
    for (const category of [...categories].sort(compare)) {
      const parentMatches = !query.parent || (query.parent === "top-level"
        ? category.parentId === null : category.parentId === query.parent);
      if (category.name.toLocaleLowerCase().includes(search)
        && (!query.status || category.status === query.status) && parentMatches) {
        rows.push({ category, depth: 0, hasChildren: false });
      }
    }
  } else {
    for (const root of [...roots].sort(compare)) visit(root, 0);
    // Core forbids cycles. Keep malformed isolated cycles finite and visible if one is returned.
    const reachable = new Set<string>();
    function mark(category: AssetCategory) {
      if (reachable.has(category.id)) return;
      reachable.add(category.id);
      for (const child of children.get(category.id) ?? []) mark(child);
    }
    for (const root of roots) mark(root);
    for (const category of [...categories].sort(compare)) {
      if (!reachable.has(category.id)) { visit(category, 0); mark(category); }
    }
  }

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, totalPages);
  return {
    rows: rows.slice((page - 1) * query.pageSize, page * query.pageSize),
    total, totalPages, page, pageSize: query.pageSize, filtered,
    parentOptions: categories.filter((category) => category.childCount > 0)
      .sort((left, right) => names.compare(left.name, right.name)),
  };
}
