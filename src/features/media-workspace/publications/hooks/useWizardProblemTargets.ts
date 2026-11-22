import { useEffect, useMemo, useRef } from "react";
import { fetchPublication } from "../services/publications-api";
import { problemTargets } from "../problem-targets";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

/**
 * Call once at the wizard root. A Draft reopened from its persisted local copy skips the `?id=` load, so
 * this refreshes the problem targets once after hydration. A `?id=` for another Draft is left to that load.
 */
export function useRefreshProblemTargets(input: { hasHydrated: boolean; idParam: string | null }) {
  const refreshed = useRef(false);
  useEffect(() => {
    if (!input.hasHydrated || refreshed.current) return;
    refreshed.current = true;
    const { publicationId: id, setProblemTargets } = usePublicationDraftStore.getState();
    if (!id || (input.idParam && input.idParam !== id)) return;
    void fetchPublication(id)
      .then((detail) => {
        // Entry may cancel or seed over the Draft before the fetch returns.
        if (usePublicationDraftStore.getState().publicationId === id) {
          setProblemTargets(problemTargets(detail.publication_targets ?? []));
        }
      })
      .catch(() => {
        // Publish still refuses a bad target by name, so a failed read only loses the early notice.
      });
  }, [input.hasHydrated, input.idParam]);
}

/** The loaded problem targets that are still selected; Remove drops an id from the draft. */
export function useWizardProblemTargets() {
  const loaded = usePublicationDraftStore((s) => s.problemTargets);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);
  const setChannelIds = usePublicationDraftStore((s) => s.setChannelIds);
  const targets = useMemo(() => loaded.filter((target) => channelIds.includes(target.id)), [loaded, channelIds]);
  return { targets, remove: (id: string) => setChannelIds(channelIds.filter((existing) => existing !== id)) };
}
