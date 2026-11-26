/**
 * ADR 0126: the one table that turns what Core refuses into Thai text. Core sends no error code,
 * only `{error: "<prefix> <message>"}`, and `callMedia` forwards only the six prefixes below, so
 * every rule is bound to one of them. `classifyApiError` is the only caller.
 *
 * Order matters: the first rule that matches wins, and `publish-cause.ts` (ADR 0114) is consulted
 * only after the whole table, so a rule here beats a publish cause on the same text.
 */
import type { ApiErrorKind } from "./api-error.ts";
import { classifyPublishCause, inactiveChannelMessage, type PublishCause } from "./publish-cause.ts";

export const REFUSAL_PREFIXES = [
  "Invalid input: ",
  "not found: ",
  "Already exists: ",
  "Already in use: ",
  "Already modified: ",
  "Already active: ",
] as const;
export type RefusalPrefix = (typeof REFUSAL_PREFIXES)[number];

/** Only where a caller does something other than show `message` (ADR 0126 §4). */
export type RefusalReason = "duplicate-name" | "needs-confirm" | "stale-draft" | "program-refused" | "in-use";

/** The tag `media_core.publication_error_tag` puts on a Program edit refusal. */
export type ProgramPart = "details" | "content" | "targets" | "schedule" | "publish";

export interface RefusalResult {
  kind: ApiErrorKind;
  message: string;
  reason?: RefusalReason;
  cause?: PublishCause;
  names?: string[];
}

export interface RefusalRule {
  prefix: RefusalPrefix;
  /** Tested on the text after the prefix, with any leading `[part]` tags removed. */
  match: RegExp;
  /** Applies only to a refusal carrying this tag (a Core text raised by several RPCs). */
  part?: ProgramPart;
  build: (found: RegExpExecArray) => RefusalResult;
}

const PART_TAG = /\[(details|content|targets|schedule|publish)\]/;
const ALL_PART_TAGS = /\[(?:details|content|targets|schedule|publish)\]\s*/g;
const LEADING_PART_TAGS = /^(?:\[(?:details|content|targets|schedule|publish)\]\s*)+/;
const PROGRAM_WRAPPER = /^Invalid input: program "(.+)" — ([\s\S]*)$/;

const CONFLICT_MESSAGE = "ข้อมูลถูกแก้ไขจากที่อื่นระหว่างที่คุณทำงานอยู่ กรุณาโหลดหน้านี้ใหม่ก่อนบันทึกอีกครั้ง";
const NO_CONTENT_MESSAGE = "ยังไม่ได้เลือกเนื้อหา หรือเนื้อหาที่เลือกถูกลบไปแล้ว กรุณาเลือกเนื้อหาใหม่";
const rejected = (message: string, extra: Partial<RefusalResult> = {}): RefusalResult => ({ kind: "rejected", message, ...extra });

