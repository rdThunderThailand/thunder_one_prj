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

/** Matches the ceiling Core and the `media` bucket enforce (ADR-0059); the browser check
 *  only exists to fail a 6 GB file before it wastes an authorization round trip. */
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024 * 1024;

export const MAX_UPLOAD_SIZE_LABEL = "5 GB";

/** The MIME type to claim for a file, falling back to its extension when the browser
 *  reports none. Core validates `mime_type` against the extension and rejects anything it
 *  does not recognise, so the picker and the upload request have to agree on this value. */
export function resolveUploadMimeType(file: { name: string; type: string }): string {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return file.type || EXTENSION_MIME_TYPES[extension] || "";
}

/** Returns a user-facing reason to refuse the file, or null when it is acceptable. */
export function rejectUploadReason(file: { name: string; type: string; size?: number }): string | null {
  const mimeType = resolveUploadMimeType(file);

  if (file.size !== undefined && file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `ไฟล์ใหญ่เกิน ${MAX_UPLOAD_SIZE_LABEL} — กรุณาลดขนาดก่อนอัปโหลด`;
  }
  if (file.size === 0) {
    return "ไฟล์ว่าง — ไม่สามารถอัปโหลดได้";
  }

  if ((ACCEPTED_MIME_TYPES as readonly string[]).includes(mimeType)) return null;

  if (mimeType.startsWith("video/")) {
    return `ยังรองรับวิดีโอเฉพาะ MP4 — กรุณาแปลงไฟล์ก่อนอัปโหลด (ไฟล์นี้เป็น ${mimeType})`;
  }
  return `ไฟล์ประเภทนี้ยังอัปโหลดไม่ได้ — ${UPLOAD_ACCEPT_LABEL}`;
}
