"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { fetchCampaigns, fetchMediaAssets, fetchTags } from "@/lib/api/media-api";
import { classifyApiError, isConflict, type ClassifiedError } from "@/lib/api/api-error";
import type { Campaign, MediaAsset, Tag } from "@/types/domain";
import { hasDraftContent, useDraftHydrated, usePlaylistDraftStore } from "../store/usePlaylistDraftStore";
import { useResumeSnapshot } from "../hooks/useResumeSnapshot";
import { fetchPlaylist } from "../services/playlists-api";
import { validateStep, type WizardStepId } from "../step-validation";
import { usePlaylistDraftSave } from "../hooks/usePlaylistDraftSave";
import { playlistDetailToDraftFields } from "../draft-from-detail";
import { resumePromptKind } from "../resume-prompt";
import { LAST_STEP, PlaylistStepper } from "./PlaylistStepper";
import { BasicInfoStep } from "./BasicInfoStep";
import { ContentStep } from "./ContentStep";
import { ResumeDraftModal } from "./ResumeDraftModal";
import { UnsavedLeaveConfirm } from "./UnsavedLeaveConfirm";
import { RevisionConflictCard } from "./RevisionConflictCard";
import { CreatePlaylistActions } from "./CreatePlaylistActions";
import { SettingsStep } from "./SettingsStep";
import { ReviewStep } from "./ReviewStep";
import { PlaylistSummary } from "./PlaylistSummary";

