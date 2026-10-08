"use client";

// ADR 0052 §3's shared-Template confirm and ticket 26's Undo/Redo checkpoint, as one gate.
// Every edit that writes the `layouts` row — a canvas drag, align, duplicate, a Zone number or
// a layout setting typed in the Layout tab — calls `beginZoneEdit` first, so the two never
// apply out of order: the operator is asked before anything travels to a shared Template, and
// Undo always has a checkpoint to return to once they say yes. A binding change writes no
// Template, so it takes `history.checkpoint` directly, without the confirm (ADR 0087 §3).

import { useRef, useState } from "react";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";
import { useZoneHistory, type EditorSnapshot } from "./useZoneHistory";

/** ADR 0087 §2: X/Y/W/H typed into the Zone panel are continuous (one step per focus); a rename
 *  commits on blur and is a step of its own. */
export function zoneEditKey(zone: LayoutZone | null | undefined, next: LayoutZone): string | undefined {
  if (!zone || zone.name !== next.name) return undefined;
  const field = (["x", "y", "width", "height"] as const).find((key) => zone[key] !== next[key]);
  return field ? `zone:${next.id}:${field}` : undefined;
}

export function useZoneEditGuard(
  snapshot: EditorSnapshot,
  sharedTemplateUsage: number,
  onRestore: (next: EditorSnapshot) => void,
  /** Opens the shared-Template modal and resolves with the operator's answer. */
  askApproval: () => Promise<boolean>,
) {
  const [approved, setApproved] = useState(false);
  const isAsking = useRef(false);
  const history = useZoneHistory(snapshot, onRestore);

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

  /** `continuousKey` marks a repeated edit of one input (typing a number): one step per focus. */
  const beginZoneEdit = (continuousKey?: string): boolean => {
    if (!confirmGeometryChange()) return false;
    history.checkpoint(continuousKey);
    return true;
  };

  return {
    beginZoneEdit,
    /** Called after a fork gives this Composition its own private geometry — the next edit
     *  is no longer shared, so it should not have to ask again this session. */
    resetApproval: () => setApproved(false),
    ...history,
  };
}
