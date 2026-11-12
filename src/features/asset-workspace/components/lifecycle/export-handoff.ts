import { EXPORT_HANDOFF_KEY, type ExportHandoff } from "../../domain/asset-lifecycle-actions";

export const EXPORT_PAGE = "/asset-workspace/assets/export";

/** Owner E1: the scope travels in sessionStorage (10,000 ids don't fit a URL); the page falls back to All assets. */
export function startAssetExport(push: (href: string) => void, handoff: ExportHandoff) {
  try { sessionStorage.setItem(EXPORT_HANDOFF_KEY, JSON.stringify(handoff)); }
  catch { /* Storage blocked: the page opens on All assets, shown before export. */ }
  push(EXPORT_PAGE);
}

export function readStoredHandoff() {
  try { return sessionStorage.getItem(EXPORT_HANDOFF_KEY); }
  catch { return null; }
}
