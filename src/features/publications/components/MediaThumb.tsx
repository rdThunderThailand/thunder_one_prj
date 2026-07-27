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
  const isVideo = kind === "video" || (!kind && mimeType?.startsWith("video/"));

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
  // url present: image, OR unknown type (default to <img> — most assets are images; a broken
  // <img> degrades gracefully). Fallback label tile only ever shows when url is absent (above).
  return <img src={url} alt={alt} loading="lazy" className={`${base} object-cover`} />;
}
