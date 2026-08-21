import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { classifyApiError, isDuplicateName, type ClassifiedError } from "@/lib/api/api-error";
import { getDeviceCompatibility, mergeChannelDeviceCandidates, mergeChannelTypeOptions, validateChannelDraft } from "../channel-logic";
import {
  createChannel,
  fetchChannel,
  fetchChannelDeviceCandidates,
  fetchChannelReferenceData,
  updateChannel,
} from "../services/channels-api";
import type { ChannelDetail, ChannelDraftInput } from "../types";
import type { ChannelBasicInfoValue } from "../components/ChannelBasicInfoSection";
import type { ChannelDisplayExpectationValue } from "../components/ChannelDisplayExpectationSection";
import { DUPLICATE_NAME_MESSAGE, isSupportedCategory, mergePlaylistOptions, toDraft } from "./editor-mapping";
import { useChannelEditorData, type ChannelFormValue } from "./useChannelEditorData";

export type { ChannelFormValue };

/** `classifyApiError` flattens every `Invalid input:` guard into one generic sentence, so the
 * commit guard that names the missing device has to be recognised on the raw message first. */
function isMissingDevices(message: string): boolean {
  return message.includes("at least one media device is required");
}

export function useChannelEditor(channelId: string | undefined) {
  const router = useRouter();

  const [saveError, setSaveError] = useState<ClassifiedError | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<"name" | "channel_type_id", string>>
  >({});
  const [compatibilityError, setCompatibilityError] = useState<string | null>(null);
  const [deviceAlert, setDeviceAlert] = useState(false);
  const [resolutionConfirmations, setResolutionConfirmations] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const mutationInFlightRef = useRef(false);

  // Reset save-side state whenever a full dataset is (re)applied — initial load, retry,
  // or reloadConflict. Fired synchronously from useChannelEditorData, not from an effect
  // watching `data`: updateDetail (lifecycle actions) also replaces `data` but must leave
  // in-progress form edits untouched.
  const resetSaveState = useCallback(() => {
    setResolutionConfirmations(new Set());
    setValidationErrors({});
    setCompatibilityError(null);
    setSaveError(null);
  }, []);

  const editorData = useChannelEditorData(channelId, resetSaveState);
  const { data, form, setForm, revision, applyEditorData, updateDetail, isEdit } = editorData;

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

  const validateForSave = (draft: ChannelDraftInput): boolean => {
    const fieldErrors = validateChannelDraft(draft);
    setValidationErrors(fieldErrors);

    const selected = data?.devices.filter((device) => draft.device_ids.includes(device.id)) ?? [];
    const orientationMismatch = selected.some(
      (device) => getDeviceCompatibility(device, form.orientation, form.resolution) === "orientation-mismatch",
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

  const saveDraft = async (draft: ChannelDraftInput, expectedRevision?: number, overwrite = false) => {
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

  /**
   * `asDraft` is which button was pressed (ADR 0037): `true` stages a Draft, `false` commits the
   * Channel and reserves its devices, `null` leaves the stage of an already-created Channel alone.
   */
  const handleSave = async (asDraft: boolean | null) => {
    if (mutationInFlightRef.current) return;
    setSaveError(null);
    const draft = toDraft(form, data?.devices ?? [], resolutionConfirmations, asDraft);
    if (!validateForSave(draft)) return;
    if (!beginMutation()) return;
    try {
      const saved = await saveDraft(draft, revision ?? undefined, false);
      if (saved) router.push("/channels");
    } catch (caught) {
      // A name collision belongs on the name field, not in the summary card at the top of the form.
      if (caught instanceof Error && isDuplicateName(caught.message)) {
        setValidationErrors((current) => ({ ...current, name: DUPLICATE_NAME_MESSAGE }));
        return;
      }
      // Committing without a device is refused by the RPC. The Device Assignment section is where
      // that is fixed, so the error goes there rather than into the summary card.
      if (caught instanceof Error && isMissingDevices(caught.message)) {
        setDeviceAlert(true);
        return;
      }
      setSaveError(
        classifyApiError(caught, isEdit ? "Could not save Channel changes. Try again." : "Could not create Channel. Try again."),
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
          channel_types: mergeChannelTypeOptions(references.channel_types, detail.channel_type),
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
    const draft = toDraft(form, data?.devices ?? [], resolutionConfirmations, null);
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
      if (caught instanceof Error && isDuplicateName(caught.message)) {
        setValidationErrors((current) => ({ ...current, name: DUPLICATE_NAME_MESSAGE }));
        return;
      }
      setSaveError(classifyApiError(caught, "Could not overwrite the latest Channel. Try again."));
    } finally {
      endMutation();
    }
  };

  const handleLifecycleChanged = (detail: ChannelDetail) => updateDetail(detail);

  const updateBasicInfo = (next: ChannelBasicInfoValue) => {
    setForm((current) => ({ ...current, ...next }));
    setValidationErrors({});
  };

  const updateDisplay = (next: ChannelDisplayExpectationValue) => {
    setForm((current) => ({ ...current, ...next }));
    setResolutionConfirmations(new Set());
    setCompatibilityError(null);
  };

  const toggleDevice = (deviceId: string) => {
    setForm((current) => ({
      ...current,
      deviceIds: current.deviceIds.includes(deviceId)
        ? current.deviceIds.filter((id) => id !== deviceId)
        : [...current.deviceIds, deviceId],
    }));
    setCompatibilityError(null);
  };

  const confirmResolution = (deviceId: string, confirmed: boolean) => {
    setResolutionConfirmations((current) => {
      const next = new Set(current);
      if (confirmed) next.add(deviceId);
      else next.delete(deviceId);
      return next;
    });
    setCompatibilityError(null);
  };

  useEffect(() => {
    const summaryId = compatibilityError ? "channel-compatibility-error" : saveError ? "channel-save-error" : null;
    if (summaryId) document.getElementById(summaryId)?.focus();
  }, [compatibilityError, saveError]);

  useEffect(() => {
    if (!deviceAlert) return;
    document.getElementById("channel-device-assignment")?.focus();
    const timer = setTimeout(() => setDeviceAlert(false), 1500);
    return () => clearTimeout(timer);
  }, [deviceAlert]);

  return {
    ...editorData,
    saveError,
    validationErrors,
    compatibilityError,
    deviceAlert,
    resolutionConfirmations,
    saving,
    retryLoad: editorData.retryLoad,
    handleSave,
    reloadConflict,
    overwriteConflict,
    handleLifecycleChanged,
    updateBasicInfo,
    updateDisplay,
    toggleDevice,
    confirmResolution,
    onDeleted: () => router.push("/channels"),
  };
}
