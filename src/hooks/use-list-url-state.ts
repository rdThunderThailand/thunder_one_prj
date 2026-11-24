// Shared history behavior for list pages (Layouts/Playlists/Channels): each page keeps
// its own ListState shape and its own readListState/writeListState — only the "how do we
// talk to window.history" rule is common, so that's all this hook shares. See
// docs/adr/0047-list-url-state-history-navigation.md.

import { useEffect, useRef } from "react";

export type HistoryOp = "skip" | "push" | "replace";

/** Bookkeeping carried between transitions. `mounted` distinguishes the one-off URL
 *  normalization at mount from a real user interaction; `inSearchRun` tracks whether we are
 *  mid-way through a run of search-box keystrokes. */
export type SequencerState = { mounted: boolean; inSearchRun: boolean };

function isSearchEdit(prevQs: string, nextQs: string): boolean {
  const prev = new URLSearchParams(prevQs);
  const next = new URLSearchParams(nextQs);
  // "q" must actually differ — ignoring "page" is what lets a query edit carry its page
  // reset along, but a pure page change (2 -> 3) is a step of its own and must not be
  // collapsed into a preceding typing run.
  if (prev.get("q") === next.get("q")) return false;

  const keys = new Set([...prev.keys(), ...next.keys()]);
  keys.delete("q");
  keys.delete("page");
  return [...keys].every((key) => prev.get(key) === next.get(key));
}

/** Pure — the whole history decision, bookkeeping included, so a check can drive it over a
 *  sequence of transitions instead of one at a time.
 *
 *  A "search edit" only touches "q" (and/or "page", since every page resets page to 1
 *  alongside a query edit): the first one in a run pushes and the rest replace, so typing a
 *  query leaves exactly one history step to land on. Any other change pushes and ends the run.
 *
 *  `mounted` is set on the FIRST call whether or not anything was written. Consuming it only
 *  on a write was the bug behind ADR 0047's browser failures: landing on an already-clean URL
 *  wrote nothing at mount, so the flag survived and swallowed the user's first real
 *  interaction into a replaceState, leaving nothing for Back to return to. */
export function nextHistoryOp(
  current: string,
  qs: string,
  state: SequencerState,
): { op: HistoryOp; state: SequencerState } {
  if (current === qs) return { op: "skip", state: { ...state, mounted: true } };
  if (!state.mounted) return { op: "replace", state: { mounted: true, inSearchRun: false } };

  const searchEdit = isSearchEdit(current, qs);
  const op: HistoryOp = !searchEdit || !state.inSearchRun ? "push" : "replace";
  return { op, state: { mounted: true, inSearchRun: searchEdit } };
}

/** Writes `qs` to the URL via push/replaceState (never a Next navigation, so no re-render
 *  storm per keystroke) and calls `restore` on popstate so Back/Forward can read
 *  window.location.search back into state — pushState doesn't update useSearchParams(). */
export function useListUrlState(qs: string, restore: () => void): void {
  const sequencer = useRef<SequencerState>({ mounted: false, inSearchRun: false });

  useEffect(() => {
    const current = window.location.search.replace(/^\?/, "");
    const { op, state } = nextHistoryOp(current, qs, sequencer.current);
    sequencer.current = state;
    if (op === "skip") return;

    const url = qs ? `?${qs}` : window.location.pathname;
    window.history[op === "push" ? "pushState" : "replaceState"](null, "", url);
  }, [qs]);

  useEffect(() => {
    const onPopState = () => restore();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
