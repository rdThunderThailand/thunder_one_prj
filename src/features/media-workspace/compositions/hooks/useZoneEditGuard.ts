"use client";

// ADR 0052 §3's shared-Template confirm and ticket 26's Undo/Redo checkpoint, as one gate.
// Every Zone edit — a canvas drag, align, duplicate, or ticket 27's Layout tab typing a
// number — calls `beginZoneEdit` first, so the two never apply out of order: the operator is
// asked before anything travels to a shared Template, and Undo always has a checkpoint to
// return to once they say yes.

import { useRef, useState } from "react";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";
import { useZoneHistory } from "./useZoneHistory";

export function useZoneEditGuard(
  zones: LayoutZone[],
  sharedTemplateUsage: number,
  onChange: (next: LayoutZone[]) => void,
  /** Opens the shared-Template modal and resolves with the operator's answer. */
  askApproval: () => Promise<boolean>,
) {
  const [approved, setApproved] = useState(false);
  const isAsking = useRef(false);
  const history = useZoneHistory(zones, onChange);

  // The modal is async but every caller needs an answer now, so the first edit on a shared Template
  // is refused while the modal is open; after a yes the operator repeats the edit (asked once a session).
  const confirmGeometryChange = (): boolean => {
    if (sharedTemplateUsage > 1 && !approved) {
      if (!isAsking.current) {
        isAsking.current = true;
        void askApproval().then((confirmed) => {
          isAsking.current = false;
          if (confirmed) setApproved(true);
        });
      }
      return false;
    }
    return true;
  };

  const beginZoneEdit = (): boolean => {
    if (!confirmGeometryChange()) return false;
    history.checkpoint();
    return true;
  };

  return {
    confirmGeometryChange,
    beginZoneEdit,
    /** Called after a fork gives this Composition its own private geometry — the next edit
     *  is no longer shared, so it should not have to ask again this session. */
    resetApproval: () => setApproved(false),
    ...history,
  };
}
