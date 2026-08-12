"use client";

// Single source of truth for the Create Playlist wizard. This store is the local mirror of
// a draft that is also persisted server-side on every Next and on Save Draft (docs/adr/0012,
// docs/adr/0013) — `playlistId`, `revision`, and `idempotencyKey` below are what tie this
// local copy to that server-side row.

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DraftItem, PlaylistInfo, PlaylistPlayback } from "../types";

/** Bumping the shape means bumping this key — a rehydrated old draft would crash the wizard. */
const STORAGE_KEY = "thunderone.playlists.create-draft.v2";

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
   *  re-creating the playlist. */
  playlistId: string | null;
  /** Set when the wizard opened as `?id=<uuid>` — the final button saves instead of creates. */
  editingId: string | null;
  /** Minted once per draft, sent on the first (create) POST — same role as
   *  the publication draft's idempotencyKey. Must be minted at construction,
   *  never lazily inside the save path. */
  idempotencyKey: string;
  /** Optimistic-lock counter from the last successful save. `null` until the
   *  first save/load — omitting `expected_revision` on that first write is
   *  what `media_playlist_upsert` treats as "no check". */
  revision: number | null;
  step: number;
  name: string;
  status: "draft" | "active" | "inactive";
  info: PlaylistInfo;
  playback: PlaylistPlayback;
  items: DraftItem[];
}

function getDefaultDraft(): PlaylistDraftFields {
  return {
    playlistId: null,
    editingId: null,
    idempotencyKey: crypto.randomUUID(),
    revision: null,
    step: 1,
    name: "",
    status: "draft",
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
  setRevision: (revision: number | null) => void;
  resetIdempotencyKey: () => void;
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
      setRevision: (revision) => set({ revision }),
      resetIdempotencyKey: () => set({ idempotencyKey: crypto.randomUUID() }),
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
