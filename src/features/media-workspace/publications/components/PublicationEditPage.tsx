"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, MoreIcon } from "@/components/ui/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Badge } from "@/components/ui/lovable/badge";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import { LoadingState, ErrorState } from "@/components/ui/lovable/core";
import {
  cancelPublication,
  deletePublication,
  duplicatePublication,
} from "../services/publications-api";
import { useProgramEdit } from "../hooks/useProgramEdit";
import { publicationDrift } from "../publication-drift";
import { DISPLAY_STATUS_LABELS } from "../publication-list-display";
import { CONFIRM_COPY } from "./edit/confirm-copy";
import { ProgramDetailsCard } from "./edit/ProgramDetailsCard";
import { ProgramEditRail } from "./edit/ProgramEditRail";
import { ProgramPreviewButton } from "./edit/ProgramPreviewButton";
import { PublishChangesDialog } from "./edit/PublishChangesDialog";
import { ContentSourceCard, ScheduleCard, TargetCard } from "./edit/ProgramSummaryCards";

type PendingAction = "discard" | "end" | "delete" | null;

const LIST_HREF = "/media-workspace/publications";

export function PublicationEditPage({ id }: { id: string }) {
  const router = useRouter();
  const edit = useProgramEdit(id);
  const { detail, state, displayStatus, isDirty, busy, failure } = edit;
  const [pending, setPending] = useState<PendingAction>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // The browser's own leave prompt covers reload / tab close; Go Back uses the Discard dialog.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  if (edit.loadError) {
    return <ErrorState description={edit.loadError.message} />;
  }
  if (!detail || !state || !displayStatus) {
    return <LoadingState />;
  }

  const isDraft = displayStatus === "draft";
  const isEnded = displayStatus === "ended";
  const canPublish = state.name.trim().length > 0 && !busy;
  const partError = (part: string) => (failure?.part === part ? failure.message : undefined);
  const pageError = failure?.isStale
    ? "This Program was changed elsewhere. Reload to see the latest version."
    : failure && !failure.part
      ? failure.message
      : undefined;

  const contentNotes =
    state.content.type === "composition"
      ? publicationDrift(detail).length > 0
        ? ["The Layout has newer content than the published version; publishing picks it up."]
        : []
      : ["The Playlist may have newer content than the published version; publishing picks up its current content."];

  const goBack = () => (isDirty ? setPending("discard") : router.push(LIST_HREF));

  const confirmPending = () => {
    const action = pending;
    setPending(null);
    if (action === "discard") return router.push(LIST_HREF);
    const run = action === "end" ? cancelPublication(id) : deletePublication(id);
    run.then(() => router.push(LIST_HREF)).catch(() => setActionError("Action failed. Try again."));
  };

  const duplicate = () =>
    duplicatePublication(id)
      .then((copy) => router.push(`${LIST_HREF}/${copy.publication_id}/edit`))
      .catch(() => setActionError("Duplicate failed. Try again."));

  const publishDraft = () =>
    edit.saveDraft(true).then((failed) => failed === null && router.push(`${LIST_HREF}/${id}`));

  const publishChanges = () =>
    edit.publishChanges().then((failed) => {
      // Only a `[publish]` failure is explained inside the modal; every other outcome closes it.
      if (failed?.part !== "publish") setPublishOpen(false);
    });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
            Edit Program: {detail.name}
            <Badge variant={displayStatus === "live" ? "success" : "neutral"}>
              {DISPLAY_STATUS_LABELS[displayStatus]}
            </Badge>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={goBack}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Go Back
          </Button>
          <ProgramPreviewButton
            key={state.content.playlistId ?? state.content.compositionId ?? "items"}
            content={state.content}
          />
          {isDraft && (
            <Button
              variant="outline"
              disabled={!canPublish || !isDirty}
              onClick={() => edit.saveDraft(false)}
            >
              Save
            </Button>
          )}
          {isDraft && (
            <Button
              disabled={!canPublish}
              onClick={publishDraft}
            >
              Publish
            </Button>
          )}
          {!isDraft && !isEnded && (
            <Button
              disabled={!canPublish || !isDirty}
              onClick={() => setPublishOpen(true)}
            >
              Publish changes
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="More actions"
              >
                <MoreIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isDraft && <DropdownMenuItem onSelect={duplicate}>Duplicate Program</DropdownMenuItem>}
              {!isDraft && (
                <DropdownMenuItem asChild>
                  <Link href={`${LIST_HREF}/${id}`}>View Published Version</Link>
                </DropdownMenuItem>
              )}
              {isDraft && (
                <DropdownMenuItem
                  className="text-danger focus:text-danger"
                  onSelect={() => setPending("delete")}
                >
                  Delete Program
                </DropdownMenuItem>
              )}
              {!isDraft && !isEnded && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-danger focus:text-danger"
                    onSelect={() => setPending("end")}
                  >
                    End program
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {(pageError || actionError) && (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {pageError ?? actionError}
        </p>
      )}
      {failure?.isStale && (
        <p className="text-sm text-muted-foreground">
          This Program changed elsewhere.{" "}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-5">
          <ProgramDetailsCard
            state={state}
            disabled={isEnded}
            error={partError("details")}
            onChange={edit.patch}
          />
          <ContentSourceCard
            state={state}
            error={partError("content")}
            onChange={(content) => edit.patch({ content })}
          />
          <div className="grid gap-5 md:grid-cols-2">
            <TargetCard
              state={state}
              error={partError("targets")}
            />
            <ScheduleCard
              state={state}
              error={partError("schedule")}
            />
          </div>
        </div>
        <ProgramEditRail
          detail={detail}
          state={state}
          status={displayStatus}
          isDirty={isDirty}
          readOnly={isEnded}
          onPriority={(priority) => edit.patch({ priority })}
        />
      </div>

      <PublishChangesDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        checkConflicts={edit.checkConflicts}
        removedTargets={edit.removedTargets}
        contentNotes={contentNotes}
        publishError={failure?.part === "publish" ? failure.message : null}
        busy={busy}
        onConfirm={publishChanges}
      />

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending && CONFIRM_COPY[pending].title}</AlertDialogTitle>
            <AlertDialogDescription>{pending && CONFIRM_COPY[pending].body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{pending === "discard" ? "Stay" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={confirmPending}
            >
              {pending && CONFIRM_COPY[pending].action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
