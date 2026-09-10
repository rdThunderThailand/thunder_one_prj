// A Publication can be opened from a Playlist or Composition editor with a
// `?compositionId=` (later `?playlistId=` / `?assetId=`) that pre-fills the
// content choice. But the operator may already have a half-written draft in
// localStorage and choose to *continue* it — ADR 0072 §3 forbids mutating that
// draft under them. So the seed is held **pending** until the resume choice is
// made, and this pure resolver says what to do with it.

export type SeedChoice = "continue" | "fresh" | null;

/** `apply` = write the seed onto the draft and jump to step 2.
 *  `discard` = drop the seed, leave the draft as-is.
 *  `wait`    = the resume prompt is still open; ask again once it closes. */
export type SeedResolution = "apply" | "discard" | "wait";

export function resolveSeed(args: {
  seedPresent: boolean;
  isEditMode: boolean;
  draftHasContent: boolean;
  choice: SeedChoice;
}): SeedResolution {
  const { seedPresent, isEditMode, draftHasContent, choice } = args;
  // Nothing to seed, or `?id=` edit mode which never prompts and never seeds.
  if (!seedPresent || isEditMode) return "discard";
  // Empty draft: no resume prompt will show, apply straight away.
  if (!draftHasContent) return "apply";
  // Draft has content — wait for the operator's Continue / Start-fresh choice.
  if (choice === "fresh") return "apply"; // caller clears the draft first
  if (choice === "continue") return "discard";
  return "wait";
}
