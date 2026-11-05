import type { AppLocale } from "@/lib/app-locale";
import type { TranscodeStatus } from "@/types/domain";

/** The wait line under a converting Asset. `null` until Core has reported this Asset's job.
 *  Core owns the estimate, because only Core knows how many jobs start per minute. */
export function transcodeWaitMessage(status: TranscodeStatus | undefined, locale: AppLocale): string | null {
  if (!status) return null;
  if (status.job_status === "running") {
    if (status.progress_pct === null) return locale === "th" ? "กำลังแปลงไฟล์" : "Converting now";
    return locale === "th" ? `กำลังแปลงไฟล์ ${status.progress_pct}%` : `Converting ${status.progress_pct}%`;
  }
  if (status.job_status !== "queued" || status.queue_position === null) return null;
  const minutes = Math.ceil((status.estimated_start_seconds ?? 0) / 60);
  if (locale === "th") return `คิวที่ ${status.queue_position} · เริ่มแปลงในอีกประมาณ ${minutes} นาที`;
  return `Queue position ${status.queue_position} · starts in about ${minutes} min`;
}
