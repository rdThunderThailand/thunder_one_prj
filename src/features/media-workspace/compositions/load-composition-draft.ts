// How the editor decides what to open on — either an existing Composition read back in full,
// or the Template Picker's seed. Split out by ticket 25 so the page's two effects stay a
// handful of lines each.
//
// The extra per-Playlist read is not avoidable: media_playlists_list excludes kind='inline'
// and media_composition_get carries no playlist_name, so a Zone bound to an implicit Playlist
// would otherwise render as a bare uuid.

import { fetchLayout } from "@/features/media-workspace/layouts/services/layouts-api";
import { LAYOUT_TEMPLATES } from "@/features/media-workspace/layouts/templates";
import type { LayoutListItem, LayoutZone } from "@/features/media-workspace/layouts/types";
import type { CreateSeed } from "@/features/media-workspace/layouts/create-seed";
import { decodeMetadata, fetchPlaylist } from "@/features/media-workspace/playlists";
import { firstPlaylistAssetId } from "./content-preview";
import { fetchComposition } from "./services/compositions-api";
import type { CompositionDetail } from "./types";
import { bindingsFromCompositionZones, type ZoneBindingDraft } from "./zone-bindings";
import type { PlaylistDetailSlice } from "./hooks/useCompositionEditorData";

export type CompositionDraft = {
  detail: CompositionDetail;
  bindings: ZoneBindingDraft[];
  /** `undefined` when the deployed Core predates the migration that returns these — the
   *  editor must then leave filing alone on save rather than clearing it. */
  tags: string[] | undefined;
  folderId: string | null | undefined;
  /** Feed to `absorbPlaylistDetails` — nulls are Playlists whose read failed. */
  slices: (PlaylistDetailSlice | null)[];
  /** Compared against the live draft to decide whether leaving needs a confirmation. */
  snapshot: string;
};

export function draftSnapshot(input: {
  name: string;
  layoutId: string | null;
  bindings: ZoneBindingDraft[];
  folderId: string | null | undefined;
  tags: string[] | undefined;
}): string {
  return JSON.stringify(input);
}

export async function loadCompositionDraft(compositionId: string): Promise<CompositionDraft> {
  const detail = await fetchComposition(compositionId);
  const named = await Promise.all(
    bindingsFromCompositionZones(detail.zones).map(async (binding) => {
      if (!binding.playlistId) return { binding, slice: null as PlaylistDetailSlice | null };
      try {
        const playlist = await fetchPlaylist(binding.playlistId);
        return {
          binding: { ...binding, playlistName: playlist.name },
          slice: {
            playlistId: binding.playlistId,
            firstAssetId: firstPlaylistAssetId(playlist.items),
            items: playlist.items,
            playback: decodeMetadata(playlist.metadata).playback,
          } as PlaylistDetailSlice,
        };
      } catch {
        return { binding, slice: null as PlaylistDetailSlice | null };
      }
    }),
  );

  const bindings = named.map((entry) => entry.binding);
  const tags = detail.tags?.map((tag) => tag.name);
  const folderId = detail.folder_id;

  return {
    detail,
    bindings,
    tags,
    folderId,
    slices: named.map((entry) => entry.slice),
    snapshot: draftSnapshot({ name: detail.name, layoutId: detail.layout_id, bindings, folderId, tags }),
  };
}

/** What the Template Picker handed over, resolved into something the canvas can draw.
 *  `zones` is private geometry to be minted on first save; `layout` is a shared Template the
 *  Composition will point at (ADR 0063 §3). */
export type ResolvedSeed =
  | { kind: "zones"; zones: LayoutZone[] }
  | { kind: "layout"; layout: LayoutListItem };

const fullScreenZone = (): LayoutZone =>
  ({ id: crypto.randomUUID(), position: 0, name: "Main", x: 0, y: 0, width: 100, height: 100 });

/** Turns the Template Picker's seed into geometry. The caller consumes the seed once (via a
 *  lazy `useState` initializer) and passes it in — resolving it here instead would be run
 *  twice by Strict Mode's double-invoked effect, and the second pass would find it already
 *  gone. Returns null when there was none, which is how a direct navigation to /create still
 *  works. */
export async function resolveCreateSeed(seed: CreateSeed | null): Promise<ResolvedSeed | null> {
  if (!seed) return null;
  if (seed.kind === "scratch") return { kind: "zones", zones: [fullScreenZone()] };
  if (seed.kind === "preset") {
    const preset = LAYOUT_TEMPLATES.find((template) => template.key === seed.presetKey);
    // Fresh ids: the canvas keys and binds by Zone id long before the RPC assigns real ones.
    return preset ? { kind: "zones", zones: preset.zones.map((zone) => ({ ...zone, id: crypto.randomUUID() })) } : null;
  }
  try {
    return { kind: "layout", layout: await fetchLayout(seed.layoutId) };
  } catch {
    return null;
  }
}
