import { requestApi } from "@/lib/api/media-api";
import type { CompositionDetail, CompositionLibraryItem, CompositionLibraryPage, CompositionListItem, CompositionStatus } from "../types";
import type { SetZonesPayload } from "../zone-bindings";

export async function fetchCompositions(): Promise<CompositionListItem[]> {
  const data = await requestApi<{ data?: CompositionListItem[] } | CompositionListItem[]>(
    "GET",
    "/media/compositions",
  );
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.data)) return data.data;
  return [];
}

export type CompositionLibraryQuery = {
  search?: string;
  status?: CompositionStatus;
  kind?: "template" | "inline";
  folderId?: string;
  uncategorized?: boolean;
  trash?: boolean;
  content?: "complete" | "incomplete";
  usage?: "used" | "unused";
  referenceResolution?: string;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

type CoreLibraryPage = {
  data?: Array<Record<string, unknown>>;
  pagination?: { page: number; pageSize: number; total: number; totalPages: number };
  summary?: CompositionLibraryPage["summary"];
  facets?: { referenceResolutions?: string[] };
};

function mapLibraryItem(raw: Record<string, unknown>): CompositionLibraryItem {
  return {
    id: String(raw.id), name: String(raw.name), layout_id: String(raw.layoutId), layout_name: String(raw.layoutName),
    status: raw.status as CompositionStatus, revision: Number(raw.revision), zone_count: Number(raw.zoneCount), bound_count: Number(raw.boundCount),
    created_at: typeof raw.createdAt === "string" ? raw.createdAt : undefined, updated_at: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    layoutKind: raw.layoutKind === "inline" ? "inline" : "template", referenceResolution: typeof raw.referenceResolution === "string" ? raw.referenceResolution : null,
    folderId: typeof raw.folderId === "string" ? raw.folderId : null, deletedAt: typeof raw.deletedAt === "string" ? raw.deletedAt : null,
    usageCount: Number(raw.usageCount), previewZones: Array.isArray(raw.previewZones) ? raw.previewZones.map((zone) => ({
      position: Number((zone as Record<string, unknown>).position), x: Number((zone as Record<string, unknown>).x), y: Number((zone as Record<string, unknown>).y),
      width: Number((zone as Record<string, unknown>).width), height: Number((zone as Record<string, unknown>).height), firstAssetId: typeof (zone as Record<string, unknown>).firstAssetId === "string" ? (zone as Record<string, unknown>).firstAssetId as string : null,
    })) : [],
  };
}

/** The legacy array adapter deliberately omits summary/facet values: those values must come
 * from Core because collection-scoped counts and current Publication usage cannot be derived
 * correctly from a paged client response. */
export async function fetchCompositionLibrary(queryInput: CompositionLibraryQuery): Promise<CompositionLibraryPage> {
  const query = new URLSearchParams({
    page: String(queryInput.page ?? 1),
    page_size: String(queryInput.pageSize ?? 10),
  });
  if (queryInput.search) query.set("search", queryInput.search);
  if (queryInput.status) query.set("status", queryInput.status);
  if (queryInput.kind) query.set("kind", queryInput.kind);
  if (queryInput.folderId) query.set("folder_id", queryInput.folderId);
  if (queryInput.uncategorized) query.set("uncategorized", "true");
  if (queryInput.trash) query.set("trash", "true");
  if (queryInput.content) query.set("content", queryInput.content);
  if (queryInput.usage) query.set("usage", queryInput.usage);
  if (queryInput.referenceResolution) query.set("reference_resolution", queryInput.referenceResolution);
  if (queryInput.sort) query.set("sort", queryInput.sort);
  if (queryInput.dir) query.set("dir", queryInput.dir);

  const raw = await requestApi<CoreLibraryPage | CompositionLibraryItem[]>("GET", `/media/compositions?${query}`);
  if (Array.isArray(raw)) {
    return { data: raw, pagination: null, summary: null, facets: { referenceResolutions: [] }, isLegacyResponse: true };
  }
  return {
    data: Array.isArray(raw.data) ? raw.data.map(mapLibraryItem) : [],
    pagination: raw.pagination ?? null,
    summary: raw.summary ?? null,
    facets: { referenceResolutions: raw.facets?.referenceResolutions ?? [] },
    isLegacyResponse: !raw.pagination || !raw.summary,
  };
}

export async function fetchComposition(id: string): Promise<CompositionDetail> {
  return requestApi<CompositionDetail>("GET", `/media/compositions/${id}`);
}

export type UpsertCompositionInput = {
  compositionId?: string | null;
  name: string;
  layoutId: string;
  expectedRevision?: number | null;
};

export async function upsertComposition(
  input: UpsertCompositionInput,
): Promise<{ composition_id: string; revision: number; status: CompositionStatus }> {
  const body: Record<string, unknown> = { name: input.name.trim(), layout_id: input.layoutId };
  if (input.expectedRevision != null) body.expected_revision = input.expectedRevision;

  if (input.compositionId) {
    return requestApi("PUT", `/media/compositions/${input.compositionId}`, body);
  }
  return requestApi("POST", "/media/compositions", body);
}

export async function setCompositionZones(
  id: string,
  payload: SetZonesPayload,
  expectedRevision?: number | null,
): Promise<{ composition_id: string; revision: number; bound_count: number }> {
  const body: Record<string, unknown> = { zones: payload.zones };
  if (expectedRevision != null) body.expected_revision = expectedRevision;
  return requestApi("PUT", `/media/compositions/${id}/zones`, body);
}

export async function setCompositionStatus(
  id: string,
  status: CompositionStatus,
): Promise<{ composition_id: string; status: CompositionStatus }> {
  return requestApi("PUT", `/media/compositions/${id}/status`, { status });
}

export async function duplicateComposition(
  sourceId: string,
  name: string,
): Promise<{ compositionId: string }> {
  const { composition_id } = await requestApi<{ composition_id: string }>(
    "POST",
    `/media/compositions/${sourceId}/duplicate`,
    { name: name.trim() },
  );
  return { compositionId: composition_id };
}

export async function forkCompositionLayout(
  compositionId: string,
  expectedRevision?: number | null,
): Promise<{ layout_id: string; revision: number }> {
  const body = expectedRevision != null ? { expected_revision: expectedRevision } : {};
  return requestApi("POST", `/media/compositions/${compositionId}/fork-layout`, body);
}
