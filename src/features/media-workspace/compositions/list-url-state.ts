import { COMPOSITION_STATUSES, type CompositionStatus } from "./types/index.ts";

export const PER_PAGE_OPTIONS = [10, 25, 50] as const;
export const SORT_KEYS = ["updated", "name", "status", "usage"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type Collection = "all" | "uncategorized" | "trash" | string;

export type ListFilters = {
  query: string;
  status: CompositionStatus | "all";
  kind: "all" | "template" | "inline";
  content: "all" | "complete" | "incomplete";
  usage: "all" | "used" | "unused";
  referenceResolution: string;
};

export type ListState = {
  collection: Collection;
  filters: ListFilters;
  sort: { key: SortKey; dir: "asc" | "desc" };
  page: number;
  perPage: number;
};

export const DEFAULT_STATE: ListState = {
  collection: "all",
  filters: { query: "", status: "all", kind: "all", content: "all", usage: "all", referenceResolution: "" },
  sort: { key: "updated", dir: "desc" },
  page: 1,
  perPage: 10,
};

function oneOf<T extends string>(values: readonly T[], raw: string | null): T | null {
  return values.includes(raw as T) ? (raw as T) : null;
}

export function readListState(params: URLSearchParams): ListState {
  const collectionRaw = params.get("collection");
  const collection = collectionRaw === "uncategorized" || collectionRaw === "trash" || collectionRaw === null ? collectionRaw ?? "all" : collectionRaw;
  const status = oneOf<CompositionStatus>(COMPOSITION_STATUSES, params.get("status")) ?? "all";
  const kind = oneOf(["template", "inline"] as const, params.get("kind")) ?? "all";
  const content = oneOf(["complete", "incomplete"] as const, params.get("content")) ?? "all";
  const usage = oneOf(["used", "unused"] as const, params.get("usage")) ?? "all";
  const sortKey = oneOf<SortKey>(SORT_KEYS, params.get("sort")) ?? DEFAULT_STATE.sort.key;
  const dir = oneOf(["asc", "desc"] as const, params.get("dir")) ?? DEFAULT_STATE.sort.dir;
  const pageRaw = Number.parseInt(params.get("page") ?? "", 10);
  const perRaw = Number.parseInt(params.get("per") ?? "", 10);

  return {
    collection,
    filters: { query: params.get("q") ?? "", status, kind, content, usage, referenceResolution: params.get("reference_resolution") ?? "" },
    sort: { key: sortKey, dir },
    page: Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1,
    perPage: (PER_PAGE_OPTIONS as readonly number[]).includes(perRaw) ? perRaw : DEFAULT_STATE.perPage,
  };
}

export function writeListState(state: ListState): string {
  const params = new URLSearchParams();
  if (state.collection !== "all") params.set("collection", state.collection);
  if (state.filters.query) params.set("q", state.filters.query);
  if (state.filters.status !== "all") params.set("status", state.filters.status);
  if (state.filters.kind !== "all") params.set("kind", state.filters.kind);
  if (state.filters.content !== "all") params.set("content", state.filters.content);
  if (state.filters.usage !== "all") params.set("usage", state.filters.usage);
  if (state.filters.referenceResolution) params.set("reference_resolution", state.filters.referenceResolution);
  if (state.sort.key !== DEFAULT_STATE.sort.key || state.sort.dir !== DEFAULT_STATE.sort.dir) {
    params.set("sort", state.sort.key);
    params.set("dir", state.sort.dir);
  }
  if (state.page !== 1) params.set("page", String(state.page));
  if (state.perPage !== DEFAULT_STATE.perPage) params.set("per", String(state.perPage));
  return params.toString();
}
