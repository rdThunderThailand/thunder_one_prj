"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchComposition } from "../../compositions/services/compositions-api";
import { fetchPlaylist } from "@/features/media-workspace/playlists";
import { classifyApiError } from "@/lib/api/api-error";
import { hasUnfinishedDraft, shouldShowResumePrompt } from "../resume-prompt";
import { resolveSeed, type PublicationSeed } from "../seed-resolver";
import { DraftSaveError, requireCompleteDraftSave, type DraftPersistResult } from "../draft-save-policy";
import { DEFAULT_IMAGE_DURATION_SECONDS, isImageAsset } from "../draft-mapping";
import { isDraftDirty, usePublicationDraftStore } from "../store/usePublicationDraftStore";
import type { MediaAsset, PublicationType } from "../types";

const CREATE_URL = "/media-workspace/program/create";
type Entry = { seed: PublicationSeed | null; isEditMode: boolean; unfinished: boolean; hasServerDraft: boolean };
type ReadySeed = { name: string; publicationType: PublicationType };

function applySeed(seed: PublicationSeed, ready: ReadySeed) {
  const store = usePublicationDraftStore.getState();
  store.cancelDraft();
  store.setBasicInfo({ ...usePublicationDraftStore.getState().basicInfo, publicationType: ready.publicationType });
  if (seed.kind === "composition") store.setCompositionId(seed.id);
  if (seed.kind === "playlist") store.setPlaylistId(seed.id);
  if (seed.kind === "asset") {
    store.setAssetItems([{
      media_asset_id: seed.id,
      duration_seconds: ready.publicationType === "image" ? DEFAULT_IMAGE_DURATION_SECONDS : null,
      transition: "cut",
    }]);
  }
  store.setStep(2);
}

