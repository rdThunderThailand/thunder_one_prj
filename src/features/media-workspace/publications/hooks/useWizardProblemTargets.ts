import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { problemTargets, type ProblemTarget } from "../problem-targets";
import type { PublicationTarget } from "../types";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

// Not persisted with the draft: the wizard's own store holds ids only, and a deleted Channel has no
// entry in the Channel list to take a name from, so the saved names come from the Program's detail.
const useLoadedTargets = create<{ targets: ProblemTarget[] }>(() => ({ targets: [] }));

/** Called where the wizard loads a Draft's detail, so no second request is needed. */
export function setLoadedProblemTargets(targets: readonly PublicationTarget[]) {
  useLoadedTargets.setState({ targets: problemTargets(targets) });
}

/** Call once at the wizard root: a new Program (no id) carries no saved problem targets. */
export function useResetProblemTargets(publicationId: string | null) {
  useEffect(() => {
    if (!publicationId) useLoadedTargets.setState({ targets: [] });
  }, [publicationId]);
}

/** The loaded problem targets that are still selected; Remove drops an id from the draft. */
export function useWizardProblemTargets() {
  const loaded = useLoadedTargets((s) => s.targets);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);
  const setChannelIds = usePublicationDraftStore((s) => s.setChannelIds);
  const targets = useMemo(() => loaded.filter((target) => channelIds.includes(target.id)), [loaded, channelIds]);
  return { targets, remove: (id: string) => setChannelIds(channelIds.filter((existing) => existing !== id)) };
}
