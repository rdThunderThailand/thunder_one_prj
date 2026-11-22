/**
 * Maps what Core refuses at publish time (ADR 0114) to a Thai message plus a `cause` the page
 * turns into a button. Matched on the raw message because the same refusal comes from several
 * RPCs (upsert, set_content, set_schedule, activate). Free of routing on purpose: the page knows
 * the Program's type and ids, this file does not.
 */
export type PublishCause =
  | "schedule-ended"
  | "schedule-invalid"
  | "no-content"
  | "layout-not-active"
  | "zones-unbound"
  | "nothing-playable"
  | "targets"
  | "channels-inactive"
  | "channels-deleted"
  | "no-screens"
  | "files";

export interface PublishCauseResult {
  cause: PublishCause;
  message: string;
}

const NO_END_DATE_HINT = "ถ้าเผยแพร่ตอนนี้จะไม่ได้ออกอากาศเลย กรุณาเลื่อนวันสิ้นสุด หรือเอาวันสิ้นสุดออก";

/** `endsAtLabel` is the page's own `dd/mm/yyyy HH:mm`; Core's message carries no date. */
export function scheduleEndedMessage(endsAtLabel?: string): string {
  return endsAtLabel
    ? `Program นี้สิ้นสุดเมื่อ ${endsAtLabel} ซึ่งผ่านไปแล้ว ${NO_END_DATE_HINT}`
    : `Program นี้สิ้นสุดแล้ว ${NO_END_DATE_HINT}`;
}

/** Refusals from `media_publication_set_schedule` and its migration-20261111170000 recurrence checks. */
const scheduleInvalid: [RegExp, string][] = [
  [/starts_at is required/, "ยังไม่ได้ระบุวันเริ่มออกอากาศ กรุณาระบุวันเริ่มในขั้นตอนกำหนดเวลา"],
  [/ends_at must be after starts_at/, "วันสิ้นสุดต้องอยู่หลังวันเริ่ม กรุณาแก้วันที่ในขั้นตอนกำหนดเวลา"],
  [/daily_start must be before daily_end/, "เวลาเริ่มต่อวันต้องมาก่อนเวลาสิ้นสุดต่อวัน กรุณาแก้เวลาในขั้นตอนกำหนดเวลา"],
  [/recurrence requires daily_start and daily_end/, "การเล่นซ้ำต้องระบุเวลาเริ่มและเวลาสิ้นสุดต่อวัน กรุณาระบุในขั้นตอนกำหนดเวลา"],
  [/unknown timezone/, "เขตเวลาที่เลือกไม่ถูกต้อง กรุณาเลือกใหม่ในขั้นตอนกำหนดเวลา"],
  [/recurrence\.|monthly recurrence uses|dates recurrence uses/, "รูปแบบการเล่นซ้ำไม่ถูกต้อง กรุณาตรวจวันหรือวันที่ที่เลือกในขั้นตอนกำหนดเวลา"],
];

const NOTHING_PLAYABLE =
  "ไม่มีเนื้อหาที่เล่นได้ใน Program นี้ กรุณาตรวจสอบว่า Playlist หรือ Layout มีสื่อที่ใช้งานได้";

/** The operator's own names inside a sync-group refusal are kept; the English around them is not. */
function syncGroupMessage(message: string): string | null {
  const incomplete = /synchronized group target is incomplete — (.+)$/.exec(message);
  if (incomplete) {
    return `กลุ่มซิงค์ที่เลือกมีช่องทางไม่ครบ (${incomplete[1].replace("missing:", "ขาด:").trim()}) กรุณาเพิ่มช่องทางที่ขาดให้ครบ`;
  }
  const direct = /direct device target inside a synchronized group — (.+)$/.exec(message);
  if (direct) {
    return `จอ ${direct[1].replace("channel:", "ช่องทาง:").replace("group:", "กลุ่ม:").trim()} อยู่ในกลุ่มซิงค์ จึงเลือกจอเดี่ยวไม่ได้ กรุณาเลือกทั้งกลุ่มหรือเอาจอนี้ออก`;
  }
  const directChannel = /direct-target publication on (.+?) — synchronized playback is enabled/.exec(message);
  if (directChannel) {
    return `ช่องทาง ${directChannel[1].trim()} เปิดการซิงค์อยู่ จึงเลือกจอเดี่ยวไม่ได้ กรุณาเลือกเป็นช่องทางแทน หรือปิดการซิงค์`;
  }
  return null;
}

