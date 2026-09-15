"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { NoAccess } from "@/components/ui/NoAccess";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { classifyApiError, isDuplicateName, type ClassifiedError } from "@/lib/api/api-error";
import { draftFromChannel, step1Valid, step2Valid, toUpdateChannelPayload, type CreateChannelDraft } from "../create-wizard-state";
import { fetchChannel, fetchChannelReferenceData } from "../services/channels-api";
import { updateChannelV2 } from "../services/channel-write-api";
import { fetchChannelPlayerCandidates } from "../services/player-candidates-api";
import type { ChannelDetail, ChannelLifecycle, ChannelLocationOption } from "../types";
import type { ChannelPlayerCandidate } from "../player-candidates";
import { Step1ChannelInfo } from "./create-wizard/Step1ChannelInfo";
import { Step2Setup } from "./create-wizard/Step2Setup";
import { EditChannelSidebar } from "./EditChannelSidebar";
import { EditorLoadError, EditorSkeleton } from "./ChannelEditorStates";

const LIFECYCLE_BADGE: Record<ChannelLifecycle, { label: string; color: BadgeColor }> = {
  draft: { label: "Draft", color: "zinc" },
  active: { label: "Active", color: "green" },
  inactive: { label: "Inactive", color: "zinc" },
};

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
            {channel && (
              <Badge color={LIFECYCLE_BADGE[channel.lifecycle].color} variant="pill">
                {LIFECYCLE_BADGE[channel.lifecycle].label}
              </Badge>
            )}
          </span>
        }
        subtitle="Update identity, Player assignment and display configuration."
        actions={
          <>
            <Link href="/media-workspace/channels" className={buttonClasses("secondary")}>
              <ArrowLeftIcon />
              Cancel
            </Link>
            <Button type="button" disabled={disabled} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      />

      {channel === null && loadError === null ? (
        <EditorSkeleton />
      ) : loadError?.kind === "forbidden" ? (
        <NoAccess message={loadError.message} />
      ) : loadError ? (
        <EditorLoadError error={loadError} retrying={false} onRetry={load} />
      ) : channel && draft ? (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            {saveError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                {saveError}
              </p>
            )}
            <Step1ChannelInfo draft={draft} locations={locations} nameError={nameError} onChange={setDraft} />
            <Step2Setup
              draft={draft}
              candidates={candidates}
              candidatesLoading={candidatesLoading}
              excludeChannelId={channelId}
              onChange={setDraft}
              onRefreshCandidates={refreshCandidates}
            />
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
