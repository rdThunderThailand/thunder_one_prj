/**
 * What pressing Apply on a Playlist's Playback Pattern resolved to (ADR 0083). The pattern is the
 * shared Playlist's own `play_mode`, so the write reaches every Program that uses it.
 */
export type PatternApplyOutcome =
  | { kind: "saved" }
  | { kind: "cancelled" }
  | { kind: "count-failed" }
  | { kind: "save-failed" };

/**
 * Re-count the active or scheduled Programs using the Playlist at Apply time (a count loaded with
 * the field can be stale), ask first when there are any, and write only then. An unknown count is
 * never treated as zero: the write is refused.
 */
export async function applyPlaybackPattern(args: {
  fetchCount: () => Promise<number>;
  confirm: (count: number) => Promise<boolean>;
  write: () => Promise<void>;
}): Promise<PatternApplyOutcome> {
  let count: number;
  try {
    count = await args.fetchCount();
  } catch {
    return { kind: "count-failed" };
  }
  if (count > 0 && !(await args.confirm(count))) return { kind: "cancelled" };
  try {
    await args.write();
    return { kind: "saved" };
  } catch {
    return { kind: "save-failed" };
  }
}
