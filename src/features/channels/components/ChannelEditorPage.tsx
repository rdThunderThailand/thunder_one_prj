"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NoAccess } from "@/components/ui/NoAccess";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchPlaylists } from "@/lib/api/media-api";
import {
  getDeviceCompatibility,
  mergeChannelDeviceCandidates,
  mergeChannelTypeOptions,
  shouldConfirmResolutionMismatch,
  validateChannelDraft,
} from "../channel-logic";
import {
  createChannel,
  fetchChannel,
  fetchChannelDeviceCandidates,
  fetchChannelReferenceData,
  updateChannel,
} from "../services/channels-api";
import type {
  ChannelCategory,
  ChannelDetail,
  ChannelDeviceCandidate,
  ChannelDraftInput,
  ChannelLifecycle,
  ChannelReferenceData,
} from "../types";
import {
  ChannelBasicInfoSection,
  type ChannelBasicInfoValue,
} from "./ChannelBasicInfoSection";
import { ChannelDeviceAssignmentSection } from "./ChannelDeviceAssignmentSection";
import {
  ChannelDisplayExpectationSection,
  type ChannelDisplayExpectationValue,
} from "./ChannelDisplayExpectationSection";
import { ChannelEditorSummary } from "./ChannelEditorSummary";

interface ChannelFormValue extends ChannelBasicInfoValue, ChannelDisplayExpectationValue {
  deviceIds: string[];
}

interface EditorData {
  detail: ChannelDetail | null;
  references: ChannelReferenceData;
  devices: ChannelDeviceCandidate[];
  playlists: { id: string; name: string }[];
}

const emptyForm: ChannelFormValue = {
  name: "",
  category: "in_store",
  channelTypeId: "",
  locationId: "",
  description: "",
  deviceIds: [],
  orientation: null,
  resolution: null,
  defaultPlaylistId: "",
};

function mergePlaylistOptions(
  playlists: { id: string; name: string }[],
  detail: ChannelDetail | null,
): { id: string; name: string }[] {
  if (!detail?.default_playlist) return playlists;
  return playlists.some((playlist) => playlist.id === detail.default_playlist?.id)
    ? playlists
    : [...playlists, detail.default_playlist];
}

function detailToForm(detail: ChannelDetail): ChannelFormValue {
  return {
    name: detail.name,
    category: detail.category,
    channelTypeId: detail.channel_type?.id ?? "",
    locationId: detail.location?.id ?? "",
    description: detail.description ?? "",
    deviceIds: detail.devices.map((device) => device.id),
    orientation: detail.expected_orientation,
    resolution: detail.expected_resolution,
    defaultPlaylistId: detail.default_playlist?.id ?? "",
  };
}

function toDraft(
  form: ChannelFormValue,
  devices: readonly ChannelDeviceCandidate[],
  resolutionConfirmations: ReadonlySet<string>,
): ChannelDraftInput {
  const selectedDevices = devices.filter((device) => form.deviceIds.includes(device.id));
  return {
    name: form.name,
    description: form.description.trim() || null,
    category: form.category,
    channel_type_id: form.channelTypeId,
    location_id: form.locationId || null,
    device_ids: form.deviceIds,
    expected_orientation: form.orientation,
    expected_resolution: form.resolution,
    default_playlist_id: form.defaultPlaylistId || null,
    confirm_mismatch: shouldConfirmResolutionMismatch(
      selectedDevices,
      form.resolution,
      resolutionConfirmations,
    ),
  };
}

function isSupportedCategory(category: ChannelCategory): category is "dooh" | "in_store" {
  return category === "dooh" || category === "in_store";
}

function EditorSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        {[280, 360, 240].map((height) => (
          <Card key={height} className="p-5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-3 h-5 w-60" />
            <Skeleton className="mt-5 w-full" />
            <div style={{ height }} />
          </Card>
        ))}
      </div>
      <Card className="h-96 p-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-12 w-full" />
      </Card>
    </div>
  );
}

function EditorLoadError({
  error,
  retrying,
  onRetry,
}: {
  error: ClassifiedError;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <Card className="border-red-200 p-8 text-center dark:border-red-900/70">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Channel editor is unavailable
      </p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-red-600 dark:text-red-400">
        {error.message}
      </p>
      <Button variant="secondary" className="mt-4" disabled={retrying} onClick={onRetry}>
        {retrying ? "Retrying…" : "Retry"}
      </Button>
    </Card>
  );
}

