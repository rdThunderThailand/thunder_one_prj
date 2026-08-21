// Is the thing in the preview frame a video?
//
// This is not cosmetic. Handing a video URL to next/image makes the optimizer 500 on
// the undecodable bytes — the failure fixed once in ae37fa6 (playlist covers) and again
// when Step 4's preview started accepting playlist covers, which arrive as a bare asset
// id with no `kind` attached.
//
// Order matters: the asset's own `kind`/`mime_type` when we have the asset, and only
// then the URL's extension (ponytail: extension sniffing, see lib/media-kind).

import { isVideoUrl } from "../../lib/media-kind.ts";
import type { MediaAsset } from "@/types/domain";

export function isVideoPreview(asset: MediaAsset | undefined, url: string | undefined): boolean {
  if (asset?.kind === "video") return true;
  if (asset?.kind === "image") return false;
  if (asset?.file?.mime_type) return asset.file.mime_type.startsWith("video/");
  return !!url && isVideoUrl(url);
}
