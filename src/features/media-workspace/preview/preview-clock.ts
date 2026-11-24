export type PlaybackPreviewItem = {
  mediaAssetId: string;
  label?: string;
  durationSeconds?: number | null;
  transition?: string | null;
  /** Per-item override — undefined inherits the Playlist default (ADR 0062 §5). */
  transitionDurationSeconds?: number | null;
  mediaFit?: string | null;
  /** Per-item and nullable: `null` paints none, so the Layout background shows (ADR 0060 §5a). */
  backgroundColor?: string | null;
};

export type PlaybackPreviewSettings = {
  playMode?: "sequential" | "shuffle";
  repeat?: "loop" | "once";
  startFrom?: "first" | "resume";
  defaultTransition?: string | null;
  transitionDurationSeconds?: number | null;
  mediaFit?: string | null;
  /** ADR 0064 §1: set only for a Composition Zone's own `media_fit`, which wins outright over
   *  both the item's and the Playlist's — never present for a flat Playlist preview. */
  zoneMediaFitOverride?: string | null;
  /** ADR 0064 §7: a state label only — the preview stays silent regardless (browser autoplay
   *  policy), so this is never wired to actual playback audio. */
  zoneMuted?: boolean;
};

export type PlaybackPreviewZone = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  items: PlaybackPreviewItem[];
  playback?: PlaybackPreviewSettings;
};

/** One full playback cycle of a Zone, computed once and read by everything else (ADR 0062 §1). */
export type ZoneSchedule = {
  order: number[];
  starts: number[];
  fades: number[];
  totalSeconds: number;
  repeat: "loop" | "once";
};

export type ZonePreviewFrame = {
  item: PlaybackPreviewItem | null;
  itemIndex: number | null;
  offsetSeconds: number;
  loopDurationSeconds: number;
  ended: boolean;
  transition: {
    outgoingItem: PlaybackPreviewItem;
    outgoingIndex: number;
    outgoingOffsetSeconds: number;
    progress: number;
  } | null;
};

const duration = (item: PlaybackPreviewItem) => Math.max(0, item.durationSeconds ?? 0);

/** ADR 0062 §5: kind falls back item → Playlist default → "fade"; length falls back item → Playlist
 *  default → 1s, and a "cut" is always 0 regardless of any stored number. */
function transitionLength(item: PlaybackPreviewItem, playback: PlaybackPreviewSettings | undefined): number {
  const kind = item.transition ?? playback?.defaultTransition ?? "fade";
  if (kind === "cut") return 0;
  return Math.max(0, item.transitionDurationSeconds ?? playback?.transitionDurationSeconds ?? 1);
}

// ponytail: FNV-1a + mulberry32, not crypto-grade — this only needs to be a stable, deterministic
// permutation per Zone id, not secure randomness.
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(indexes: number[], seed: string): number[] {
  const rng = mulberry32(hashSeed(seed));
  const result = indexes.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * One cycle's worth of playback order and timing, a pure function of `(items, playback, seed)`.
 * `seed` is the Zone id: shuffle must reproduce the same order for the same Zone on every render,
 * scrub and reload (ADR 0062 §2).
 *
 * ADR 0094: a transition adds no time. `starts` and `totalSeconds` are media durations alone —
 * the same `start_offset` / `loop_duration` the device receives — and `fades[k]` is the incoming
 * crossfade of `items[order[k]]`, played over the first seconds of that item's own slot (capped at
 * its duration). `fades[0]` is the loop's wrap on the device (last item into the first).
 */
export function zoneSchedule(
  items: PlaybackPreviewItem[],
  playback: PlaybackPreviewSettings | undefined,
  seed: string
): ZoneSchedule {
  const repeat: "loop" | "once" = playback?.repeat === "once" ? "once" : "loop";
  const n = items.length;
  const authoredOrder = items.map((_, index) => index);
  const order = playback?.playMode === "shuffle" && n > 1 ? seededShuffle(authoredOrder, seed) : authoredOrder;

  const fades = order.map((itemIndex) => Math.min(transitionLength(items[itemIndex], playback), duration(items[itemIndex])));

  const starts: number[] = [];
  let cursor = 0;
  for (let k = 0; k < n; k += 1) {
    starts.push(cursor);
    cursor += duration(items[order[k]]);
  }

  return { order, starts, fades, totalSeconds: cursor, repeat };
}

/** The selected item is derived entirely from shared preview time, never a Zone-local timer
 *  (ADR 0051 §4). `repeat` is resolved here, per Zone; the global clock's wrap decision is separate
 *  (ADR 0062 §3). */
export function previewFrameAt(
  schedule: ZoneSchedule,
  items: PlaybackPreviewItem[],
  timeSeconds: number
): ZonePreviewFrame {
  const { order, starts, fades, totalSeconds, repeat } = schedule;
  const n = order.length;
  if (n === 0) {
    return { item: null, itemIndex: null, offsetSeconds: 0, loopDurationSeconds: totalSeconds, ended: false, transition: null };
  }

  let time = Math.max(0, timeSeconds);
  let ended = false;
  if (totalSeconds <= 0) {
    time = 0;
  } else if (repeat === "once") {
    if (time >= totalSeconds) {
      time = totalSeconds;
      ended = true;
    }
  } else {
    time %= totalSeconds;
  }

  if (ended) {
    const lastIndex = order[n - 1];
    return {
      item: items[lastIndex] ?? null,
      itemIndex: lastIndex,
      offsetSeconds: duration(items[lastIndex]),
      loopDurationSeconds: totalSeconds,
      ended: true,
      transition: null,
    };
  }

  let k = 0;
  for (let i = 1; i < n; i += 1) {
    if (starts[i] <= time) k = i;
    else break;
  }

  const itemIndex = order[k];
  const relative = time - starts[k];
  // ponytail: the loop's wrap fade (fades[0], last → first) is not drawn — the clock hands every
  // cycle the same t, so a fade at t = 0 would park the paused preview on the last item. The device
  // still crossfades at the wrap; pass the unwrapped time in here if the preview must show it.
  const fade = k > 0 ? fades[k] : 0;
  const outgoingIndex = order[k - 1];

  return {
    item: items[itemIndex] ?? null,
    itemIndex,
    offsetSeconds: relative,
    loopDurationSeconds: totalSeconds,
    ended: false,
    // The outgoing item holds its last frame while the incoming one plays from its own start.
    transition: fade > 0 && relative < fade
      ? {
          outgoingItem: items[outgoingIndex],
          outgoingIndex,
          outgoingOffsetSeconds: duration(items[outgoingIndex]),
          progress: relative / fade,
        }
      : null,
  };
}
