// One-shot handoff from the Template Picker to the editor. ADR 0063 §2: the modal "seeds
// client draft state" and "writes nothing" — so the choice crosses the navigation to
// `/media-workspace/layouts/create` as client state, not a query parameter. sessionStorage
// (not localStorage) because it is read once, on the next editor mount, and cleared.

export type CreateSeed =
  | { kind: "scratch" }
  | { kind: "preset"; presetKey: string }
  | { kind: "template"; layoutId: string };

const KEY = "thunder-one:layout-create-seed:v1";

export function writeCreateSeed(seed: CreateSeed): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(seed));
  } catch {
    // private mode / storage disabled — the editor falls back to its in-place picker
  }
}

/** Returns the seed and removes it, so a reload of the editor does not re-apply it. */
export function takeCreateSeed(): CreateSeed | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as CreateSeed;
    if (parsed.kind === "scratch" || parsed.kind === "preset" || parsed.kind === "template") return parsed;
    return null;
  } catch {
    return null;
  }
}
