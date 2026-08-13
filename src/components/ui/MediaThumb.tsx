import Image from "next/image";
import { isVideoUrl } from "@/lib/media-kind";

type MediaThumbProps = {
  url?: string;
  kind?: string;
  mimeType?: string;
  alt: string;
  className?: string;
};

export function MediaThumb({ url, kind, mimeType, alt, className }: MediaThumbProps) {
  const box = className ?? "h-14 w-14";
  const base = `shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800 ${box}`;
  // Callers that know the asset pass kind/mimeType. Playlist covers know only a
  // cover_asset_id, so for them the URL's extension is the only signal available — without
  // it a video cover reaches next/image and the optimizer 500s on the undecodable bytes.
  const isVideo =
    kind === "video" ||
    (!kind && mimeType?.startsWith("video/")) ||
    (!kind && !mimeType && !!url && isVideoUrl(url));

  if (!url) {
    return (
      <div className={`${base} flex items-center justify-center text-[10px] font-medium uppercase text-zinc-400`}>
        {kind ?? "file"}
      </div>
    );
  }
  if (isVideo) {
    return <video src={`${url}#t=0.1`} muted preload="metadata" className={`${base} object-cover`} />;
  }
  // url present and not detected as video: an image, or an unrecognised extension (default to
  // image — a broken image degrades gracefully, where next/image on a video does not).
  return (
    <div className={`${base} relative`}>
      <Image src={url} alt={alt} fill sizes="128px" className="object-cover" />
    </div>
  );
}
