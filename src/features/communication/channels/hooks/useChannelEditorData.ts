import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchPlaylists } from "@/lib/api/media-api";
import { mergeChannelDeviceCandidates, mergeChannelTypeOptions } from "../channel-logic";
import {
  fetchChannel,
  fetchChannelDeviceCandidates,
  fetchChannelReferenceData,
} from "../services/channels-api";
import type { ChannelDetail, ChannelDeviceCandidate, ChannelLifecycle, ChannelReferenceData } from "../types";
import type { ChannelBasicInfoValue } from "../components/ChannelBasicInfoSection";
import type { ChannelDisplayExpectationValue } from "../components/ChannelDisplayExpectationSection";
import { detailToForm, emptyForm, isSupportedCategory, mergePlaylistOptions } from "./editor-mapping";

export interface ChannelFormValue extends ChannelBasicInfoValue, ChannelDisplayExpectationValue {
  deviceIds: string[];
}

export interface EditorData {
  detail: ChannelDetail | null;
  references: ChannelReferenceData;
  devices: ChannelDeviceCandidate[];
  playlists: { id: string; name: string }[];
}

/** Loads Channel editor reference data (Channel detail on edit, plus reference
 * data / device candidates / playlists), guarding against stale in-flight
 * responses when channelId changes or a retry fires mid-request.
 *
 * `onDataApplied` fires synchronously whenever a full dataset is applied (initial
 * load, retry, reloadConflict) — not from updateDetail, which intentionally leaves
 * the form and its validation/confirmation state alone. Callers use it to reset
 * save-side state that lives outside this hook, without a setState-in-effect. */
export function useChannelEditorData(channelId: string | undefined, onDataApplied?: () => void) {
  const isEdit = Boolean(channelId);
  const [data, setData] = useState<EditorData | null>(null);
  const [form, setForm] = useState<ChannelFormValue>(emptyForm);
  const [revision, setRevision] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);
  const [unsupportedCategory, setUnsupportedCategory] = useState<"online" | "social" | null>(null);
  const [loading, setLoading] = useState(true);
  const requestGenerationRef = useRef(0);

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
        channel_types: mergeChannelTypeOptions(references.channel_types, detail?.channel_type ?? null),
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
    onDataApplied?.();
  }, [onDataApplied]);

  const runEditorLoad = useCallback(
    (generation: number) => {
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
    },
    [applyEditorData, fetchEditorData, isEdit],
  );

  useEffect(() => {
    const generation = ++requestGenerationRef.current;
    runEditorLoad(generation);
    return () => {
      requestGenerationRef.current += 1;
    };
  }, [runEditorLoad]);

  /** Updates only detail + revision after a lifecycle action (activate / deactivate /
   * delete-cancel) — deliberately does not touch form or resolution confirmations, since
   * the user's in-progress edits should survive a lifecycle change. */
  const updateDetail = (detail: ChannelDetail) => {
    setData((current) => (current ? { ...current, detail } : current));
    setRevision(detail.revision);
  };

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
  const selectedType = data?.references.channel_types.find((option) => option.id === form.channelTypeId);
  const selectedLocation = data?.references.locations.find((option) => option.id === form.locationId);
  const selectedPlaylist = data?.playlists.find((option) => option.id === form.defaultPlaylistId);
  const lifecycle: ChannelLifecycle = data?.detail?.lifecycle ?? "draft";

  return {
    isEdit,
    data,
    form,
    setForm,
    revision,
    loadError,
    unsupportedCategory,
    loading,
    applyEditorData,
    updateDetail,
    retryLoad,
    selectedDevices,
    selectedType,
    selectedLocation,
    selectedPlaylist,
    lifecycle,
  };
}
