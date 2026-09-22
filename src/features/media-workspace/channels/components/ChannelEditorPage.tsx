"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonClasses } from "@/components/ui/Button";
import { NoAccess } from "@/components/ui/NoAccess";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { classifyApiError, isDuplicateName, type ClassifiedError } from "@/lib/api/api-error";
import { draftFromChannel, step1Valid, step2Valid, toUpdateChannelPayload, type CreateChannelDraft } from "../create-wizard-state";
import { fetchChannel, fetchChannelReferenceData } from "../services/channels-api";
import { updateChannelV2 } from "../services/channel-write-api";
import { fetchChannelPlayerCandidates } from "../services/player-candidates-api";
import type { ChannelDetail, ChannelLocationOption } from "../types";
import type { ChannelPlayerCandidate } from "../player-candidates";
import { ChannelEditorForm } from "./ChannelEditorForm";
import { EditChannelSidebar } from "./EditChannelSidebar";
import { EditorLoadError, EditorSkeleton } from "./ChannelEditorStates";

/** `channel_set_devices` refuses removing the Player while a live Publication targets the
 *  Channel — every other write error goes through `classifyApiError`'s generic path instead. */
function isPlayerChangeBlocked(message: string): boolean {
  return message.includes("cannot remove") && message.includes("target this channel");
}

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

  const load = () => {
    fetchChannel(channelId)
      .then((detail) => {
        setChannel(detail);
        setDraft(draftFromChannel(detail));
        setLoadError(null);
      })
      .catch((caught) => setLoadError(classifyApiError(caught, "Could not load this Channel. Try again.")));
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
    if (!step2Valid(draft)) return;
    setNameError(undefined);
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateChannelV2(channelId, toUpdateChannelPayload(draft, channel.revision));
      router.push("/media-workspace/channels");
      return updated;
    } catch (caught) {
      if (caught instanceof Error && isDuplicateName(caught.message)) {
        setNameError("A Channel with this name already exists.");
      } else if (caught instanceof Error && isPlayerChangeBlocked(caught.message)) {
        setSaveError("Can't change the Player — an active or scheduled Publication still targets this Channel.");
      } else {
        setSaveError(classifyApiError(caught, "Could not save Channel changes. Try again.").message);
      }
    } finally {
      setSaving(false);
    }
  };

  const disabled = channel === null || Boolean(loadError) || saving;

  return (
    <div data-testid="channel-editor" className="flex flex-col gap-5">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            Edit Channel
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-sm font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
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
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
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
              onChange={setDraft}
              onRefreshCandidates={refreshCandidates}
            />
            <div className="flex justify-end gap-2 px-1">
              <Link href="/media-workspace/channels" className={buttonClasses("secondary")}>
                <ArrowLeftIcon />
                Cancel
              </Link>
              <Button type="button" disabled={disabled} onClick={() => void handleSave()}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>

          <EditChannelSidebar
            channel={channel}
            onChanged={(updated) => {
              setChannel(updated);
              setDraft(draftFromChannel(updated));
            }}
            onDeleted={() => router.push("/media-workspace/channels")}
          />
        </div>
      ) : null}
    </div>
  );
}
