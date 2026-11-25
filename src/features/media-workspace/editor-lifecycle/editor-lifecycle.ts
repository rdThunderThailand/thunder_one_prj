// Pure save-lifecycle rules shared by the Playlist, Composition and Layout editors (ADR 0127).
// No React and no runtime imports, so `editor-lifecycle.check.mts` runs under plain `node`.

export type LifecycleStatus = "new" | "dirty" | "saved";

export type LifecycleState = {
  /** JSON of the last saved / loaded snapshot. */
  baseline: string;
  isSaving: boolean;
  saveError: string | null;
  conflict: string | null;
  lastSavedAt: Date | null;
};

export type LifecycleEvent =
  /** Load, hydrate or reload — also clears the error and the conflict. */
  | { type: "reset"; baseline: string }
  /** Clears the error and the conflict. */
  | { type: "save-start" }
  /** `baseline` is the snapshot captured when the save started (ADR 0127 §3). */
  | { type: "save-success"; baseline: string; at: Date }
  | { type: "save-failure"; kind: "conflict" | "error"; message: string };

export function initialLifecycle(baseline: string): LifecycleState {
  return { baseline, isSaving: false, saveError: null, conflict: null, lastSavedAt: null };
}

export function reduceLifecycle(state: LifecycleState, event: LifecycleEvent): LifecycleState {
  switch (event.type) {
    case "reset":
      return { ...state, baseline: event.baseline, saveError: null, conflict: null };
    case "save-start":
      return { ...state, isSaving: true, saveError: null, conflict: null };
    case "save-success":
      return { ...state, baseline: event.baseline, isSaving: false, lastSavedAt: event.at };
    case "save-failure":
      return event.kind === "conflict"
        ? { ...state, isSaving: false, conflict: event.message, saveError: null }
        : { ...state, isSaving: false, saveError: event.message, conflict: null };
  }
}

export function lifecycleStatus(state: LifecycleState, current: string, hasRow: boolean): LifecycleStatus {
  if (current !== state.baseline) return "dirty";
  return hasRow || state.lastSavedAt ? "saved" : "new";
}

/** While a run is in flight every call returns that same promise (its arguments are dropped, ADR 0127 §4). */
export function createSaveSlot<A extends unknown[], R>(run: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
  let inFlight: Promise<R> | null = null;
  return (...args) => {
    if (inFlight) return inFlight;
    const started = run(...args).finally(() => {
      inFlight = null;
    });
    inFlight = started;
    return started;
  };
}

/** An editor with no `reload` cannot offer the conflict card, so a conflict is a plain error (ADR 0127 §5). */
export function failureKind(kind: string, hasReload: boolean): "conflict" | "error" {
  return kind === "conflict" && hasReload ? "conflict" : "error";
}

/** The baseline after a save: `savedSnapshot` when the write changes its own draft, else the start snapshot. */
export function savedBaseline<S, R>(start: S, result: R, savedSnapshot?: (start: S, result: R) => S): string {
  return JSON.stringify(savedSnapshot ? savedSnapshot(start, result) : start);
}

/** Save before publish: nothing to write when the draft is clean; a failed save (`null`) stops the publish. */
export async function ensureSavedWith(isDirty: boolean, save: () => Promise<unknown | null>): Promise<boolean> {
  return !isDirty || (await save()) !== null;
}
