"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

/** What has to happen before "Publish to Channel…" can open the wizard (ADR 0116 §6). `action: null` means
 *  there is no one-click fix (a Layout with unbound Zones): the dialog only explains. `run` resolves to the
 *  saved row's id, or `null` when the save failed (the editor shows why). */
export type PublishPrep = {
  title: string;
  description: string;
  action: { label: string; run: () => Promise<string | null> } | null;
};

/** Mount it only while open so every open starts fresh. */
export function PublishPrepDialog({
  prep,
  onReady,
  onClose,
}: {
  prep: PublishPrep;
  onReady: (id: string) => void;
  onClose: () => void;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const run = () => {
    if (!prep.action) return;
    setIsRunning(true);
    setHasFailed(false);
    prep.action
      .run()
      .then((id) => (id ? onReady(id) : setHasFailed(true)))
      .catch(() => setHasFailed(true))
      .finally(() => setIsRunning(false));
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !isRunning) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{prep.title}</DialogTitle>
          <DialogDescription>{prep.description}</DialogDescription>
        </DialogHeader>
        {hasFailed && (
          <p className="text-sm text-error">บันทึกไม่สำเร็จ ดูรายละเอียดในหน้า editor แล้วลองอีกครั้ง</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRunning}>
            {prep.action ? "ยกเลิก" : "ปิด"}
          </Button>
          {prep.action && (
            <Button onClick={run} disabled={isRunning}>
              {isRunning ? "กำลังบันทึก..." : prep.action.label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
