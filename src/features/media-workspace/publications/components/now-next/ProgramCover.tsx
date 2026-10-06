import { ContentKindIcon } from "./ContentKindIcon";
import type { NowNextPublication } from "../../now-next";

/** A Program's signed cover, or its content-kind icon when it has none. */
export function ProgramCover({ publication, className = "h-10 w-16" }: { publication: NowNextPublication; className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground ${className}`}>
      {publication.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- a small, variably-sourced cover; not worth next/image's config here.
        <img
          src={publication.thumbnail_url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <ContentKindIcon kind={publication.content.kind} />
      )}
    </span>
  );
}
