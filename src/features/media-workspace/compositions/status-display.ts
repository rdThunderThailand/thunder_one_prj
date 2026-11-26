import type { CompositionStatus } from "./types";
import { mediaStatus, type MediaStatusEntry } from "../media-status.ts";

/** draft → active ↔ inactive, copied from Playlist's lifecycle (ADR 0049 §10); tones per ADR 0125. */
export function statusBadge(status: CompositionStatus): MediaStatusEntry {
  return mediaStatus(status);
}

export function saveAction(status: CompositionStatus): { label: "Save Layout" | "Save"; canActivate: boolean } {
  return status === "draft" ? { label: "Save Layout", canActivate: true } : { label: "Save", canActivate: false };
}

/**
 * Why a Layout cannot be published yet, or null when it can. Core's `media_publication_activate`
 * accepts only an Active Layout (a Draft or Inactive one raises "composition is not active"), and
 * Core refuses to activate a Layout with unbound Zones, so Active alone covers both.
 */
export function layoutPublishBlock(status: CompositionStatus): string | null {
  if (status === "active") return null;
  return status === "draft"
    ? "Activate Layout ก่อนเผยแพร่"
    : "Layout นี้ถูกปิดใช้งาน กรุณา Activate Layout ก่อนเผยแพร่";
}
