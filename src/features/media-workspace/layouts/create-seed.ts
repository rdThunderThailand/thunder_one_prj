// One-shot handoff from the New Layout flow to the editor. The modal writes nothing to the
// backend: its starting geometry and optional blank-layout details cross the navigation as
// client state, not query parameters. sessionStorage (not localStorage) because it is read
// once, on the next editor mount, and cleared.

export type CreateSeedDetails = {
  name: string;
  folderId: string | null;
  tags: string[];
  referenceResolution: string | null;
  background: string;
};

export type CreateSeed =
  | {
      kind: "scratch";
      details?: CreateSeedDetails;
    }
  | { kind: "preset"; presetKey: string; aspectRatio: string; referenceResolution: string; details?: CreateSeedDetails }
  | { kind: "template"; layoutId: string; details?: CreateSeedDetails };

export function seedCanvasSettings(seed: CreateSeed | null) {
  if (seed?.kind !== "preset") return null;
  return {
    aspectRatio: seed.aspectRatio,
    referenceResolution: seed.details?.referenceResolution ?? seed.referenceResolution,
    background: seed.details?.background ?? "#000000",
  };
}

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
