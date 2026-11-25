"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonClasses } from "@/components/ui/Button";
import { NoAccess } from "@/components/ui/NoAccess";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { draftFromChannel, geometryMismatch, step1Valid, toUpdateChannelPayload, type CreateChannelDraft } from "../create-wizard-state";
import { fetchChannel, fetchChannelReferenceData } from "../services/channels-api";
import { updateChannelV2 } from "../services/channel-write-api";
import { fetchChannelPlayerCandidates } from "../services/player-candidates-api";
import type { ChannelDetail, ChannelLocationOption } from "../types";
import type { ChannelPlayerCandidate } from "../player-candidates";
import { ChannelEditorForm } from "./ChannelEditorForm";
import { GeometryMismatchWarning } from "./GeometryMismatchWarning";
import { EditChannelSidebar } from "./EditChannelSidebar";
import { EditorLoadError, EditorSkeleton } from "./ChannelEditorStates";

export function ChannelEditorPage({ channelId }: { channelId: string }) {
  const router = useRouter();
  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);
  const [locations, setLocations] = useState<ChannelLocationOption[]>([]);
  const [candidates, setCandidates] = useState<ChannelPlayerCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [draft, setDraft] = useState<CreateChannelDraft | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmedMismatchKey, setConfirmedMismatchKey] = useState<string | null>(null);

  const selectedPlayer = candidates.find((candidate) => candidate.id === draft?.playerId) ?? null;
  const geometryWarning = draft ? geometryMismatch(draft, selectedPlayer) : null;
  const mismatchKey = geometryWarning ? `${draft?.playerId}:${geometryWarning}` : null;
  const mismatchConfirmed = mismatchKey !== null && confirmedMismatchKey === mismatchKey;

  const load = () => {
    fetchChannel(channelId)
      .then((detail) => {
        setChannel(detail);
        setDraft(draftFromChannel(detail));
        setConfirmedMismatchKey(null);
        setLoadError(null);
      })
      .catch((caught) => setLoadError(classifyApiError(caught, "โหลด Channel นี้ไม่สำเร็จ กรุณาลองใหม่")));
  };

  const refreshCandidates = () => {
    setCandidatesLoading(true);
    fetchChannelPlayerCandidates()
      .then(setCandidates)
      .catch(() => {})
      .finally(() => setCandidatesLoading(false));
  };

  useEffect(() => {
    load();
    fetchChannelReferenceData()
      .then((reference) => setLocations(reference.locations))
      .catch(() => {});
    fetchChannelPlayerCandidates()
      .then(setCandidates)
      .catch(() => {})
      .finally(() => setCandidatesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const handleSave = async () => {
    if (!draft || !channel) return;
    if (!step1Valid(draft)) {
      setNameError("Channel name is required");
      return;
    }
    if (geometryWarning && !mismatchConfirmed) return;
    setNameError(undefined);
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateChannelV2(channelId, toUpdateChannelPayload(draft, channel.revision, mismatchConfirmed));
      toast.success("Channel saved");
      router.push("/media-workspace/channels");
      return updated;
    } catch (caught) {
      const failure = classifyApiError(caught, "บันทึกการเปลี่ยนแปลง Channel ไม่สำเร็จ กรุณาลองใหม่");
      if (failure.reason === "duplicate-name") {
        setNameError(failure.message);
      } else {
        setSaveError(failure.message);
        if (failure.reason === "needs-confirm") {
          setConfirmedMismatchKey(null);
          refreshCandidates();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const disabled = channel === null || Boolean(loadError) || saving;

  return (
    <div data-testid="channel-editor" className="flex flex-col gap-4">
      <PageHeader
        titleInTopbar
        title={
          <span className="inline-flex items-center gap-2">
            Edit Channel
            <span className="rounded-full bg-accent px-2.5 py-1 text-sm font-medium text-primary">
              {channel?.display_config?.mode === "multi" ? "Multi-screen" : "Single-screen"}
            </span>
          </span>
        }
        subtitle="Update channel information and screen configuration."
      />

      {channel === null && loadError === null ? (
        <EditorSkeleton />
      ) : loadError?.kind === "forbidden" ? (
        <NoAccess message={loadError.message} />
      ) : loadError ? (
        <EditorLoadError error={loadError} retrying={false} onRetry={load} />
      ) : channel && draft ? (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-4">
            {saveError && (
              <p role="alert" className="rounded-lg border border-error/30 bg-error-muted px-3 py-2 text-sm text-error">
                {saveError}
              </p>
            )}
            <ChannelEditorForm
              draft={draft}
              locations={locations}
              candidates={candidates}
              candidatesLoading={candidatesLoading}
              nameError={nameError}
              excludeChannelId={channelId}
              allowNoPlayer={channel.status !== "active"}
              blockingPrograms={channel.blocking_programs}
              onChange={setDraft}
              onRefreshCandidates={refreshCandidates}
            />
            {geometryWarning && (
              <GeometryMismatchWarning
                id="edit-channel-geometry-confirmation"
                warning={geometryWarning}
                confirmed={mismatchConfirmed}
                onConfirmChange={(confirmed) => setConfirmedMismatchKey(confirmed ? mismatchKey : null)}
              />
            )}
            <div className="flex justify-end gap-2 px-1">
              <Link href="/media-workspace/channels" className={buttonClasses("secondary")}>
                <ArrowLeftIcon />
                Cancel
              </Link>
              <Button type="button" disabled={disabled || Boolean(geometryWarning && !mismatchConfirmed)} onClick={() => void handleSave()}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>

          <EditChannelSidebar
            channel={channel}
            onChanged={(updated) => {
              setChannel(updated);
              setDraft(draftFromChannel(updated));
              setConfirmedMismatchKey(null);
            }}
            onDeleted={() => router.push("/media-workspace/channels")}
          />
        </div>
      ) : null}
    </div>
  );
}
