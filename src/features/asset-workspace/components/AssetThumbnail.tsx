"use client";

import { useState } from "react";
import { BoxIcon } from "@/components/ui/icons";

/** A signed asset photo, or the asset icon when there is none or it fails to load (expired link, no resizing). */
export function AssetThumbnail({ src, alt = "", className = "size-8", iconClassName = "size-5", onFailed }: {
  src: string | null; alt?: string; className?: string; iconClassName?: string;
  /** Called once when a signed link stops loading, so the caller can read fresh links. */
  onFailed?: () => void;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    return (
      <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-control bg-muted text-muted-foreground ${className}`}>
        <BoxIcon className={iconClassName} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a signed, short-lived Storage link; not worth next/image's config here.
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`shrink-0 rounded-control bg-muted object-cover ${className}`}
      onError={() => { setFailed(src); onFailed?.(); }}
    />
  );
}
