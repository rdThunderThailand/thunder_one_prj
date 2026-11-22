import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { fetchPublication } from "../services/publications-api";
import type { PublicationDetail } from "../types";
import { problemTargets, type ProblemTarget } from "../problem-targets";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

// Not persisted with the draft: the wizard's own store holds ids only, and a deleted Channel has no
// entry in the Channel list to take a name from, so the saved names come from the Program's detail.
const useLoadedTargets = create<{ targets: ProblemTarget[] }>(() => ({ targets: [] }));

/**
 * Call once at the wizard root. Fetches on its own rather than riding the `?id=` load, because a
 * Draft reopened from its persisted local copy skips that load entirely.
 */
export function useLoadProblemTargets(publicationId: string | null) {
  useEffect(() => {
    if (!publicationId) {
      useLoadedTargets.setState({ targets: [] });
      return;
    }
    let alive = true;
    void fetchPublication(publicationId)
      .then((detail) => {
        if (alive) useLoadedTargets.setState({ targets: problemTargets(detail.publication_targets ?? []) });
      })
      .catch(() => {
        // Publish still refuses a bad target by name, so a failed read only loses the early notice.
      });
    return () => {
      alive = false;
    };
  }, [publicationId]);
}

/** For a load that already holds the detail. "โหลดใหม่" keeps the same id, so the hook above never refetches. */
export function showProblemTargets(detail: PublicationDetail) {
  useLoadedTargets.setState({ targets: problemTargets(detail.publication_targets ?? []) });
}

/** The loaded problem targets that are still selected; Remove drops an id from the draft. */
export function useWizardProblemTargets() {
  const loaded = useLoadedTargets((s) => s.targets);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);
  const setChannelIds = usePublicationDraftStore((s) => s.setChannelIds);
  const targets = useMemo(() => loaded.filter((target) => channelIds.includes(target.id)), [loaded, channelIds]);
  return { targets, remove: (id: string) => setChannelIds(channelIds.filter((existing) => existing !== id)) };
}
