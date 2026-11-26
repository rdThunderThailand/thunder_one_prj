import { requestApi } from "@/lib/api/media-api";

export type ChangesKind = "playlists" | "compositions";

export type AffectedProgram = {
  id: string;
  name: string;
  status: "active" | "scheduled";
  startsAt: string | null;
  endsAt: string | null;
  channelCount: number;
  /** Set for a Program that reaches a Playlist through a Layout Zone (ADR 0078 §3). */
  viaComposition: { id: string; name: string } | null;
};

export type AffectedPrograms = { programs: AffectedProgram[]; programCount: number; channelCount: number };
export type PublishChangesResult = { programCount: number; channelCount: number };

export function fetchAffectedPrograms(kind: ChangesKind, id: string): Promise<AffectedPrograms> {
  return requestApi("GET", `/media/${kind}/${id}/affected-programs`);
}

export function publishChanges(kind: ChangesKind, id: string): Promise<PublishChangesResult> {
  return requestApi("POST", `/media/${kind}/${id}/publish-changes`);
}
