"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@/components/ui/icons";
import { fetchCampaigns, fetchMediaAssets, fetchTags } from "@/lib/api/media-api";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import type { Campaign, MediaAsset, Tag } from "@/types/domain";
import { hasDraftContent, useDraftHydrated, usePlaylistDraftStore } from "../store/usePlaylistDraftStore";
import {
  createPlaylist,
  fetchPlaylist,
  fetchPlaylists,
  setPlaylistItems,
  updatePlaylist,
} from "../services/playlists-api";
import { encodeMetadata } from "../metadata";
import { isNameTaken, validateStep, type WizardStepId } from "../step-validation";
import { LAST_STEP, PlaylistStepper } from "./PlaylistStepper";
import { BasicInfoStep } from "./BasicInfoStep";
import { ContentStep } from "./ContentStep";
import { SettingsStep } from "./SettingsStep";
import { ReviewStep } from "./ReviewStep";
import { PlaylistSummary } from "./PlaylistSummary";

function detailToDraftItems(items: { media_asset_id: string; title?: string; position: number; duration_seconds?: number | null; transition?: string }[]) {
  return [...items]
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      mediaAssetId: item.media_asset_id,
      title: item.title,
      durationSeconds: item.duration_seconds ?? null,
      transition: item.transition === "cut" ? ("cut" as const) : ("fade" as const),
    }));
}

