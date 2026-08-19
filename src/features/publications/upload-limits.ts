/**
 * What the media pipeline can actually store today. There is no transcoding step,
 * so whatever is uploaded is what every player and every preview has to decode —
 * a `.mov` that Chrome refuses to paint becomes a permanently blank card.
 */
const ACCEPTED_MIME_TYPES = [
  "video/mp4",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/** Browsers occasionally hand over an empty `File.type`; the extension is the fallback signal. */
const EXTENSION_MIME_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/** The `accept` attribute for the file input, so the OS picker filters before we ever see it. */
export const UPLOAD_ACCEPT_ATTR = ".mp4,.png,.jpg,.jpeg,.webp";

export const UPLOAD_ACCEPT_LABEL = "รองรับ MP4, PNG, JPG, WebP";

/** Returns a user-facing reason to refuse the file, or null when it is acceptable. */
export function rejectUploadReason(file: { name: string; type: string }): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = file.type || EXTENSION_MIME_TYPES[extension] || "";

  if ((ACCEPTED_MIME_TYPES as readonly string[]).includes(mimeType)) return null;

  if (mimeType.startsWith("video/")) {
    return `ยังรองรับวิดีโอเฉพาะ MP4 — กรุณาแปลงไฟล์ก่อนอัปโหลด (ไฟล์นี้เป็น ${mimeType})`;
  }
  return `ไฟล์ประเภทนี้ยังอัปโหลดไม่ได้ — ${UPLOAD_ACCEPT_LABEL}`;
}
