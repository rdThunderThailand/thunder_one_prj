"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses, Button } from "@/components/ui/Button";
import { NoAccess } from "@/components/ui/NoAccess";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { useChannelEditor } from "../hooks/useChannelEditor";
import type { ChannelCategory } from "../types";
import { ChannelBasicInfoSection } from "./ChannelBasicInfoSection";
import { ChannelDeviceAssignmentSection } from "./ChannelDeviceAssignmentSection";
import { ChannelDisplayExpectationSection } from "./ChannelDisplayExpectationSection";
import { ChannelEditorSummary } from "./ChannelEditorSummary";
import {
  ChannelCompatibilityErrorCard,
  ChannelSaveErrorCard,
  EditorLoadError,
  EditorSkeleton,
  UnsupportedCategoryState,
} from "./ChannelEditorStates";
import { ChannelLifecycleActions } from "./ChannelLifecycleActions";

function ChannelEditor({ channelId }: { channelId?: string }) {
  const editor = useChannelEditor(channelId);
  const {
    isEdit,
    data,
    form,
    lifecycle,
    loadError,
    unsupportedCategory,
    saveError,
    validationErrors,
    compatibilityError,
    deviceAlert,
    resolutionConfirmations,
    loading,
    saving,
    selectedDevices,
    selectedType,
    selectedLocation,
    selectedPlaylist,
    retryLoad,
    handleSave,
    reloadConflict,
    overwriteConflict,
    handleLifecycleChanged,
    updateBasicInfo,
    updateDisplay,
    toggleDevice,
    confirmResolution,
    onDeleted,
  } = editor;

  const title = isEdit ? "Edit Channel" : "Create Channel";
  const subtitle = isEdit
    ? "Update identity, Physical Device assignment and display expectations."
    : "Configure a physical delivery Channel for future Publications.";

  // ADR 0037: a Draft is staged and reserves nothing; Create validates the Channel and takes an
  // exclusive hold on its devices. Both buttons stay visible while the Channel is still a Draft,
  // because committing it is the same act whether it happens now or on a later visit.
  const canStage = !isEdit || lifecycle === "draft";
  const disabled = loading || Boolean(loadError) || Boolean(unsupportedCategory) || saving;

  return (
    <div data-testid="channel-editor" className="flex flex-col gap-5">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <Link href="/media-workspace/channels" className={buttonClasses("secondary")}>
              <ArrowLeftIcon />
              Cancel
            </Link>
            {canStage && (
              <Button
                type="button"
                variant="secondary"
                disabled={disabled}
                onClick={() => void handleSave(true)}
              >
                Save as Draft
              </Button>
            )}
            <Button type="submit" form="channel-editor-form" disabled={disabled}>
              {saving ? "Saving…" : canStage ? "Create Channel" : "Save changes"}
            </Button>
          </>
        }
      />

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
            void handleSave(canStage ? false : null);
          }}
          className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div className="min-w-0 space-y-5">
            {saveError && (
              <ChannelSaveErrorCard
                error={saveError}
                saving={saving}
                onReload={() => void reloadConflict()}
                onOverwrite={() => void overwriteConflict()}
              />
            )}

            {compatibilityError && <ChannelCompatibilityErrorCard message={compatibilityError} />}

            <ChannelBasicInfoSection
              value={form}
              lifecycle={lifecycle}
              channelTypes={data.references.channel_types}
              currentChannelTypeId={data.detail?.channel_type?.id ?? null}
              locations={data.references.locations}
              errors={validationErrors}
              directTargetConflicts={data.detail?.direct_target_conflicts ?? []}
              onChange={updateBasicInfo}
            />

            <ChannelDeviceAssignmentSection
              id="channel-device-assignment"
              alert={deviceAlert}
              devices={data.devices}
              selectedIds={form.deviceIds}
              expectedOrientation={form.orientation}
              expectedResolution={form.resolution}
              resolutionConfirmations={resolutionConfirmations}
              onToggle={toggleDevice}
              onConfirmResolution={confirmResolution}
            />

            <ChannelDisplayExpectationSection
              value={form}
              playlists={data.playlists}
              onChange={updateDisplay}
            />
          </div>

          <div className="min-w-0 space-y-5">
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
            {isEdit && data.detail && (
              <ChannelLifecycleActions
                channelId={data.detail.id}
                lifecycle={data.detail.lifecycle}
                revision={data.detail.revision}
                onChanged={handleLifecycleChanged}
                onDeleted={onDeleted}
              />
            )}
          </div>
        </form>
      ) : null}
    </div>
  );
}

export function ChannelEditorPage({ channelId }: { channelId?: string }) {
  return <ChannelEditor key={channelId ?? "create"} channelId={channelId} />;
}
