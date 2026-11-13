import type { AssetDeleteBlockers, AssetUsage } from "@/types/domain";

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

const parts = (playlists: number, layouts: number, programs: number) =>
  [
    playlists > 0 && count(playlists, "Playlist"),
    layouts > 0 && count(layouts, "Layout"),
    programs > 0 && count(programs, "Program"),
  ].filter(Boolean) as string[];

/** True when trashing the Asset should warn: a Playlist, Layout or Program still uses it. */
export const isInUse = (usage?: AssetUsage) =>
  !!usage && usage.playlists.length + usage.layouts.length + usage.programs.length > 0;

/** "2 Playlists · 1 Program" — empty string when nothing uses the Asset. */
export const usageSummary = (usage: AssetUsage) =>
  parts(usage.playlists.length, usage.layouts.length, usage.programs.length).join(" · ");

/** Same shape for a refused Permanent delete. */
export const blockerSummary = (blockers: AssetDeleteBlockers) =>
  parts(blockers.playlists.length, blockers.layouts.length, blockers.programs.length).join(" · ");

/** True when Core refused the delete. A result without `deleted` comes from an older route and counts as done. */
export const isDeleteBlocked = (result: { deleted?: boolean }) => result.deleted === false;

/** Loading line in Move to Trash. One file takes "is"; a batch takes "are". */
export const trashUsageLoadingCopy = (count: number) =>
  `Checking where ${count === 1 ? "this file is" : "these files are"} used…`;
