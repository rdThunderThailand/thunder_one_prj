"use client";

import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/lovable/dialog";
import { CheckIcon } from "@/components/ui/icons";
import {
  describePublishChangesError,
  type AffectedProgram,
  type PublishChangesResult,
} from "./publish-changes-api";

type Phase =
  | { kind: "confirm" }
  | { kind: "publishing" }
  | { kind: "done"; result: PublishChangesResult }
  | { kind: "failed"; programName: string | null; reason: string };

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function formatSchedule(program: AffectedProgram) {
  const format = (value: string) =>
    new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  if (!program.startsAt && !program.endsAt) return "Not scheduled";
  if (!program.startsAt) return `Until ${format(program.endsAt!)}`;
  if (!program.endsAt) return `From ${format(program.startsAt)}`;
  return `${format(program.startsAt)} – ${format(program.endsAt)}`;
}

/** Publish Changes confirm → publishing → updated / failed (ADR 0078 §8); `onConfirm` omitted makes it
 *  the read-only "Used by N programs" list (§9). Mount it only while open so every open starts fresh. */
export function PublishChangesDialog({
  contentLabel,
  programs,
  onConfirm,
  onPublished,
  onClose,
}: {
  contentLabel: "playlist" | "layout";
  programs: AffectedProgram[];
  onConfirm?: () => Promise<PublishChangesResult>;
  onPublished: () => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "confirm" });
  const isPublishing = phase.kind === "publishing";

  const confirm = () => {
    if (!onConfirm) return;
    setPhase({ kind: "publishing" });
    onConfirm()
      .then((result) => {
        setPhase({ kind: "done", result });
        onPublished();
      })
      .catch((err: unknown) =>
        setPhase({ kind: "failed", ...describePublishChangesError(err instanceof Error ? err.message : "") }),
      );
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !isPublishing) onClose(); }}>
      <DialogContent className="max-w-lg">
        {phase.kind === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>{onConfirm ? "Publish Changes" : `Used by ${plural(programs.length, "program")}`}</DialogTitle>
              <DialogDescription>
                {onConfirm
                  ? `This ${contentLabel} is used by ${plural(programs.length, "program")}. Changes will be applied to the following programs and their assigned channels.`
                  : `This ${contentLabel} is used by the following programs.`}
              </DialogDescription>
            </DialogHeader>
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {programs.map((program) => (
                <li key={program.id} className="rounded-lg border border-border bg-card px-3 py-2">
                  <p className="truncate text-sm font-semibold text-foreground">{program.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {plural(program.channelCount, "channel")} · {formatSchedule(program)}
                  </p>
                  {program.viaComposition && (
                    <p className="text-xs text-muted-foreground">via {program.viaComposition.name}</p>
                  )}
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {onConfirm ? "Cancel" : "Close"}
              </Button>
              {onConfirm && (
                <Button type="button" onClick={confirm}>
                  Publish Changes
                </Button>
              )}
            </DialogFooter>
          </>
        )}
        {phase.kind === "publishing" && (
          <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary-soft border-t-primary" aria-hidden="true" />
            <DialogTitle>Publishing…</DialogTitle>
            <DialogDescription>
              Updating {contentLabel} and sending to {plural(programs.length, "program")}.
            </DialogDescription>
          </div>
        )}
        {phase.kind === "done" && (
          <>
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-success-soft text-success">
                <CheckIcon className="h-6 w-6" />
              </span>
              <DialogTitle className="text-success">Updated</DialogTitle>
              <DialogDescription>
                Changes have been applied to {plural(phase.result.programCount, "program")} ({plural(phase.result.channelCount, "channel")}).
              </DialogDescription>
            </div>
            <DialogFooter>
              <Button type="button" onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
        {phase.kind === "failed" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-danger">Publish failed</DialogTitle>
              <DialogDescription>
                {phase.programName ? `Program “${phase.programName}” — ` : ""}
                {phase.reason}
              </DialogDescription>
              <p className="text-xs text-muted-foreground">Nothing was changed on any program.</p>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