export function CreatePlaylistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const hydrated = useDraftHydrated();
  const draft = usePlaylistDraftStore();
  const { step, name, info, items, editingId, playlistId } = draft;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  // Every existing playlist name in the tenant. UNIQUE (tenant_id, name) is enforced in
  // Postgres and the RPC reports the violation as an opaque 500, so the collision has to
  // be caught before submit — see docs/playlists/plan-playlist-ui.md.
  const [existingNames, setExistingNames] = useState<{ id: string; name: string }[]>([]);

  const [resumeError, setResumeError] = useState<ClassifiedError | null>(null);
  const [resuming, setResuming] = useState(!!idParam);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ClassifiedError | null>(null);
  const [retryOnly, setRetryOnly] = useState(false);
  const loadedIdRef = useRef<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      fetchCampaigns(),
      fetchTags(),
      fetchMediaAssets(),
      fetchPlaylists(),
    ]).then(([c, t, a, p]) => {
      if (c.status === "fulfilled") setCampaigns(c.value);
      if (t.status === "fulfilled") setTags(t.value);
      if (a.status === "fulfilled") setAssets(a.value);
      if (p.status === "fulfilled") {
        setExistingNames(p.value.map((pl) => ({ id: pl.id, name: pl.name })));
      }
      setAssetsLoading(false);
    });
  }, []);

  // Edit mode: ?id= prefills from the API and overwrites whatever local draft exists.
  useEffect(() => {
    if (!hydrated || !idParam || loadedIdRef.current === idParam) return;
    loadedIdRef.current = idParam;
    let alive = true;

    fetchPlaylist(idParam)
      .then((detail) => {
        if (!alive) return;
        draft.reset();
        draft.setName(detail.name);
        draft.setItems(detailToDraftItems(detail.items));
        draft.setPlaylistId(detail.id);
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

  const showDraftBanner =
    !idParam && !editingId && !dismissedBanner && hasDraftContent(draft) && step === 1;

  // The playlist being edited keeps its own name; every other name in the tenant is taken.
  const takenNames = existingNames.filter((p) => p.id !== editingId).map((p) => p.name);

  const validatableDraft = { name, description: info.description, items, takenNames };

  const goNext = () => {
    if (step >= LAST_STEP) return;
    const result = validateStep(step as WizardStepId, validatableDraft);
    setValidationErrors(result.errors);
    if (!result.valid) return;
    draft.setStep(step + 1);
  };

  const goBack = () => {
    if (step > 1) {
      draft.setStep(step - 1);
      return;
    }
    router.push("/playlists");
  };

  const buildItemPayload = () =>
    items.map((item, index) => ({
      media_asset_id: item.mediaAssetId,
      position: index,
      ...(item.durationSeconds != null ? { duration_seconds: item.durationSeconds } : {}),
      transition: item.transition,
    }));

  const handleSubmit = async () => {
    setSubmitError(null);

    // Re-checked here and not only on step 1: the list was read when the wizard opened, and
    // someone else may have taken the name since. Catching it before the write turns an
    // opaque 500 into a sentence the operator can act on.
    if (!retryOnly && isNameTaken(name, takenNames)) {
      setValidationErrors([]);
      setSubmitError({
        kind: "rejected",
        message: "มี playlist ชื่อนี้อยู่แล้ว กรุณากลับไปขั้นตอน Basic Info แล้วเปลี่ยนชื่อ",
      });
      return;
    }

    setSubmitting(true);
    try {
      const metadata = encodeMetadata({ info, playback: draft.playback });

      let id = playlistId ?? editingId;
      if (!retryOnly) {
        if (editingId) {
          await updatePlaylist(editingId, { name: name.trim(), metadata });
          id = editingId;
        } else {
          const created = await createPlaylist({ name: name.trim(), metadata });
          id = created.playlist_id;
          draft.setPlaylistId(id);
        }
      }
      if (!id) throw new Error("missing playlist id");

      await setPlaylistItems(id, buildItemPayload());

      draft.reset();
      router.push("/playlists");
    } catch (err) {
      // Once the playlist row exists, only the items call needs retrying — retrying the
      // whole thing would hit UNIQUE(tenant_id, name) on a fresh create.
      const rowExists = !!(playlistId ?? editingId);
      setRetryOnly(rowExists);
      const classified = classifyApiError(err, "สร้าง playlist ไม่สำเร็จ");
      // The name-write RPC masks a UNIQUE (tenant_id, name) violation as a generic
      // failure (`callMedia` only passes through its own EXPECTED_ERROR prefixes), so a
      // failure on the name write with no row created is most likely a duplicate name.
      // Phase 2 makes the RPC say so itself; until then, say it here.
      setSubmitError(
        !rowExists && classified.kind === "retryable"
          ? {
              kind: "rejected",
              message:
                "บันทึกไม่สำเร็จ — สาเหตุที่พบบ่อยที่สุดคือมี playlist ชื่อนี้อยู่แล้ว ลองเปลี่ยนชื่อในขั้นตอน Basic Info",
            }
          : classified
      );
    } finally {
      setSubmitting(false);
    }
  };

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <BasicInfoStep campaigns={campaigns} workspaceTags={tags} takenNames={takenNames} />
        );
      case 2:
        return <ContentStep assets={assets} loading={assetsLoading} />;
      case 3:
        return <SettingsStep />;
      case 4:
        return (
          <ReviewStep
            assets={assets}
            campaigns={campaigns}
            workspaceTags={tags}
            takenNames={takenNames}
          />
        );
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
      />

      {showDraftBanner && (
        <Card className="flex items-center justify-between gap-4 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            มี draft ที่ทำค้างไว้อยู่ — ต้องการทำต่อ หรือเริ่มใหม่
          </p>
          <span className="flex shrink-0 gap-2">
            <Button variant="secondary" onClick={() => setDismissedBanner(true)}>
              ทำต่อ
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                draft.reset();
                setDismissedBanner(true);
              }}
            >
              เริ่มใหม่
            </Button>
          </span>
        </Card>
      )}

      <Card className="p-5">
        <PlaylistStepper currentStep={step} onStepClick={(s) => draft.setStep(s)} />
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {stepContent()}

          {validationErrors.length > 0 && (
            <Card className="border-red-200 p-4 dark:border-red-900">
              <ul className="list-inside list-disc text-sm text-red-600 dark:text-red-400">
                {validationErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Card>
          )}

          {submitError && (
            <Card className="border-red-200 p-4 dark:border-red-900">
              <p className="text-sm text-red-600 dark:text-red-400">{submitError.message}</p>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={goBack} disabled={submitting}>
              <ArrowLeftIcon className="h-4 w-4" />
              {step === 1 ? "Back: Playlists" : "Back"}
            </Button>

            {step < LAST_STEP ? (
              <Button onClick={goNext}>
                Next
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  "กำลังบันทึก..."
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {retryOnly ? "ลองใหม่" : editingId ? "Save Changes" : "Create Playlist"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <PlaylistSummary assets={assets} campaigns={campaigns} workspaceTags={tags} />
      </div>
    </div>
  );
}
