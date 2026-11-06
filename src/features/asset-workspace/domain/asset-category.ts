export const CATEGORY_STATUSES = ["Active", "Inactive"] as const;
export const CATEGORY_SORT_KEYS = ["default", "name", "parent", "assets", "status"] as const;
export const CATEGORY_PAGE_SIZES = [10, 25, 50] as const;

export type CategoryStatus = (typeof CATEGORY_STATUSES)[number];
export type CategorySortKey = (typeof CATEGORY_SORT_KEYS)[number];

export interface AssetCategory {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  description: string | null;
  isSerialRequired: boolean;
  status: CategoryStatus;
  ownAssetCount: number;
  assetCount: number;
  childCount: number;
  updatedAt: string;
}

export interface CategoryListQuery {
  q: string;
  status?: CategoryStatus;
  parent?: string;
  sort: CategorySortKey;
  direction: "asc" | "desc";
  page: number;
  pageSize: number;
  expanded: string[];
}

export interface CategoryRow {
  category: AssetCategory;
  depth: number;
  hasChildren: boolean;
}

export type CategoryReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };
