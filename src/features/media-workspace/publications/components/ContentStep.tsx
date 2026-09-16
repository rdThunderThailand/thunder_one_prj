"use client";

import type { MediaAsset, Tag } from "../types";
import { AssetLibraryStep } from "./AssetLibraryStep";

export function ContentStep({
  assets,
  tags,
  reloadAssets,
  assetsLoading,
  assetsError,
  onContentSelected,
}: {
  assets: MediaAsset[];
  tags: Tag[];
  reloadAssets: () => Promise<MediaAsset[]>;
  assetsLoading: boolean;
  assetsError: string | null;
  onContentSelected: () => void;
}) {
  return <AssetLibraryStep assets={assets} tags={tags} reloadAssets={reloadAssets} assetsLoading={assetsLoading} assetsError={assetsError} onContentSelected={onContentSelected} />;
}
