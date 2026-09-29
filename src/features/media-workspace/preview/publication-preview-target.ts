import type { PublicationDetail } from "@/features/media-workspace/publications/types";

export function publicationPreviewTarget(detail: PublicationDetail): { kind: "composition" | "playlist"; id: string } | null {
  if (detail.composition?.id) return { kind: "composition", id: detail.composition.id };
  if (detail.publication_type === "playlist" && detail.playlist?.id) return { kind: "playlist", id: detail.playlist.id };
  return null;
}
