import { DynamicIcon, GlobeIcon, ImageIcon, LayoutIcon, VideoIcon } from "@/components/ui/icons";
import type { PublicationTypeId } from "../mock-data";
import type { ReactNode } from "react";

export const publicationTypeIcons: Record<PublicationTypeId, ReactNode> = {
  image: <ImageIcon />,
  video: <VideoIcon />,
  playlist: <LayoutIcon />,
  html: <GlobeIcon />,
  dynamic: <DynamicIcon />,
};
