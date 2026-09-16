"use client";

import { FeatureFolderRail } from "@/features/media-workspace/content-library/FeatureFolderRail";
import type { FolderCollection } from "@/features/media-workspace/content-library/ContentFolderRail";
import type { ContentFolder } from "@/types/domain";
import { fetchCompositionLibrary, moveComposition } from "../services/compositions-api";

const LABELS = { all: "All Layouts", uncategorized: "Uncategorized", trash: "Trash" };

async function loadCompositionIds(folderId: string) {
  const ids: string[] = [];
  let page = 1;
  do {
    const result = await fetchCompositionLibrary({ folderId, page, pageSize: 100 });
    ids.push(...result.data.map(({ id }) => id));
    if (!result.pagination || page >= result.pagination.totalPages) break;
    page += 1;
  } while (true);
  return ids;
}

export function CompositionFolderRail(props: {
  folders: ContentFolder[];
  selected: FolderCollection;
  isLoading?: boolean;
  onSelect: (collection: FolderCollection) => void;
  onRefresh: () => void;
  onError: (error: unknown) => void;
}) {
  return <FeatureFolderRail {...props} scope="composition" labels={LABELS} deleteFolderItems={{ loadIds: loadCompositionIds, move: moveComposition }} />;
}