export function CreatePlaylistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const hydrated = useDraftHydrated();
  const draft = usePlaylistDraftStore();
  const { step, name, info, items, editingId, playlistId, playback } = draft;
  const { persistDraft } = usePlaylistDraftSave();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [resumeError, setResumeError] = useState<ClassifiedError | null>(null);
  const [resuming, setResuming] = useState(!!idParam);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ClassifiedError | null>(null);
  const [revisionConflict, setRevisionConflict] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const loadedIdRef = useRef<string | null>(null);

  const { hadContentAtHydration, hadEditingIdAtHydration } = useResumeSnapshot(hydrated, draft);

  const loadAssets = useCallback(() => fetchMediaAssets().then((data) => setAssets(data)), []);

  useEffect(() => {
    Promise.allSettled([fetchCampaigns(), fetchTags(), loadAssets()]).then(([c, t]) => {
      if (c.status === "fulfilled") setCampaigns(c.value);
      if (t.status === "fulfilled") setTags(t.value);
      setAssetsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Edit mode: ?id= prefills from the API and overwrites whatever local draft exists.
  useEffect(() => {
    if (!hydrated || !idParam || loadedIdRef.current === idParam) return;
    loadedIdRef.current = idParam;
    let alive = true;

    fetchPlaylist(idParam)
      .then((detail) => {
        if (!alive) return;
        const fields = playlistDetailToDraftFields(detail);
        draft.reset();
        draft.loadDraft(fields);
        usePlaylistDraftStore.setState({ editingId: detail.id, step: 1 });
      })
      .catch((err) => {
        if (alive) setResumeError(classifyApiError(err, "โหลด playlist ไม่สำเร็จ"));
      })
      .finally(() => {
        if (alive) setResuming(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, idParam]);

  if (!hydrated || resuming) {
    return <p className="p-6 text-sm text-zinc-400">กำลังโหลด...</p>;
  }

  if (resumeError) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-500">{resumeError.message}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push("/playlists")}>
          กลับไป Playlists
        </Button>
      </Card>
    );
  }

  const promptKind = resumePromptKind({
    hadContentAtHydration,
    hadEditingIdAtHydration,
    isUrlEditMode: !!idParam,
    dismissed: dismissedBanner,
  });

  const validatableDraft = { name, description: info.description, items, playback };

  // Walking the wizard is local-only: a draft row exists only once the operator asks for
  // one with Save Draft (docs/adr/0014). localStorage carries the work until then.
  const goNext = () => {
    if (step >= LAST_STEP) return;
    const result = validateStep(step as WizardStepId, validatableDraft);
    setValidationErrors(result.errors);
    if (!result.valid) {
      if (step === 1) setShowFieldErrors(true);
      return;
    }
    setShowFieldErrors(false);
    draft.setStep(step + 1);
  };

  // Deliberately skips validateStep — saving work that is not yet complete is the
  // whole point. Only the name is required, because the endpoint refuses an empty one.
  const saveDraft = async () => {
    if (!name.trim()) {
      // Inline card only — same one-surface intent as the revision-conflict branch below.
      setSubmitError({ kind: "rejected", message: "กรุณากรอกชื่อ playlist ก่อนบันทึกร่าง" });
      return;
    }
    setSavingDraft(true);
    setSubmitError(null);
    setRevisionConflict(null);
    try {
      await persistDraft({ activate: false });
      toast.success("บันทึกร่างแล้ว");
    } catch (err) {
      // The revision-conflict banner already shows this — avoid saying it twice.
      if (err instanceof Error && isConflict(err.message)) {
        setRevisionConflict(classifyApiError(err, err.message).message);
      } else {
        const classified = classifyApiError(err, "บันทึกร่างไม่สำเร็จ");
        setSubmitError(classified);
        toast.error(classified.message);
      }
    } finally {
      setSavingDraft(false);
    }
  };

  // Stepping backwards inside the wizard keeps the draft, so only leaving it is worth a
  // confirmation: the store holds one draft for the whole app, and opening another playlist
  // resets it. No `beforeunload` — the draft is in localStorage, a refresh loses nothing.
  const goBack = () => {
    if (step > 1) {
      draft.setStep(step - 1);
      return;
    }
    if (hasDraftContent(draft)) {
      setConfirmLeave(true);
      return;
    }
    router.push("/playlists");
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setRevisionConflict(null);
    setSubmitting(true);
    try {
      await persistDraft({ activate: true });
      draft.reset();
      router.push("/playlists");
    } catch (err) {
      if (err instanceof Error && isConflict(err.message)) {
        setRevisionConflict(classifyApiError(err, err.message).message);
      } else {
        setSubmitError(classifyApiError(err, "สร้าง playlist ไม่สำเร็จ"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepContent = () => {
    switch (step) {
      case 1:
        return <BasicInfoStep campaigns={campaigns} workspaceTags={tags} showErrors={showFieldErrors} />;
      case 2:
        return <ContentStep assets={assets} loading={assetsLoading} onAssetUploaded={loadAssets} />;
      case 3:
        return <SettingsStep />;
      case 4:
        return <ReviewStep assets={assets} campaigns={campaigns} workspaceTags={tags} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Create Playlist"
        subtitle={
          step === 1
            ? "Set up the basic information for your playlist."
            : step === 2
              ? "Add and arrange media to build your playlist."
              : step === 3
                ? "Configure playback and display options for your playlist."
                : "Review playlist details and confirm before creating."
        }
        actions={
          <CreatePlaylistActions
            step={step}
            lastStep={LAST_STEP}
            isEditing={Boolean(editingId)}
            savingDraft={savingDraft}
            submitting={submitting}
            onBack={goBack}
            onSaveDraft={saveDraft}
            onNext={goNext}
            onSubmit={handleSubmit}
          />
        }
      />

      <ResumeDraftModal
        kind={promptKind}
        playlistName={name}
        onResume={() => setDismissedBanner(true)}
        onStartFresh={() => {
          draft.reset();
          setDismissedBanner(true);
        }}
      />

      {confirmLeave && (
        <UnsavedLeaveConfirm
          onStay={() => setConfirmLeave(false)}
          onLeave={() => router.push("/playlists")}
        />
      )}

      <Modal
        open={step === 2 && validationErrors.length > 0}
        onClose={() => setValidationErrors([])}
        title="ยังไม่ได้เลือก media"
        footer={<Button variant="primary" onClick={() => setValidationErrors([])}>เลือก media</Button>}
      >
        {validationErrors.map((err, idx) => (<p key={idx}>{err}</p>))}
      </Modal>

      <Card className="p-5">
        <PlaylistStepper currentStep={step} onStepClick={(s) => draft.setStep(s)} />
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {stepContent()}

          {submitError && (
            <Card className="border-red-200 p-4 dark:border-red-900">
              <p className="text-sm text-red-600 dark:text-red-400">{submitError.message}</p>
            </Card>
          )}

          {revisionConflict && (
            <RevisionConflictCard
              message={revisionConflict}
              onReload={async () => {
                const id = playlistId ?? editingId;
                if (!id) return;
                const fresh = await fetchPlaylist(id);
                draft.loadDraft(playlistDetailToDraftFields(fresh));
                setRevisionConflict(null);
              }}
            />
          )}
        </div>

        <PlaylistSummary assets={assets} campaigns={campaigns} workspaceTags={tags} />
      </div>
    </div>
  );
}