export const CORE_REFUSAL_RULES: readonly RefusalRule[] = [
  // `Already active:` means the first attempt won, so it is not a failure (ADR 0126 §6).
  {
    prefix: "Already active: ",
    match: /^publication is not a draft/,
    build: () => ({ kind: "already-active", message: "Program นี้ไม่ได้อยู่ในสถานะ Draft แล้ว กรุณาโหลดหน้านี้ใหม่" }),
  },
  {
    prefix: "Already active: ",
    match: /^channel is already active/,
    build: () => ({ kind: "already-active", message: "Channel นี้เปิดใช้งานอยู่แล้ว กรุณาโหลดหน้านี้ใหม่" }),
  },

  // Revision conflicts (ADR 0003): matched on the prefix, not on the shared 409 bucket.
  {
    prefix: "Already modified: ",
    match: /^composition was changed elsewhere/,
    build: () => ({ kind: "conflict", message: "Layout นี้ถูกแก้ไขจากที่อื่น กรุณาโหลดใหม่แล้วลองอีกครั้ง" }),
  },
  { prefix: "Already modified: ", match: /./, build: () => ({ kind: "conflict", message: CONFLICT_MESSAGE }) },

  // Name collisions. The two `layouts`/`compositions` texts are told apart by Core's own noun.
  {
    prefix: "Already exists: ",
    match: /^a layout named /,
    build: () => rejected("มี Template ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น", { reason: "duplicate-name" }),
  },
  {
    prefix: "Already exists: ",
    match: /^a composition named /,
    build: () => rejected("มี Layout ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น", { reason: "duplicate-name" }),
  },
  {
    prefix: "Already exists: ",
    match: /^no free name for restored composition /,
    build: () => rejected("กู้คืน Layout ไม่ได้ เพราะไม่มีชื่อว่าง กรุณาเปลี่ยนชื่อ Layout ที่ชื่อซ้ำก่อน"),
  },
  {
    prefix: "Already exists: ",
    match: /^a channel named /,
    build: () => rejected("มี Channel ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น", { reason: "duplicate-name" }),
  },
  {
    prefix: "Already exists: ",
    match: /^a channel group named /,
    build: () => rejected("มี Channel Group ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น", { reason: "duplicate-name" }),
  },

  // Channels and Channel Groups (ADR 0074, 0122). The `cannot remove` rule must stay ahead of any
  // looser "target this channel" match; the delete and deactivate refusals share one verb-free line.
  {
    prefix: "Already in use: ",
    match: /^cannot remove .+ while these publications target this channel/,
    build: () => rejected("เปลี่ยน Player ไม่ได้ เพราะยังมี Program ที่ Active หรือกำหนดเวลาไว้ใช้ Channel นี้อยู่"),
  },
  {
    prefix: "Invalid input: ",
    match: /confirm to continue/,
    build: () =>
      rejected("ข้อมูลการแสดงผลของ Player เปลี่ยนไป กรุณารีเฟรชรายการ Player ตรวจสอบคำเตือน แล้วยืนยันอีกครั้ง", {
        reason: "needs-confirm",
      }),
  },
  {
    prefix: "Invalid input: ",
    match: /^remove this channel from its groups before deleting: (.+)$/,
    build: (found) => rejected(`ลบ Channel นี้ไม่ได้ — ยังอยู่ใน Group: ${found[1]} กรุณานำออกจาก Group ก่อน`),
  },
  {
    prefix: "Already in use: ",
    match: /^these publications still target this channel: (.+)$/,
    build: (found) =>
      rejected(`ยังมี Program ใช้ Channel นี้อยู่: ${found[1]} กรุณายกเลิกหรือย้าย Program เหล่านี้ก่อน`, { reason: "in-use" }),
  },
  {
    prefix: "Already in use: ",
    match: /^this channel has Program or playback history and cannot be deleted yet/,
    build: () => rejected("ลบ Channel นี้ไม่ได้ เพราะมีประวัติ Program หรือการเล่นอยู่ กรุณาปิดใช้งานแทน"),
  },
  {
    prefix: "Already in use: ",
    match: /^remove this group from these publications first: (.+)$/,
    build: (found) =>
      rejected(`Group นี้ยังถูกใช้ใน Program: ${found[1]} กรุณายกเลิกหรือย้าย Program เหล่านี้ก่อนลบ`, { reason: "in-use" }),
  },
  {
    // One partial unique index (ADR 0074 §5) behind five raises in three RPCs.
    prefix: "Invalid input: ",
    match: /already synchronized elsewhere|already in another synchronized group|only one synchronized group/,
    build: () => rejected("Channel หนึ่งอยู่ใน Group แบบ Synchronized ได้เพียง Group เดียว กรุณานำออกจาก Group เดิมก่อน"),
  },

  // Program edit. Both set_zones and update_published refusals must sit ahead of `classifyPublishCause`,
  // whose `/zone\(s\) .+ are unbound/` and `[schedule] end time is in the past` would claim them.
  {
    prefix: "Invalid input: ",
    match: /^cannot leave an active composition incomplete — zone\(s\) (.+) are unbound/,
    build: (found) => rejected(`บันทึกไม่ได้ — Layout ที่ Active อยู่ต้องผูก Content ให้ครบทุก Zone ยังไม่ได้ผูก: ${found[1].trim()}`),
  },
  {
    prefix: "Invalid input: ",
    match: /^end time is in the past — use End program/,
    build: () => rejected("วันสิ้นสุดผ่านไปแล้ว กรุณาใช้ End program แทนการแก้ไขวันสิ้นสุด"),
  },
  {
    prefix: "Invalid input: ",
    match: /^only draft publications can be edited/,
    build: () => rejected("Program นี้ไม่ใช่ Draft แล้ว จึงแก้ไขในหน้านี้ไม่ได้ กรุณาโหลดหน้านี้ใหม่", { reason: "stale-draft" }),
  },
  {
    prefix: "not found: ",
    match: /^publication not found for this tenant/,
    build: () => ({
      kind: "not-found",
      message: "ไม่พบเนื้อหานี้ อาจถูกลบไปแล้วหรือลิงก์ไม่ถูกต้อง",
      reason: "stale-draft",
    }),
  },
  {
    prefix: "Invalid input: ",
    match: /^html and dynamic content cannot be edited here/,
    build: () => rejected("Program ประเภท HTML หรือ Dynamic แก้ไขเนื้อหาในหน้านี้ไม่ได้"),
  },
  {
    prefix: "Invalid input: ",
    match: /^at least one media asset is required/,
    build: () => rejected("ยังไม่ได้เลือกสื่อ กรุณาเลือกสื่ออย่างน้อย 1 รายการ"),
  },
  {
    prefix: "not found: ",
    match: /^playlist not found for this tenant/,
    part: "content",
    build: () => ({ kind: "not-found", message: NO_CONTENT_MESSAGE, cause: "no-content" }),
  },
  {
    prefix: "not found: ",
    match: /^screen \S+ not found for this tenant/,
    part: "targets",
    build: () => ({ kind: "not-found", message: "ไม่พบจอที่เลือก อาจถูกลบไปแล้ว กรุณาเลือกปลายทางใหม่" }),
  },
  {
    prefix: "Invalid input: ",
    match: /^duplicate target — /,
    build: () => rejected("เลือกปลายทางซ้ำกัน กรุณาเอารายการที่ซ้ำออก"),
  },

  // Playlist trash.
  {
    prefix: "Invalid input: ",
    match: /^playlist is used by an active or draft publication: (.+)$/,
    build: (found) =>
      rejected(`ย้ายลงถังไม่ได้ — Playlist นี้ถูกใช้อยู่ใน Program ที่ Active หรือ Draft: ${found[1]} กรุณายกเลิก Program เหล่านั้นก่อน`, {
        reason: "in-use",
      }),
  },
  {
    prefix: "Invalid input: ",
    match: /^this playlist belongs to a publication and cannot be deleted on its own/,
    build: () => rejected("ลบไม่ได้ — Playlist นี้ถูกสร้างโดย Program ให้ลบที่ Program แทน"),
  },

  // Layout and Template save.
  {
    prefix: "Invalid input: ",
    match: /^zones (\d+) and (\d+) overlap/,
    build: (found) =>
      rejected(`บันทึกไม่ได้ — Zone ลำดับที่ ${found[1]} และ ${found[2]} ซ้อนทับกัน กรุณาปรับขนาดหรือตำแหน่งใหม่`),
  },
  {
    prefix: "Invalid input: ",
    match: /^a layout needs at least one zone/,
    build: () => rejected("บันทึกไม่ได้ — ต้องมีอย่างน้อย 1 Zone"),
  },
  {
    prefix: "Invalid input: ",
    match: /^zone is used by composition\(s\) (.+)/,
    build: (found) => rejected(`ลบ Zone ไม่ได้ — Template นี้ยังถูกใช้ใน: ${found[1]}`, { reason: "in-use" }),
  },
  {
    prefix: "Invalid input: ",
    match: /^playlist is in Trash: (.+)$/,
    build: (found) => rejected(`Playlist ${found[1]} อยู่ในถังขยะ กู้คืนก่อนจึงจะใส่ใน Layout ได้`),
  },
  {
    prefix: "Invalid input: ",
    match: /^cannot change the layout of an active composition/,
    build: () => rejected("เปลี่ยน Template ไม่ได้ขณะ Layout กำลัง Active"),
  },
  {
    prefix: "Invalid input: ",
    match: /^cannot move a composition back to draft/,
    build: () => rejected("ย้าย Layout กลับไป Draft ไม่ได้"),
  },
];

