import { GlobeIcon, GridIcon, ImageIcon, ListIcon, VideoIcon } from "@/components/ui/icons";
import type { NowNextContent } from "../../now-next";

const ICONS: Record<NowNextContent["kind"], typeof GridIcon> = {
  layout: GridIcon,
  playlist: ListIcon,
  image: ImageIcon,
  video: VideoIcon,
  other: GlobeIcon,
};

export const CONTENT_KIND_LABELS: Record<NowNextContent["kind"], string> = {
  layout: "Layout",
  playlist: "Playlist",
  image: "Image",
  video: "Video",
  other: "Other",
};

export function ContentKindIcon({ kind, className = "h-3.5 w-3.5" }: { kind: NowNextContent["kind"]; className?: string }) {
  const Icon = ICONS[kind];
  return <Icon className={className} />;
}
