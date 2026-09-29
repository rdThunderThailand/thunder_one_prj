"use client";

import { useEffect, useState } from "react";
import { fetchAffectedPrograms, type AffectedProgram, type ChangesKind } from "./publish-changes-api";

/** The Programs a Publish Changes on this Playlist/Layout would re-publish. `id` is `null` until the
 *  row exists on the server, so an unsaved new editor reports none. */
export function useAffectedPrograms(kind: ChangesKind, id: string | null) {
  const [state, setState] = useState<{ key: string; programs: AffectedProgram[] } | null>(null);
  const [tick, setTick] = useState(0);
  const key = `${kind}:${id}`;

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetchAffectedPrograms(kind, id)
      .then((data) => alive && setState({ key, programs: data.programs }))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [kind, id, key, tick]);

  return {
    programs: id && state?.key === key ? state.programs : [],
    reload: () => setTick((t) => t + 1),
  };
}