export function programPart(message: string): ProgramPart | undefined {
  return PART_TAG.exec(message)?.[1] as ProgramPart | undefined;
}

function matchTable(message: string, part: ProgramPart | undefined): RefusalResult | null {
  for (const rule of CORE_REFUSAL_RULES) {
    if (!message.startsWith(rule.prefix) || (rule.part && rule.part !== part)) continue;
    const found = rule.match.exec(message.slice(rule.prefix.length).replace(LEADING_PART_TAGS, ""));
    if (found) return rule.build(found);
  }
  return null;
}

function publishCauseResult(message: string): RefusalResult | null {
  const publish = classifyPublishCause(message);
  return publish ? rejected(publish.message, { cause: publish.cause }) : null;
}

/**
 * The table, then the publish causes. `classifyPublishCause` always sees the raw message first because
 * Core writes `[schedule]` into the text itself; only when that names no cause is the tag stripped, so
 * `not found: [content] composition not found` still reaches `no-content`.
 */
function lookup(message: string, withChannelGuards: boolean): RefusalResult | null {
  const part = programPart(message);
  const stripped = part ? message.replace(ALL_PART_TAGS, "") : message;
  const guard = (text: string) => {
    const inactive = withChannelGuards ? inactiveChannelMessage(text) : null;
    return inactive ? rejected(inactive) : null;
  };
  return (
    matchTable(message, part) ??
    publishCauseResult(message) ??
    guard(message) ??
    (part ? (publishCauseResult(stripped) ?? guard(stripped)) : null)
  );
}

/**
 * Null when the message is none of the refusals the table knows. A Publish changes refusal
 * (`program "<name>" — <inner>`) is unwrapped and its inner message classified again.
 */
export function classifyCoreRefusal(message: string): RefusalResult | null {
  const wrapped = PROGRAM_WRAPPER.exec(message);
  if (!wrapped) return lookup(message, true);
  const inner = lookup(wrapped[2], false) ?? rejected("ไม่ผ่านเงื่อนไขการ Publish");
  return { ...inner, reason: "program-refused", names: [wrapped[1]] };
}
