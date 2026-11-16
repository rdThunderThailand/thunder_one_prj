import type { AppLocale } from "@/lib/app-locale";
import type { ProbeVerdict } from "@/types/domain";

/** CONTEXT.md "Playback Readiness": whether a registered video can be published now, apart from
 *  whether its upload finished. A code, not a sentence, so a language switch re-renders old rows. */
export type PlaybackReadiness = "ready" | "converting" | "unsupported_profile" | "unreadable" | "refused";

type ReadinessInput = { kind?: string | null; status?: string | null; probe_verdict?: ProbeVerdict | null };

/** `status` decides first (ADR 0071): a re-register of a converted Asset returns `ready` with the
 *  source's `unsupported_profile` verdict, and that Asset is ready. `null` means show nothing: an
 *  image, a video registered before verdicts existed, or an Asset in a state this does not describe.
 *  The text never says a conversion is running for a `ready` Asset, because its job may be absent,
 *  finished or failed. */
export function playbackReadiness({ kind, status, probe_verdict: verdict }: ReadinessInput): PlaybackReadiness | null {
  if (kind && kind !== "video") return null;
  if (status === "processing") return "converting";
  if (status === "failed") {
    if (verdict?.code === "unsupported_profile") return "unsupported_profile";
    if (verdict?.code === "unreadable") return "unreadable";
    return "refused";
  }
  if (status !== "ready" || !verdict) return null;
  return verdict.code === "unreadable" ? null : "ready";
}

/** `refused` readiness is a failed upload (Core turned the file away), so `Retry` cannot help. */
export const isRefusal = (readiness: PlaybackReadiness | null | undefined) =>
  readiness === "unsupported_profile" || readiness === "unreadable" || readiness === "refused";

const MESSAGES: Record<PlaybackReadiness, Record<AppLocale, string>> = {
  ready: {
    th: "เผยแพร่ได้แล้ว ไม่ต้องทำอะไรเพิ่ม",
    en: "Ready to publish. No action needed.",
  },
  converting: {
    th: "กำลังแปลงไฟล์ เผยแพร่ได้เมื่อแปลงเสร็จ",
    en: "Converting. You can publish when it finishes.",
  },
  unsupported_profile: {
    th: "ใช้ไฟล์นี้กับจอไม่ได้ กรุณา export เป็น MP4 (H.264 Baseline) แล้วอัปโหลดใหม่",
    en: "This file can't be used on screens. Export it as MP4 (H.264 Baseline) and upload again.",
  },
  unreadable: {
    th: "อ่านไฟล์นี้ไม่ได้ กรุณา export ใหม่แล้วอัปโหลดอีกครั้ง",
    en: "We couldn't read this file. Export it again and re-upload.",
  },
  refused: {
    th: "ระบบไม่รับไฟล์นี้ กรุณาตรวจไฟล์แล้วอัปโหลดใหม่",
    en: "The system refused this file. Check it and upload again.",
  },
};

export const readinessMessage = (readiness: PlaybackReadiness, locale: AppLocale) => MESSAGES[readiness][locale];

export type ReadinessTone = "neutral" | "warning" | "error";

export const readinessTone = (readiness: PlaybackReadiness): ReadinessTone =>
  readiness === "ready" ? "neutral" : readiness === "converting" ? "warning" : "error";

export const VIEW_DETAILS_LABEL: Record<AppLocale, string> = { th: "ดูรายละเอียด", en: "View details" };
