"use client";

// Single source of truth for the Create Playlist wizard. Unlike the publications draft,
// nothing here is persisted server-side until the final submit — the whole wizard is local
// (docs/playlists/plan-playlist-ui.md), so this store *is* the draft.

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DraftItem, PlaylistInfo, PlaylistPlayback } from "../types";

/** Bumping the shape means bumping this key — a rehydrated old draft would crash the wizard. */
const STORAGE_KEY = "thunderone.playlists.create-draft.v1";

export const DEFAULT_IMAGE_DURATION_SECONDS = 10;

function defaultInfo(): PlaylistInfo {
  return { playlistType: "standard", resolution: "1920x1080", frameRate: 30, tags: [] };
}

function defaultPlayback(): PlaylistPlayback {
  return {
    playMode: "sequential",
    repeat: "loop",
    startFrom: "first",
    defaultImageDuration: DEFAULT_IMAGE_DURATION_SECONDS,
    mediaFit: "fit",
    audioEnabled: true,
    defaultVolume: 80,
    defaultTransition: "fade",
    transitionDuration: 1,
    failureHandling: "skip",
    warnOnSkip: true,
  };
}

export interface PlaylistDraftFields {
  /** Set only after a successful create — lets a failed `setItems` retry without
   *  re-creating the playlist (which would hit UNIQUE (tenant_id, name) anyway). */
  playlistId: string | null;
  /** Set when the wizard opened as `?id=<uuid>` — the final button saves instead of creates. */
  editingId: string | null;
  step: number;
  name: string;
  status: "active" | "inactive";
  info: PlaylistInfo;
  playback: PlaylistPlayback;
  items: DraftItem[];
}

function getDefaultDraft(): PlaylistDraftFields {
  return {
    playlistId: null,
    editingId: null,
    step: 1,
    name: "",
    status: "active",
    info: defaultInfo(),
    playback: defaultPlayback(),
    items: [],
  };
}

interface PlaylistDraftStore extends PlaylistDraftFields {
  setStep: (step: number) => void;
  setName: (name: string) => void;
  setInfo: (patch: Partial<PlaylistInfo>) => void;
  setPlayback: (patch: Partial<PlaylistPlayback>) => void;
  setItems: (items: DraftItem[]) => void;
  addItem: (item: DraftItem) => void;
  removeItem: (mediaAssetId: string) => void;
  moveItem: (from: number, to: number) => void;
  patchItem: (mediaAssetId: string, patch: Partial<DraftItem>) => void;
  setCover: (mediaAssetId: string | undefined) => void;
  setPlaylistId: (id: string | null) => void;
  loadDraft: (draft: Partial<PlaylistDraftFields>) => void;
  reset: () => void;
}

export const usePlaylistDraftStore = create<PlaylistDraftStore>()(
  persist(
    (set) => ({
      ...getDefaultDraft(),

      setStep: (step) => set({ step }),
      setName: (name) => set({ name }),
      setInfo: (patch) => set((s) => ({ info: { ...s.info, ...patch } })),
      setPlayback: (patch) => set((s) => ({ playback: { ...s.playback, ...patch } })),
      setItems: (items) => set({ items }),

      addItem: (item) =>
        set((s) =>
          s.items.some((i) => i.mediaAssetId === item.mediaAssetId)
            ? s
            : { items: [...s.items, item] }
        ),

      removeItem: (mediaAssetId) =>
        set((s) => ({
          items: s.items.filter((i) => i.mediaAssetId !== mediaAssetId),
          // A removed asset can no longer be the cover; fall back to item 1.
          info:
            s.info.coverAssetId === mediaAssetId
              ? { ...s.info, coverAssetId: undefined }
              : s.info,
        })),

      moveItem: (from, to) =>
        set((s) => {
          if (from === to || from < 0 || to < 0 || from >= s.items.length || to >= s.items.length) {
            return s;
          }
          const items = [...s.items];
          const [moved] = items.splice(from, 1);
          items.splice(to, 0, moved);
          return { items };
        }),

      patchItem: (mediaAssetId, patch) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.mediaAssetId === mediaAssetId ? { ...i, ...patch } : i
          ),
        })),

      setCover: (mediaAssetId) =>
        set((s) => ({ info: { ...s.info, coverAssetId: mediaAssetId } })),

      setPlaylistId: (playlistId) => set({ playlistId }),
      loadDraft: (draft) => set((s) => ({ ...s, ...draft })),
      reset: () => set(getDefaultDraft()),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** True once zustand has rehydrated from localStorage — render nothing draft-dependent
 *  before that or the server HTML and the first client paint disagree.
 *
 *  NOTE: `usePlaylistDraftStore.persist` is undefined during SSR (the persist
 *  middleware only attaches on the client where localStorage exists), so we
 *  guard every access and default to `false` on the server. */
export function useDraftHydrated(): boolean {
  const [hydrated, setHydrated] = useState(
    () => usePlaylistDraftStore.persist?.hasHydrated?.() ?? false
  );
  useEffect(() => {
    const unsub = usePlaylistDraftStore.persist?.onFinishHydration?.(() => setHydrated(true));
    return () => unsub?.();
  }, []);
  return hydrated;
}

/** Whether there is anything worth restoring — drives the "draft in progress" banner. */
export function hasDraftContent(draft: PlaylistDraftFields): boolean {
  return draft.name.trim().length > 0 || draft.items.length > 0;
}
