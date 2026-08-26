import { requestApi } from "@/lib/api/media-api";
import type { CompositionDetail, CompositionListItem, CompositionStatus } from "../types";
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

/** There is no duplicate endpoint — the copy is composed from a read plus an upsert, following
 *  `duplicateLayout`'s precedent. Bindings are not copied: a fresh Composition starts unbound,
 *  matching the "draft may be saved incomplete" rule (ADR 0049 §6). */
export async function duplicateComposition(
  sourceId: string,
  name: string,
): Promise<{ compositionId: string }> {
  const source = await fetchComposition(sourceId);
  const { composition_id } = await upsertComposition({ name, layoutId: source.layout_id });
  return { compositionId: composition_id };
}
