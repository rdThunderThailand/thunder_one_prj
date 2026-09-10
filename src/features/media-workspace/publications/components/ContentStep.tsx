"use client";

import type { MediaAsset, Tag } from "../types";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { AssetLibraryStep } from "./AssetLibraryStep";
import { CompositionPicker } from "./CompositionPicker";

export function ContentStep({
  assets,
  tags,
  reloadAssets,
  assetsLoading,
  assetsError,
}: {
  assets: MediaAsset[];
  tags: Tag[];
  reloadAssets: () => Promise<MediaAsset[]>;
  assetsLoading: boolean;
  assetsError: string | null;
}) {
  const publicationType = usePublicationDraftStore((state) => state.basicInfo.publicationType);

  return publicationType === "composition" ? <CompositionPicker /> : <AssetLibraryStep assets={assets} tags={tags} reloadAssets={reloadAssets} assetsLoading={assetsLoading} assetsError={assetsError} />;
}
