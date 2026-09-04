export type PlaybackPreviewItem = {
  mediaAssetId: string;
  label?: string;
  durationSeconds?: number | null;
  transition?: string | null;
};

export type PlaybackPreviewSettings = {
  playMode?: "sequential" | "shuffle";
  repeat?: "loop" | "once";
  startFrom?: "first" | "resume";
  // ADR 0061 §2: Playlist-level defaults carried through to Playlist Information. Types only —
  // previewFrameAt() does not read them; making them play is #42.
  defaultTransition?: string | null;
  transitionDurationSeconds?: number | null;
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

export type ZonePreviewFrame = {
  item: PlaybackPreviewItem | null;
  itemIndex: number | null;
  offsetSeconds: number;
  loopDurationSeconds: number;
};

const duration = (item: PlaybackPreviewItem) => Math.max(0, item.durationSeconds ?? 0);

export function zoneLoopDurationSeconds(items: PlaybackPreviewItem[]): number {
  return items.reduce((total, item) => total + duration(item), 0);
}

/** The selected item is derived entirely from shared preview time, never a Zone-local timer. */
export function previewFrameAt(items: PlaybackPreviewItem[], timeSeconds: number): ZonePreviewFrame {
  const loopDurationSeconds = zoneLoopDurationSeconds(items);
  if (loopDurationSeconds <= 0) {
    return { item: items[0] ?? null, itemIndex: items.length ? 0 : null, offsetSeconds: 0, loopDurationSeconds };
  }

  let offsetSeconds = Math.max(0, timeSeconds) % loopDurationSeconds;
  for (let index = 0; index < items.length; index += 1) {
    const itemDuration = duration(items[index]);
    if (itemDuration > 0 && offsetSeconds < itemDuration) {
      return { item: items[index], itemIndex: index, offsetSeconds, loopDurationSeconds };
    }
    offsetSeconds -= itemDuration;
  }

  return { item: items.at(-1) ?? null, itemIndex: items.length - 1, offsetSeconds: 0, loopDurationSeconds };
}
