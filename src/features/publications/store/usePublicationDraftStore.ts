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
import {
  assetLibrary,
  campaigns,
  defaultScheduleState,
  defaultSelectedChannelIds,
  priorities,
  type ScheduleState,
} from "../mock-data";
import type { BasicInfoState } from "../components/BasicInfoForm";

const defaultBasicInfo: BasicInfoState = {
  campaignId: campaigns[0].id,
  publicationType: "image",
  name: "KFC Wednesday Special - 199 Baht",
  description: "โปรโมชั่นพิเศษทุกวันพุธ เพียง 199 บาท (ปกติ 299 บาท)",
  priorityId: priorities[1].id,
  language: "Thai",
  tags: ["Promotion", "FOOD", "WEDNESDAY"],
};

interface DraftFields {
  step: number;
  basicInfo: BasicInfoState;
  assetId: string;
  channelIds: string[];
  scheduleState: ScheduleState;
}

const defaultDraft: DraftFields = {
  step: 1,
  basicInfo: defaultBasicInfo,
  assetId: assetLibrary[0].id,
  channelIds: defaultSelectedChannelIds,
  scheduleState: defaultScheduleState,
};

interface PublicationDraftStore extends DraftFields {
  setStep: (step: number) => void;
  goNext: (maxStep: number) => void;
  goBack: () => void;
  setBasicInfo: (basicInfo: BasicInfoState) => void;
  setAssetId: (assetId: string) => void;
  setChannelIds: (channelIds: string[]) => void;
  toggleChannelId: (id: string) => void;
  setScheduleState: (scheduleState: ScheduleState) => void;
  /** Resets in-memory state and wipes the persisted draft — used by Cancel. */
  cancelDraft: () => void;
}

export const usePublicationDraftStore = create<PublicationDraftStore>()(
  persist(
    (set, get) => ({
      ...defaultDraft,
      setStep: (step) => set({ step }),
      goNext: (maxStep) => set((s) => ({ step: Math.min(s.step + 1, maxStep) })),
      goBack: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),
      setBasicInfo: (basicInfo) => set({ basicInfo }),
      setAssetId: (assetId) => set({ assetId }),
      setChannelIds: (channelIds) => set({ channelIds }),
      toggleChannelId: (id) => {
        const { channelIds } = get();
        const next = channelIds.includes(id) ? channelIds.filter((c) => c !== id) : [...channelIds, id];
        set({ channelIds: next });
      },
      setScheduleState: (scheduleState) => set({ scheduleState }),
      cancelDraft: () => {
        set({ ...defaultDraft });
        usePublicationDraftStore.persist.clearStorage();
      },
    }),
    {
      name: "thunderone.publications.create-draft",
      storage: createJSONStorage(() => localStorage),
      // Hydration is triggered manually via useHasHydratedDraft(), not on
      // store creation — required to avoid a hydration mismatch, since the
      // server always renders with `defaultDraft` (no localStorage there).
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