function UnsupportedCategoryState({ category }: { category: "online" | "social" }) {
  return (
    <Card className="border-amber-300 p-8 text-center dark:border-amber-800">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        This Channel category is not supported by the Physical Device editor
      </p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
        {category === "online" ? "Online" : "Social"} Channels require a different endpoint editor.
        This page will not submit a category that its controls cannot display.
      </p>
      <Link href="/channels" className={buttonClasses("secondary", "mt-4")}>
        Back to Channels
      </Link>
    </Card>
  );
}

function ChannelEditor({ channelId }: { channelId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(channelId);
  const [data, setData] = useState<EditorData | null>(null);
  const [form, setForm] = useState<ChannelFormValue>(emptyForm);
  const [revision, setRevision] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);
  const [unsupportedCategory, setUnsupportedCategory] = useState<"online" | "social" | null>(null);
  const [saveError, setSaveError] = useState<ClassifiedError | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<"name" | "channel_type_id", string>>
  >({});
  const [compatibilityError, setCompatibilityError] = useState<string | null>(null);
  const [resolutionConfirmations, setResolutionConfirmations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const requestGenerationRef = useRef(0);
  const mutationInFlightRef = useRef(false);

  const beginMutation = () => {
    if (mutationInFlightRef.current) return false;
    mutationInFlightRef.current = true;
    setSaving(true);
    return true;
  };

  const endMutation = () => {
    mutationInFlightRef.current = false;
    setSaving(false);
  };

  const fetchEditorData = useCallback(async (): Promise<EditorData> => {
    const [detail, references, devices, playlists] = await Promise.all([
      channelId ? fetchChannel(channelId) : Promise.resolve(null),
      fetchChannelReferenceData(),
      fetchChannelDeviceCandidates(),
      fetchPlaylists(),
    ]);
    return {
      detail,
      references: {
        ...references,
        channel_types: mergeChannelTypeOptions(
          references.channel_types,
          detail?.channel_type ?? null,
        ),
      },
      devices: mergeChannelDeviceCandidates(devices, detail?.devices ?? []),
      playlists: mergePlaylistOptions(playlists, detail),
    };
  }, [channelId]);

  const applyEditorData = useCallback((nextData: EditorData) => {
    const { detail } = nextData;
    if (detail && !isSupportedCategory(detail.category)) {
      setData(null);
      setUnsupportedCategory(detail.category);
      setLoadError(null);
      return;
    }
    setData(nextData);
    setUnsupportedCategory(null);
    setLoadError(null);
    setForm(detail ? detailToForm(detail) : emptyForm);
    setRevision(detail?.revision ?? null);
    setResolutionConfirmations(new Set());
    setValidationErrors({});
    setCompatibilityError(null);
    setSaveError(null);
  }, []);

  const runEditorLoad = useCallback((generation: number) => {
    fetchEditorData()
      .then((nextData) => {
        if (requestGenerationRef.current === generation) applyEditorData(nextData);
      })
      .catch((caught) => {
        if (requestGenerationRef.current !== generation) return;
        setLoadError(
          classifyApiError(
            caught,
            isEdit ? "Could not load this Channel. Try again." : "Could not load Channel options. Try again.",
          ),
        );
      })
      .finally(() => {
        if (requestGenerationRef.current === generation) setLoading(false);
      });
  }, [applyEditorData, fetchEditorData, isEdit]);

  useEffect(() => {
    const generation = ++requestGenerationRef.current;
    runEditorLoad(generation);
    return () => {
      requestGenerationRef.current += 1;
    };
  }, [runEditorLoad]);

  const retryLoad = () => {
    const generation = ++requestGenerationRef.current;
    setLoading(true);
    setLoadError(null);
    setUnsupportedCategory(null);
    setData(null);
    runEditorLoad(generation);
  };

  const selectedDevices = useMemo(
    () => data?.devices.filter((device) => form.deviceIds.includes(device.id)) ?? [],
    [data, form.deviceIds],
  );
  const selectedType = data?.references.channel_types.find(
    (option) => option.id === form.channelTypeId,
  );
  const selectedLocation = data?.references.locations.find(
    (option) => option.id === form.locationId,
  );
  const selectedPlaylist = data?.playlists.find(
    (option) => option.id === form.defaultPlaylistId,
  );

  const validateForSave = (draft: ChannelDraftInput): boolean => {
    const fieldErrors = validateChannelDraft(draft);
    setValidationErrors(fieldErrors);

    const selected = data?.devices.filter((device) => draft.device_ids.includes(device.id)) ?? [];
    const orientationMismatch = selected.some(
      (device) =>
        getDeviceCompatibility(device, form.orientation, form.resolution) ===
        "orientation-mismatch",
    );
    const unconfirmedResolution = selected.some(
      (device) =>
        form.resolution !== null &&
        device.resolution !== null &&
        device.resolution !== form.resolution &&
        !resolutionConfirmations.has(device.id),
    );

    const nextCompatibilityError = orientationMismatch
      ? "Remove devices whose reported orientation conflicts with this Channel expectation."
      : unconfirmedResolution
        ? "Confirm each selected resolution mismatch before saving."
        : null;
    setCompatibilityError(nextCompatibilityError);
    return Object.keys(fieldErrors).length === 0 && nextCompatibilityError === null;
  };

  const saveDraft = async (
    draft: ChannelDraftInput,
    expectedRevision?: number,
    overwrite = false,
  ) => {
    if (channelId) {
      if (!expectedRevision || expectedRevision <= 0) {
        setSaveError({
          kind: "rejected",
          message: "This Channel has no valid revision. Reload it before saving.",
        });
        return false;
      }
      await updateChannel(channelId, draft, expectedRevision, overwrite);
    } else {
      await createChannel(draft);
    }
    return true;
  };

  const handleSave = async () => {
    if (mutationInFlightRef.current) return;
    setSaveError(null);
    const draft = toDraft(form, data?.devices ?? [], resolutionConfirmations);
    if (!validateForSave(draft)) return;
    if (!beginMutation()) return;
    try {
      const saved = await saveDraft(draft, revision ?? undefined, false);
      if (saved) router.push("/channels");
    } catch (caught) {
      setSaveError(
        classifyApiError(
          caught,
          isEdit ? "Could not save Channel changes. Try again." : "Could not create Channel. Try again.",
        ),
      );
    } finally {
      endMutation();
    }
  };

  const reloadConflict = async () => {
    if (!channelId || !beginMutation()) return;
    try {
      const [detail, devices, references] = await Promise.all([
        fetchChannel(channelId),
        fetchChannelDeviceCandidates(),
        fetchChannelReferenceData(),
      ]);
      if (!data) return;
      applyEditorData({
        ...data,
        detail,
        references: {
          ...references,
          channel_types: mergeChannelTypeOptions(
            references.channel_types,
            detail.channel_type,
          ),
        },
        devices: mergeChannelDeviceCandidates(devices, detail.devices),
        playlists: mergePlaylistOptions(data.playlists, detail),
      });
    } catch (caught) {
      setSaveError(classifyApiError(caught, "Could not reload the latest Channel. Try again."));
    } finally {
      endMutation();
    }
  };

  const overwriteConflict = async () => {
    if (!channelId || mutationInFlightRef.current) return;
    const draft = toDraft(form, data?.devices ?? [], resolutionConfirmations);
    if (!validateForSave(draft)) return;
    if (!beginMutation()) return;
    try {
      const latest = await fetchChannel(channelId);
      if (!isSupportedCategory(latest.category)) {
        setSaveError({
          kind: "rejected",
          message: "The latest Channel category is not supported by this Physical Device editor. Reload before continuing.",
        });
        return;
      }
      await updateChannel(channelId, draft, latest.revision, true);
      router.push("/channels");
    } catch (caught) {
      setSaveError(classifyApiError(caught, "Could not overwrite the latest Channel. Try again."));
    } finally {
      endMutation();
    }
  };

  const updateDisplay = (next: ChannelDisplayExpectationValue) => {
    setForm((current) => ({ ...current, ...next }));
    setResolutionConfirmations(new Set());
    setCompatibilityError(null);
  };

  const lifecycle: ChannelLifecycle = data?.detail?.lifecycle ?? "draft";
  const title = isEdit ? "Edit Channel" : "Create Channel";
  const subtitle = isEdit
    ? "Update identity, Physical Device assignment and display expectations."
    : "Configure a physical delivery Channel for future Publications.";

  useEffect(() => {
    const summaryId = compatibilityError ? "channel-compatibility-error" : saveError ? "channel-save-error" : null;
    if (summaryId) document.getElementById(summaryId)?.focus();
  }, [compatibilityError, saveError]);

  return (
    <div data-testid="channel-editor" className="flex flex-col gap-5">
      <div className="space-y-3">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-zinc-400">
          <Link href="/channels" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Channels
          </Link>
          <span className="mx-2 text-zinc-300 dark:text-zinc-700">/</span>
          <span className="text-indigo-600 dark:text-indigo-400">{isEdit ? "Edit" : "Create"}</span>
        </nav>
        <PageHeader
          title={title}
          subtitle={subtitle}
          actions={
            <>
              <Link href="/channels" className={buttonClasses("secondary")}>
                <ArrowLeftIcon />
                Cancel
              </Link>
              <Button
                type="submit"
                form="channel-editor-form"
                disabled={loading || Boolean(loadError) || Boolean(unsupportedCategory) || saving}
              >
                {saving ? "Saving…" : isEdit ? "Save changes" : "Create Channel"}
              </Button>
            </>
          }
        />
      </div>

      {loading ? (
        <EditorSkeleton />
      ) : loadError?.kind === "forbidden" ? (
        <NoAccess message={loadError.message} />
      ) : loadError ? (
        <EditorLoadError error={loadError} retrying={loading} onRetry={retryLoad} />
      ) : unsupportedCategory ? (
        <UnsupportedCategoryState category={unsupportedCategory} />
      ) : data ? (
        <form
          id="channel-editor-form"
          aria-describedby={
            compatibilityError
              ? "channel-compatibility-error"
              : saveError
                ? "channel-save-error"
                : undefined
          }
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
          className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div className="min-w-0 space-y-5">
            {saveError && (
              <Card
                id="channel-save-error"
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
                className={`p-4 ${
                  saveError.kind === "conflict"
                    ? "border-amber-300 dark:border-amber-800"
                    : "border-red-200 dark:border-red-900/70"
                }`}
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {saveError.kind === "conflict" ? "Already modified" : "Channel was not saved"}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{saveError.message}</p>
                {saveError.kind === "conflict" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" disabled={saving} onClick={() => void reloadConflict()}>
                      Reload latest
                    </Button>
                    <Button type="button" disabled={saving} onClick={() => void overwriteConflict()}>
                      Overwrite latest
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {compatibilityError && (
              <Card
                id="channel-compatibility-error"
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
                className="border-amber-300 bg-amber-50/50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-500/5 dark:text-amber-300"
              >
                {compatibilityError}
              </Card>
            )}

            <ChannelBasicInfoSection
              value={form}
              channelTypes={data.references.channel_types}
              currentChannelTypeId={data.detail?.channel_type?.id ?? null}
              locations={data.references.locations}
              errors={validationErrors}
              onChange={(next) => {
                setForm((current) => ({ ...current, ...next }));
                setValidationErrors({});
              }}
            />

            <ChannelDeviceAssignmentSection
              devices={data.devices}
              selectedIds={form.deviceIds}
              expectedOrientation={form.orientation}
              expectedResolution={form.resolution}
              resolutionConfirmations={resolutionConfirmations}
              onToggle={(deviceId) => {
                setForm((current) => ({
                  ...current,
                  deviceIds: current.deviceIds.includes(deviceId)
                    ? current.deviceIds.filter((id) => id !== deviceId)
                    : [...current.deviceIds, deviceId],
                }));
                setCompatibilityError(null);
              }}
              onConfirmResolution={(deviceId, confirmed) => {
                setResolutionConfirmations((current) => {
                  const next = new Set(current);
                  if (confirmed) next.add(deviceId);
                  else next.delete(deviceId);
                  return next;
                });
                setCompatibilityError(null);
              }}
            />

            <ChannelDisplayExpectationSection
              value={form}
              playlists={data.playlists}
              onChange={updateDisplay}
            />
          </div>

          <ChannelEditorSummary
            lifecycle={lifecycle}
            category={form.category as ChannelCategory}
            typeName={
              selectedType
                ? `${selectedType.name}${selectedType.is_active === false ? " (Current — unavailable)" : ""}`
                : ""
            }
            locationName={selectedLocation?.name ?? ""}
            orientation={form.orientation}
            resolution={form.resolution}
            playlistName={selectedPlaylist?.name ?? ""}
            selectedDevices={selectedDevices}
            showOperationalStatus={isEdit}
          />
        </form>
      ) : null}
    </div>
  );
}

export function ChannelEditorPage({ channelId }: { channelId?: string }) {
  return <ChannelEditor key={channelId ?? "create"} channelId={channelId} />;
}
