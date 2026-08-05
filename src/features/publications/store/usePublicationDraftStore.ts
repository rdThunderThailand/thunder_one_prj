"use client";

// Single source of truth for the whole Create Publication wizard, persisted
// to localStorage so a reload (or leaving and coming back) resumes exactly
// where the user left off. Every step component reads/writes this store
// directly instead of receiving props from the page — that's what lets each
// step just render off the live store value instead of needing a one-time
// "initialState" prop plus a remount trick to pick up a restored draft.
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { makeDefaultScheduleForm } from "../schedule";
import { DEFAULT_IMAGE_DURATION_SECONDS } from "../draft-mapping";
import type { ScheduleForm, DraftAssetItem } from "../types";
import { priorities } from "../mock-data";
import type { BasicInfoState } from "../components/BasicInfoForm";

const defaultBasicInfo: BasicInfoState = {
  // Campaigns come from the API now, so there is no id to preselect.
  campaignId: "",
  publicationType: "image",
  name: "",
  description: "",
  priorityId: priorities[1].id,
  language: "th",
  tags: [],
};

export interface DraftFields {
  publicationId: string | null;
  step: number;
  basicInfo: BasicInfoState;
  assetItems: DraftAssetItem[];
  channelIds: string[];
  scheduleForm: ScheduleForm;
}

function getDefaultDraft(): DraftFields {
  return {
    publicationId: null,
    step: 1,
    basicInfo: defaultBasicInfo,
    assetItems: [],
    channelIds: [],
    scheduleForm: makeDefaultScheduleForm(),
  };
}

function serializeDraftFields(f: Pick<DraftFields, "basicInfo" | "assetItems" | "channelIds" | "scheduleForm">): string {
  return JSON.stringify({ basicInfo: f.basicInfo, assetItems: f.assetItems, channelIds: f.channelIds, scheduleForm: f.scheduleForm });
}

interface PublicationDraftStore extends DraftFields {
  savedSnapshot: string;
  explicitlySaved: boolean;
  /** Optimistic-lock counter from the last successful save (docs/adr/0003).
   * `null` until the first save/load — omitting `expected_revision` on that
   * first write is what `media_publication_upsert` treats as "no check". */
  revision: number | null;
  markSaved: () => void;
  setExplicitlySaved: (v: boolean) => void;
  setRevision: (revision: number | null) => void;
  setPublicationId: (id: string | null) => void;
  setStep: (step: number) => void;
  goNext: (maxStep: number) => void;
  goBack: () => void;
  setBasicInfo: (basicInfo: BasicInfoState) => void;
  setAssetItems: (assetItems: DraftAssetItem[]) => void;
  /** Playlist mode: add if absent, remove if present. Images enter at 10s, videos at null. */
  toggleAssetItem: (asset: { id: string; isImage: boolean }) => void;
  /** Only meaningful for images; ignored when the id isn't selected. */
  setAssetDuration: (mediaAssetId: string, seconds: number | null) => void;
  /** Moves one item by ±1. Out-of-range moves are a no-op. */
  moveAssetItem: (mediaAssetId: string, direction: -1 | 1) => void;
  setChannelIds: (channelIds: string[]) => void;
  toggleChannelId: (id: string) => void;
  setScheduleForm: (scheduleForm: ScheduleForm) => void;
  /** Resets in-memory state and wipes the persisted draft — used by Cancel. */
  cancelDraft: () => void;
}

export const usePublicationDraftStore = create<PublicationDraftStore>()(
  persist(
    (set, get) => ({
      ...getDefaultDraft(),
      savedSnapshot: serializeDraftFields(getDefaultDraft()),
      explicitlySaved: false,
      revision: null,
      markSaved: () => set((s) => ({ savedSnapshot: serializeDraftFields(s) })),
      setExplicitlySaved: (explicitlySaved) => set({ explicitlySaved }),
      setRevision: (revision) => set({ revision }),
      setPublicationId: (publicationId) => set({ publicationId }),
      setStep: (step) => set({ step }),
      goNext: (maxStep) => set((s) => ({ step: Math.min(s.step + 1, maxStep) })),
      goBack: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),
      setBasicInfo: (basicInfo) => set((s) => ({
        basicInfo,
        assetItems:
          basicInfo.publicationType === "playlist" ? s.assetItems : s.assetItems.slice(0, 1),
      })),
      setAssetItems: (assetItems) => set({ assetItems }),
      toggleAssetItem: ({ id, isImage }) => set((s) => {
        const exists = s.assetItems.some(i => i.media_asset_id === id);
        if (exists) {
          return { assetItems: s.assetItems.filter(i => i.media_asset_id !== id) };
        }
        return {
          assetItems: [
            ...s.assetItems,
            { media_asset_id: id, duration_seconds: isImage ? DEFAULT_IMAGE_DURATION_SECONDS : null },
          ],
        };
      }),
      setAssetDuration: (mediaAssetId, seconds) => set((s) => ({
        assetItems: s.assetItems.map(i => i.media_asset_id === mediaAssetId ? { ...i, duration_seconds: seconds } : i)
      })),
      moveAssetItem: (mediaAssetId, direction) => set((s) => {
        const index = s.assetItems.findIndex(i => i.media_asset_id === mediaAssetId);
        if (index === -1) return { assetItems: s.assetItems };
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= s.assetItems.length) return { assetItems: s.assetItems };
        const nextItems = [...s.assetItems];
        const temp = nextItems[index];
        nextItems[index] = nextItems[newIndex];
        nextItems[newIndex] = temp;
        return { assetItems: nextItems };
      }),
      setChannelIds: (channelIds) => set({ channelIds }),
      toggleChannelId: (id) => {
        const { channelIds } = get();
        const next = channelIds.includes(id) ? channelIds.filter((c) => c !== id) : [...channelIds, id];
        set({ channelIds: next });
      },
      setScheduleForm: (scheduleForm) => set({ scheduleForm }),
      cancelDraft: () => {
        set({
          ...getDefaultDraft(),
          savedSnapshot: serializeDraftFields(getDefaultDraft()),
          explicitlySaved: false,
          revision: null,
        });
        usePublicationDraftStore.persist.clearStorage();
      },
    }),
    {
      // v3 → v4: added `revision` (docs/adr/0003). Bumping the key means an
      // in-flight v3 draft is dropped on load rather than rehydrated into a
      // shape the new code doesn't expect.
      name: "thunderone.publications.create-draft.v4",
      storage: createJSONStorage(() => localStorage),
      // Hydration is triggered manually via useHasHydratedDraft(), not on
      // store creation — required to avoid a hydration mismatch, since the
      // server always renders with defaultDraft (no localStorage there).
      skipHydration: true,
    },
  ),
);

/** Call once near the wizard's root. Triggers rehydration on mount and
 * reports when it's done, so the page can avoid flashing default content
 * before the real draft loads.
 *
 * Starts at `false` unconditionally (never touches `.persist` during
 * render) — on the server, `storage` is unavailable so the middleware never
 * assigns `api.persist` at all, and calling it there would throw. */
export function useHasHydratedDraft() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = usePublicationDraftStore.persist.onFinishHydration(() => setHasHydrated(true));
    usePublicationDraftStore.persist.rehydrate();
    return unsubscribe;
  }, []);

  return hasHydrated;
}

export function useIsDraftDirty(): boolean {
  return usePublicationDraftStore(
    (s) => serializeDraftFields(s) !== s.savedSnapshot
  );
}