export function useCreateDraftEntry(input: {
  hasHydrated: boolean;
  idParam: string | null;
  seed: PublicationSeed | null;
  assets: MediaAsset[];
  assetsLoading: boolean;
  assetsError: string | null;
  loadingChannels: boolean;
  channelsError: string | null;
  revisionConflict: string | null;
  setRevisionConflict: (message: string | null) => void;
  persistDraft: (forPublish: boolean) => Promise<DraftPersistResult>;
}) {
  const router = useRouter();
  const captured = useRef(false);
  const resolved = useRef(false);
  const saving = useRef(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [readySeed, setReadySeed] = useState<ReadySeed | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    if (!input.hasHydrated || captured.current) return;
    captured.current = true;
    const state = usePublicationDraftStore.getState();
    const initial: Entry = {
      seed: input.seed,
      isEditMode: Boolean(input.idParam),
      unfinished: hasUnfinishedDraft(state, isDraftDirty(state)),
      hasServerDraft: Boolean(state.publicationId),
    };
    // ADR 0086 §5: capture once; our own URL replacements never start a new visit.
    void Promise.resolve().then(() => {
      if (!initial.isEditMode && !initial.seed && !initial.unfinished && initial.hasServerDraft) state.cancelDraft();
      setEntry(initial);
    });
  }, [input.hasHydrated, input.idParam, input.seed]);

  // #228: only an Asset seed reads the list; Composition/Playlist seeds must not refetch on every list update.
  const isAssetSeed = entry?.seed?.kind === "asset";
  const assets = isAssetSeed ? input.assets : null;
  const assetsError = isAssetSeed ? input.assetsError : null;
  const assetsLoading = isAssetSeed ? input.assetsLoading : false;

  useEffect(() => {
    if (!entry || !entry.seed || resolved.current) return;
    const seed = entry.seed;
    if (entry.isEditMode) {
      resolved.current = true;
      router.replace(`${CREATE_URL}?id=${encodeURIComponent(input.idParam ?? "")}`);
      return;
    }
    if (seed.kind === "asset" && assetsLoading) return;
    let alive = true;
    const loadSeed = async (): Promise<ReadySeed> => {
      if (seed.kind === "composition") {
        const detail = await fetchComposition(seed.id);
        return { name: detail.name, publicationType: "composition" };
      }
      if (seed.kind === "playlist") {
        const detail = await fetchPlaylist(seed.id);
        return { name: detail.name, publicationType: "playlist" };
      }
      const asset = assets?.find((item) => item.id === seed.id);
      if (assetsError || !asset) throw new Error("ไม่พบ media ที่เลือก");
      return { name: asset.title ?? asset.file?.original_filename ?? asset.id, publicationType: isImageAsset(asset) ? "image" : "video" };
    };
    void loadSeed().then((ready) => {
      if (!alive || resolved.current) return;
      setReadySeed(ready);
      if (resolveSeed({ seedPresent: true, isEditMode: false, draftHasUnfinishedWork: entry.unfinished, choice: null }) === "apply") {
        resolved.current = true;
        applySeed(seed, ready);
        setDismissed(true);
        router.replace(CREATE_URL);
      }
    }).catch(() => {
      if (!alive || resolved.current) return;
      // ADR 0086 §6: the old draft survives even a clean-draft seed failure.
      resolved.current = true;
      setSeedError("โหลด content ที่ส่งมาจาก editor ไม่สำเร็จ กรุณาลองเลือกใหม่");
      setDismissed(true);
      router.replace(CREATE_URL);
    });
    return () => { alive = false; };
  }, [entry, assets, assetsError, assetsLoading, input.idParam, router]);

  const continueDraft = () => {
    if (saving.current) return;
    resolved.current = true;
    setDismissed(true);
    if (entry?.seed) router.replace(CREATE_URL);
  };

  const handleUseContent = async () => {
    if (saving.current || !entry || (entry.seed && !readySeed)) return;
    saving.current = true;
    setBusy(true);
    setPromptError(null);
    try {
      const state = usePublicationDraftStore.getState();
      if (state.publicationId) {
        if (input.loadingChannels) throw new DraftSaveError("กำลังโหลด Channels กรุณารอสักครู่");
        if (input.channelsError) throw new DraftSaveError(input.channelsError);
        if (!state.basicInfo.name.trim()) throw new DraftSaveError("กรุณากรอกชื่อ Program ก่อนบันทึกร่าง");
        // ADR 0086 §3: save like a stepper jump, without validateStep.
        const saved = requireCompleteDraftSave(await input.persistDraft(false));
        state.markSaved(saved.draft);
        if (isDraftDirty(usePublicationDraftStore.getState())) {
          throw new DraftSaveError("มีการแก้ไขระหว่างบันทึก กรุณาลองอีกครั้งหรือทำต่อจาก draft เดิม");
        }
      }
      resolved.current = true;
      if (entry.seed && readySeed) applySeed(entry.seed, readySeed);
      else usePublicationDraftStore.getState().cancelDraft();
      setDismissed(true);
      if (entry.seed) router.replace(CREATE_URL);
    } catch (error) {
      const classified = classifyApiError(error, "บันทึก draft เดิมไม่สำเร็จ กรุณาลองอีกครั้ง");
      setPromptError(error instanceof DraftSaveError || classified.kind === "conflict"
        ? classified.message : "บันทึก draft เดิมไม่สำเร็จ กรุณาลองอีกครั้ง");
      setConflict(classified.kind === "conflict");
      if (classified.kind === "conflict") input.setRevisionConflict(classified.message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  const genericLabel = entry?.seed?.kind === "composition" ? "Use the published Layout"
    : entry?.seed?.kind === "playlist" ? "Use the published Playlist" : "Use the published media";
  return {
    isInitializing: !entry || Boolean(!entry.unfinished && entry.seed && !entry.isEditMode && !dismissed),
    seedError,
    prompt: {
      open: shouldShowResumePrompt({ hadUnfinishedWorkAtHydration: entry?.unfinished ?? false, isEditMode: entry?.isEditMode ?? true, dismissed }),
      label: entry?.seed ? readySeed?.name ? `Use ${readySeed.name}` : genericLabel : "Start a new Program",
      hasServerDraft: entry?.hasServerDraft ?? false,
      busy,
      waiting: Boolean(entry?.seed && !readySeed) || Boolean(entry?.hasServerDraft && input.loadingChannels),
      conflict: conflict || Boolean(input.revisionConflict),
      error: promptError || (entry?.hasServerDraft ? input.channelsError : null),
      onUse: () => { void handleUseContent(); },
      onContinue: continueDraft,
    },
  };
}
