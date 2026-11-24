// Last-resort media-type detection for callers that hold a preview URL but no MediaAsset.
//
// Playlist covers are the case this exists for: the list RPC returns only a
// `cover_asset_id` (falling back to the first item's asset), and the preview-URL endpoint
// answers with a bare `id -> signed URL` map, so nothing on the page carries `kind` or
// `mime_type`. Handing a video URL to next/image makes the optimizer 500 trying to decode
// it, so the type has to come from somewhere — here, the file extension.
//
// Note the folder is not a discriminator: every asset, image or video, is stored under a
// `videos/` prefix (`videos/<uuid>.png` is a real image row). Only the extension separates
// them, and signed URLs carry a `?token=` suffix that must not be matched into it.
//
// ponytail: extension sniffing — prefer a real `kind` whenever the caller has the asset
// (see PlaylistSummary, which does). If the accepted upload formats grow beyond these,
// return `kind` from the preview-URL endpoint instead of extending this list.
const VIDEO_EXTENSION = /\.(mp4|mov|webm|m4v)(?:$|[?#])/i;

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXTENSION.test(url);
}
