// ADR 0086: an editor seed wins unless unfinished work needs a choice first.

export type SeedChoice = "continue" | "fresh" | null;

export type PublicationSeed = {
  kind: "asset" | "playlist" | "composition";
  id: string;
};

export function publicationSeedFromParams(params: {
  assetId: string | null;
  playlistId: string | null;
  compositionId: string | null;
}): PublicationSeed | null {
  if (params.compositionId) return { kind: "composition", id: params.compositionId };
  if (params.playlistId) return { kind: "playlist", id: params.playlistId };
  if (params.assetId) return { kind: "asset", id: params.assetId };
  return null;
}

/** `apply` = write the seed onto the draft and jump to step 2.
 *  `discard` = drop the seed, leave the draft as-is.
 *  `wait`    = the resume prompt is still open; ask again once it closes. */
export type SeedResolution = "apply" | "discard" | "wait";

export function resolveSeed(args: {
  seedPresent: boolean;
  isEditMode: boolean;
  draftHasUnfinishedWork: boolean;
  choice: SeedChoice;
}): SeedResolution {
  const { seedPresent, isEditMode, draftHasUnfinishedWork, choice } = args;
  // Nothing to seed, or `?id=` edit mode which never prompts and never seeds.
  if (!seedPresent || isEditMode) return "discard";
  // No unfinished work: no resume prompt will show, apply straight away.
  if (!draftHasUnfinishedWork) return "apply";
  // Unfinished work — wait for the operator's Continue / Start-fresh choice.
  if (choice === "fresh") return "apply"; // caller clears the draft first
  if (choice === "continue") return "discard";
  return "wait";
}
