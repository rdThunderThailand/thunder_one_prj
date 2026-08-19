"use client";

import { useState } from "react";
import Image from "next/image";
import { isVideoUrl } from "@/lib/media-kind";
import { LazyVideo } from "./LazyVideo";

type MediaThumbProps = {
  url?: string;
  thumbnailUrl?: string;
  kind?: string;
  mimeType?: string;
  alt: string;
  className?: string;
};

export function MediaThumb({ url, thumbnailUrl, kind, mimeType, alt, className }: MediaThumbProps) {
  const box = className ?? "h-14 w-14";
  const base = `shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800 ${box}`;
  // Callers that know the asset pass kind/mimeType. Playlist covers know only a
  // cover_asset_id, so for them the URL's extension is the only signal available — without
  // it a video cover reaches next/image and the optimizer 500s on the undecodable bytes.
  const isVideo =
    kind === "video" ||
    (!kind && mimeType?.startsWith("video/")) ||
    (!kind && !mimeType && !!url && isVideoUrl(url));

  // Track image load failure so a dead thumbnail URL falls through to the no-URL
  // placeholder below — reuses the existing branch, no second placeholder needed.
  const [imgFailed, setImgFailed] = useState(false);

  if (!url || imgFailed) {
    return (
      <div className={`${base} flex items-center justify-center text-[10px] font-medium uppercase text-zinc-400`}>
        {kind ?? "file"}
      </div>
    );
  }
  // A captured poster (ADR 0016) skips the video decode entirely. Videos uploaded before
  // capture existed have no thumbnail_storage_key yet, so they fall back to LazyVideo.
  if (isVideo && thumbnailUrl) {
    return (
      <div className={`${base} relative`}>
        <Image
          src={thumbnailUrl}
          alt={alt}
          fill
          sizes="128px"
          className="object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }
  if (isVideo) {
    return <LazyVideo src={url} className={`${base} object-cover`} />;
  }
  // url present and not detected as video: an image, or an unrecognised extension (default to
  // image — a broken image degrades gracefully, where next/image on a video does not).
  return (
    <div className={`${base} relative`}>
      <Image
        src={url}
        alt={alt}
        fill
        sizes="128px"
        className="object-cover"
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}