/**
 * ADR 0099 guards: a Program reaches only active Channels, a Group takes only active Channels, and
 * a Channel in a Group cannot be deactivated. The raw text ends with the operator's own Channel or
 * Group names, which are safe to show; the English around them is not. Null when it is none of these.
 */
export function inactiveChannelMessage(message: string): string | null {
  const notActive = /channels are not active — activate them before publishing: ([^\n]+)/.exec(message);
  if (notActive) {
    return `ช่องทาง ${notActive[1].trim()} ยังไม่เปิดใช้งาน กรุณาเปิดใช้งานช่องทางก่อนเผยแพร่`;
  }
  const notActiveMembers = /only active channels can join a group — not active: ([^\n]+)/.exec(message);
  if (notActiveMembers) {
    return `เพิ่มเข้ากลุ่มได้เฉพาะช่องทางที่เปิดใช้งาน — ${notActiveMembers[1].trim()} ยังไม่เปิดใช้งาน`;
  }
  if (message.includes("only active channels can join a group — activate this channel first")) {
    return "เพิ่มเข้ากลุ่มได้เฉพาะช่องทางที่เปิดใช้งาน กรุณาเปิดใช้งานช่องทางนี้ก่อน";
  }
  const groups = /remove this channel from its groups before deactivating: ([^\n]+)/.exec(message);
  if (groups) {
    return `ช่องทางนี้ยังอยู่ในกลุ่ม ${groups[1].trim()} กรุณานำออกจากกลุ่มก่อนปิดใช้งาน`;
  }
  return null;
}

/** ADR 0122 rule 16: `media_publication_activate` names Channels that were deleted. Null when it is not that. */
export function deletedChannelMessage(message: string): string | null {
  const deleted = /these channels were deleted — remove them from this Program: ([^\n]+)/.exec(message);
  return deleted ? `ช่องทาง ${deleted[1].trim()} ถูกลบแล้ว กรุณานำออกจาก Program นี้ก่อนเผยแพร่` : null;
}

/**
 * `media_publication_activate` refuses a Layout that is not Active, one with unbound Zones, and a
 * snapshot that resolves to nothing playable. The unbound-Zone names are the operator's own, so
 * they are kept; the English around them is not. Null when it is none of these.
 */
export function layoutNotReadyMessage(message: string): string | null {
  if (message.includes("composition is not active")) {
    return "Layout ที่เลือกยังไม่ Active กรุณา Activate Layout ก่อนเผยแพร่";
  }
  const unbound = /zone\(s\) (.+) are unbound/.exec(message);
  if (unbound) {
    return `Layout ยังไม่ได้ผูก Content ให้ Zone: ${unbound[1].trim()} กรุณาผูก Content แล้ว Activate Layout ก่อนเผยแพร่`;
  }
  if (message.includes("produced zero resolvable snapshot items")) return NOTHING_PLAYABLE;
  return null;
}

/**
 * `media_publication_activate` refuses a snapshot that holds a trashed Asset (ADR 0091 Decision 2).
 * Returns the file names it lists, or null when the message is about something else. The names are
 * the operator's own titles, so they are safe to show; the surrounding English is not.
 */
export function trashedAssetNames(message: string): string | null {
  const match = /remove or restore from Trash: ([^;]+)/.exec(message);
  return match ? match[1].trim() : null;
}

export const trashedAssetMessage = (names: string) =>
  `มีไฟล์ที่อยู่ในถังขยะ (${names}) กรุณานำออกจาก Playlist/Layout หรือกู้คืนไฟล์ก่อนเผยแพร่`;

/** Same refusal for an Asset whose file was permanently deleted, so Recover is not an option (ADR 0101). */
export function deletedFileNames(message: string): string | null {
  const match = /file was deleted, replace it: ([^;]+)/.exec(message);
  return match ? match[1].trim() : null;
}

