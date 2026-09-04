"use client";

import { FeatureFolderRail } from "@/features/media-workspace/content-library/FeatureFolderRail";
import type { FolderCollection } from "@/features/media-workspace/content-library/ContentFolderRail";
import type { ContentFolder } from "@/types/domain";

const LABELS = { all: "All Layouts", uncategorized: "Uncategorized", trash: "Trash" };

export function CompositionFolderRail(props: {
  folders: ContentFolder[];
  selected: FolderCollection;
  isLoading?: boolean;
  onSelect: (collection: FolderCollection) => void;
  onRefresh: () => void;
  onError: (error: unknown) => void;
}) {
  return <FeatureFolderRail {...props} scope="composition" labels={LABELS} />;
}
