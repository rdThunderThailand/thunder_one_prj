"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/lovable/dialog";
import type { ScheduleConflict } from "../../types";

type ConflictState = { status: "checking" } | { status: "failed" } | { status: "done"; list: ScheduleConflict[] };

function ConfirmBody({
  isFirstPublish,
  checkConflicts,
  removedTargets,
  contentNotes,
  publishError,
  busy,
  onCancel,
  onConfirm,
}: {
  isFirstPublish: boolean;
  checkConflicts: () => Promise<ScheduleConflict[]>;
  removedTargets: string[];
  contentNotes: string[];
  publishError: string | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [conflicts, setConflicts] = useState<ConflictState>({ status: "checking" });

  useEffect(() => {
    let alive = true;
    checkConflicts()
      .then((list) => {
        if (alive) setConflicts({ status: "done", list });
      })
      .catch(() => {
        if (alive) setConflicts({ status: "failed" });
      });
    return () => {
      alive = false;
    };
    // Runs once per open: the dialog body is mounted fresh each time it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isFirstPublish ? "Publish Program?" : "Publish changes?"}</DialogTitle>
        <DialogDescription>
          {isFirstPublish
            ? "This publishes the Program. Screens start playing it on their next poll."
            : "This updates the published Program. Every change is published together, and screens switch to the new version on their next poll."}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3 text-sm">
        {removedTargets.length > 0 && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-warning">
            Will stop playing on {removedTargets.length} channel{removedTargets.length > 1 ? "s" : ""}:{" "}
            {removedTargets.join(", ")}
          </p>
        )}
        {contentNotes.map((note) => (
          <p
            key={note}
            className="rounded-lg bg-muted px-3 py-2 text-muted-foreground"
          >
            {note}
          </p>
        ))}
        {conflicts.status === "checking" && (
          <p className="text-muted-foreground">Checking schedule conflicts…</p>
        )}
        {conflicts.status === "failed" && (
          <p className="text-muted-foreground">
            Could not check schedule conflicts. You can still publish.
          </p>
        )}
        {conflicts.status === "done" && conflicts.list.length > 0 && (
          <ul className="flex flex-col gap-1.5 rounded-lg bg-warning-soft px-3 py-2 text-warning">
            {conflicts.list.map((c) => (
              <li key={c.publication_id}>
                Overlaps “{c.name}” ({c.priority})
                {c.blocks && " — cannot share a screen with this Program"}
                {!c.blocks && c.would_be_suppressed && " — this Program would be suppressed"}
                {!c.blocks && c.would_suppress && " — this Program would take over"}
              </li>
            ))}
          </ul>
        )}
        {publishError && (
          <p
            role="alert"
            className="rounded-lg bg-danger-soft px-3 py-2 text-danger"
          >
            {publishError}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Publishing…" : "Publish"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function PublishChangesDialog({
  open,
  onClose,
  ...body
}: {
  open: boolean;
  onClose: () => void;
  isFirstPublish: boolean;
  checkConflicts: () => Promise<ScheduleConflict[]>;
  removedTargets: string[];
  contentNotes: string[];
  publishError: string | null;
  busy: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !body.busy && onClose()}
    >
      <DialogContent>
        {open && (
          <ConfirmBody
            {...body}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