export const deletedFileMessage = (names: string) =>
  `ไฟล์ถูกลบถาวรแล้ว (${names}) กรุณาเปลี่ยนเป็นไฟล์อื่นใน Playlist/Layout ก่อนเผยแพร่`;

const failedFilesMessage = (names: string) => `ไฟล์ที่แปลงไม่สำเร็จ (${names}) กรุณาเปลี่ยนเป็นไฟล์อื่นก่อนเผยแพร่`;
const processingFilesMessage = (names: string) => `ไฟล์กำลังแปลง (${names}) กรุณารอให้เสร็จแล้วลองเผยแพร่อีกครั้ง`;

/**
 * The `cannot activate — …` refusal joins every file problem with "; " (failed, processing, trashed,
 * deleted can all appear at once). Each part is read here so none falls through to raw English.
 * Null when no part is a file problem — `cannot activate — equal-priority overlap …` is not.
 */
function fileRefusalMessage(message: string): string | null {
  const body = /cannot activate — ([\s\S]+)$/.exec(message)?.[1];
  if (!body) return null;
  const parts: string[] = [];
  for (const part of body.split("; ")) {
    const names = (prefix: string) => part.startsWith(prefix) ? part.slice(prefix.length).trim() : null;
    const failed = names("replace this file: ");
    const processing = names("wait — conversion in flight: ");
    const trashed = names("remove or restore from Trash: ");
    const deleted = names("file was deleted, replace it: ");
    if (failed) parts.push(failedFilesMessage(failed));
    else if (processing) parts.push(processingFilesMessage(processing));
    else if (trashed) parts.push(trashedAssetMessage(trashed));
    else if (deleted) parts.push(deletedFileMessage(deleted));
  }
  return parts.length ? parts.join(" · ") : null;
}

export function classifyPublishCause(message: string): PublishCauseResult | null {
  if (message.includes("[schedule] end time is in the past") && !message.includes("use End program")) {
    return { cause: "schedule-ended", message: scheduleEndedMessage() };
  }
  const schedule = scheduleInvalid.find(([pattern]) => pattern.test(message));
  if (schedule) return { cause: "schedule-invalid", message: schedule[1] };

  if (/publication has no (layout|playlist)|not found: composition not found/.test(message)) {
    return { cause: "no-content", message: "ยังไม่ได้เลือกเนื้อหา หรือเนื้อหาที่เลือกถูกลบไปแล้ว กรุณาเลือกเนื้อหาใหม่" };
  }
  if (message.includes("composition is not active")) {
    return { cause: "layout-not-active", message: layoutNotReadyMessage(message) as string };
  }
  if (/zone\(s\) .+ are unbound/.test(message)) {
    return { cause: "zones-unbound", message: layoutNotReadyMessage(message) as string };
  }
  if (/playlist \S+ has no items|produced zero resolvable snapshot items/.test(message)) {
    return { cause: "nothing-playable", message: NOTHING_PLAYABLE };
  }

  const sync = syncGroupMessage(message);
  if (sync) return { cause: "targets", message: sync };
  if (message.includes("at least one target is required")) {
    return { cause: "targets", message: "ยังไม่ได้เลือกปลายทาง กรุณาเลือกช่องทางหรือกลุ่มอย่างน้อย 1 รายการ" };
  }
  if (/not found: channel(?: group)?(?! type)(?: \S+)? not found/.test(message)) {
    return { cause: "targets", message: "ไม่พบช่องทางหรือกลุ่มที่เลือก อาจถูกลบไปแล้ว กรุณาเลือกปลายทางใหม่" };
  }

  const deletedChannels = deletedChannelMessage(message);
  if (deletedChannels) return { cause: "channels-deleted", message: deletedChannels };
  if (message.includes("channels are not active — activate them before publishing")) {
    return { cause: "channels-inactive", message: inactiveChannelMessage(message) as string };
  }
  if (message.includes("the targets have no screens")) {
    return { cause: "no-screens", message: "ช่องทางหรือกลุ่มที่เลือกยังไม่มีจอ กรุณาเพิ่มจอก่อนเผยแพร่" };
  }

  const files = fileRefusalMessage(message);
  if (files) return { cause: "files", message: files };
  return null;
}
