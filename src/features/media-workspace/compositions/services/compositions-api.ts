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
