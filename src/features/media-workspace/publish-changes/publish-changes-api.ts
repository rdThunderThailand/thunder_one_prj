import { requestApi } from "@/lib/api/media-api";
import { describeActivateError } from "../compositions/status-display";

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

const REASONS: ReadonlyArray<[RegExp, string]> = [
  [/composition is not active/, "Layout ไม่ได้อยู่ในสถานะ Active"],
  [/at least one target/, "ยังไม่ได้เลือก Channel ปลายทาง"],
  [/targets have no screens/, "Channel หรือ Group ปลายทางยังไม่มีจอ"],
  [/quarantin/i, "มีไฟล์ที่ถูกกักกัน (quarantine) อยู่ในเนื้อหา"],
  [/synchronized/, "Channel Group แบบ synchronized ยังไม่ครบ"],
];

/** The bulk RPC names the refused Program as `program "<name>" — <reason>` (ADR 0078 §4). Anything
 *  else reaches the operator as a generic line — never the raw backend text (repo rule). */
export function describePublishChangesError(message: string): { programName: string | null; reason: string } {
  const match = /program "(.+)" — ([\s\S]*)$/.exec(message);
  if (!match) return { programName: null, reason: "Publish ไม่สำเร็จ ยังไม่มีการเปลี่ยนแปลงกับ Program ใดเลย" };
  const [, programName, detail] = match;
  const reason = /unbound/.test(detail)
    ? describeActivateError(detail)
    : (REASONS.find(([pattern]) => pattern.test(detail))?.[1] ?? "ไม่ผ่านเงื่อนไขการ Publish");
  return { programName, reason };
}
