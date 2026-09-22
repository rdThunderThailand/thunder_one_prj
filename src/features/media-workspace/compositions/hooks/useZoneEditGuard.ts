"use client";

// ADR 0052 §3's shared-Template confirm and ticket 26's Undo/Redo checkpoint, as one gate.
// Every Zone edit — a canvas drag, align, duplicate, or ticket 27's Layout tab typing a
// number — calls `beginZoneEdit` first, so the two never apply out of order: the operator is
// asked before anything travels to a shared Template, and Undo always has a checkpoint to
// return to once they say yes.

import { useState } from "react";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";
import { useZoneHistory } from "./useZoneHistory";

export function useZoneEditGuard(
  zones: LayoutZone[],
  sharedTemplateUsage: number,
  onChange: (next: LayoutZone[]) => void,
) {
  const [approved, setApproved] = useState(false);
  const history = useZoneHistory(zones, onChange);

  const confirmGeometryChange = (): boolean => {
    if (sharedTemplateUsage > 1 && !approved) {
      if (!window.confirm(`This Template is used by ${sharedTemplateUsage} Layouts. Changing it affects all of them.`)) return false;
      setApproved(true);
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
