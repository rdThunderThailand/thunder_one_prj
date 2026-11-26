import type { LayoutStatus } from "./types";
import { mediaStatus, type MediaStatusEntry } from "../media-status.ts";

/** Unlike Playlist (ADR 0028), a Layout's status is never derived — it is the stored
 *  column directly, active ↔ inactive with no hard delete (ADR 0044 §6). Tones per ADR 0125. */
export function statusBadge(status: LayoutStatus): MediaStatusEntry {
  return mediaStatus(status);
}
