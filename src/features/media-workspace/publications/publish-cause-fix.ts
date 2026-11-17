import type { PublishCause } from "@/lib/api/api-error";

/**
 * ADR 0114: what a refused publish should offer next. `api-error.ts` knows the cause but not the
 * Program's type or ids, so the page's own context decides whether the fix is a wizard step or a
 * link to the Playlist / Layout / Channels (opened in a new tab, the Draft is kept).
 */
export type PublishFix =
  | { kind: "step"; step: 1 | 2 | 3; label: string }
  | { kind: "link"; href: string; label: string };

export type PublishFixContext = {
  /** "image" | "video" | "playlist" | "composition" — `publicationType` in the draft store. */
  type: string;
  playlistId: string | null;
  compositionId: string | null;
};

const CHANNELS_HREF = "/media-workspace/channels";

/** Where the Playlist or Layout that holds the content lives; image / video files live in step 2. */
function contentFix(ctx: PublishFixContext): PublishFix | null {
  if (ctx.type === "composition" && ctx.compositionId) {
    return { kind: "link", href: `/media-workspace/layouts/${ctx.compositionId}`, label: "เปิด Layout" };
  }
  if (ctx.type === "playlist" && ctx.playlistId) {
    return { kind: "link", href: `/media-workspace/playlists/${ctx.playlistId}`, label: "เปิด Playlist" };
  }
  if (ctx.type === "image" || ctx.type === "video") return { kind: "step", step: 2, label: "ไปขั้นตอนเตรียมเนื้อหา" };
  return null;
}

export function publishCauseFix(cause: PublishCause, ctx: PublishFixContext): PublishFix | null {
  switch (cause) {
    case "schedule-ended":
    case "schedule-invalid":
      return { kind: "step", step: 3, label: "แก้กำหนดเวลา" };
    case "targets":
      return { kind: "step", step: 3, label: "แก้ปลายทาง" };
    case "no-content":
      return { kind: "step", step: 1, label: "เลือกเนื้อหา" };
    case "layout-not-active":
    case "zones-unbound":
      return ctx.compositionId
        ? { kind: "link", href: `/media-workspace/layouts/${ctx.compositionId}`, label: "เปิด Layout" }
        : null;
    case "nothing-playable":
    case "files":
      return contentFix(ctx);
    case "channels-inactive":
    case "no-screens":
      return { kind: "link", href: CHANNELS_HREF, label: "เปิดหน้า Channels" };
  }
}

/** The Edit page has cards, not steps: the card a step jump lands on. */
export function publishFixCard(cause: PublishCause, step: 1 | 2 | 3): "content" | "targets" | "schedule" {
  if (step !== 3) return "content";
  return cause === "targets" ? "targets" : "schedule";
}
