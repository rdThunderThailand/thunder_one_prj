export type PlaybackCandidate = {
  id: string;
  name: string;
  publication_type: string;
  targets?: Array<{ status?: string | null }>;
  publication_targets?: Array<{ target_type: "channel" | "device" }>;
  playback_window?: { state?: "before" | "open" | "between" | "ended"; next_opens_at: string | null } | null;
};

export type ProgramStatus = {
  publication: PlaybackCandidate;
  playingTargets: number;
  channelTargets: number;
  deviceTargets: number;
};

function toStatus(publication: PlaybackCandidate): ProgramStatus {
  return {
    publication,
    playingTargets: publication.targets?.filter((target) => target.status === "playing").length ?? 0,
    channelTargets: publication.publication_targets?.filter((target) => target.target_type === "channel").length ?? 0,
    deviceTargets: publication.publication_targets?.filter((target) => target.target_type === "device").length ?? 0,
  };
}

export function selectNowPlaying(publications: readonly PlaybackCandidate[]): ProgramStatus | null {
  return publications
    .map(toStatus)
    .filter((status) => status.publication.playback_window?.state === "open" && status.playingTargets > 0)
    .sort((a, b) => b.playingTargets - a.playingTargets || a.publication.name.localeCompare(b.publication.name))[0] ?? null;
}

export function selectNextProgram(publications: readonly PlaybackCandidate[], now = Date.now()): ProgramStatus | null {
  return publications
    .map(toStatus)
    .filter(({ publication }) => {
      const next = publication.playback_window?.next_opens_at;
      return next !== null && next !== undefined && Date.parse(next) > now;
    })
    .sort((a, b) => Date.parse(a.publication.playback_window!.next_opens_at!) - Date.parse(b.publication.playback_window!.next_opens_at!))[0] ?? null;
}
