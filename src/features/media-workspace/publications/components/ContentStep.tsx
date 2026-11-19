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
  busy,
}: {
  assets: MediaAsset[];
  tags: Tag[];
  reloadAssets: () => Promise<MediaAsset[]>;
  assetsLoading: boolean;
  assetsError: string | null;
  onContentSelected: () => void;
  busy: boolean;
}) {
  return <AssetLibraryStep assets={assets} tags={tags} reloadAssets={reloadAssets} assetsLoading={assetsLoading} assetsError={assetsError} onContentSelected={onContentSelected} busy={busy} />;
}
