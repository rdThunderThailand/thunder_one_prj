import type { MediaDeviceHealth } from "../../../types/domain.ts";

/** `media_channel_player_candidates` — every credentialed asset of the tenant, ungrouped; the
 *  frontend buckets into Available/Unavailable (D5). No `outputs` field exists on this contract. */
export interface ChannelPlayerCandidate {
  id: string;
  name: string;
  code: string;
  model: string | null;
  location: { id: string; name: string } | null;
  registryStatus: string;
  neverConnected: boolean;
  health: MediaDeviceHealth;
  lastHeartbeatAt: string | null;
  orientation: "landscape" | "portrait" | null;
  resolution: string | null;
  reservedByChannel: { id: string; name: string } | null;
}

/** `excludeChannelId`: the edit page's own Channel — a candidate the RPC reports as reserved by
 *  that same Channel is not "in use by someone else", it is this Channel's current Player, still
 *  selectable (and still the pre-selected one). Omit it entirely on the create wizard. */
export function isPlayerAvailable(candidate: ChannelPlayerCandidate, excludeChannelId?: string): boolean {
  if (candidate.neverConnected) return false;
  if (candidate.reservedByChannel === null) return true;
  return candidate.reservedByChannel.id === excludeChannelId;
}

/** D5's exact wording: "never connected" / "in use by CH-x" — no "outputs available" (the Player
 *  does not report outputs, ticket 08 deviation). */
export function unavailableReason(candidate: ChannelPlayerCandidate, excludeChannelId?: string): string | null {
  if (candidate.reservedByChannel && candidate.reservedByChannel.id !== excludeChannelId) {
    return `In use by ${candidate.reservedByChannel.name}`;
  }
  if (candidate.neverConnected) return "Never connected";
  return null;
}

export function partitionPlayerCandidates(
  candidates: readonly ChannelPlayerCandidate[],
  excludeChannelId?: string,
): {
  available: ChannelPlayerCandidate[];
  unavailable: ChannelPlayerCandidate[];
} {
  const available: ChannelPlayerCandidate[] = [];
  const unavailable: ChannelPlayerCandidate[] = [];
  for (const candidate of candidates) {
    (isPlayerAvailable(candidate, excludeChannelId) ? available : unavailable).push(candidate);
  }
  return { available, unavailable };
}

export function filterPlayerCandidates(
  candidates: readonly ChannelPlayerCandidate[],
  search: string,
): ChannelPlayerCandidate[] {
  const query = search.trim().toLowerCase();
  if (!query) return [...candidates];
  return candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(query) ||
      candidate.code.toLowerCase().includes(query) ||
      (candidate.location?.name.toLowerCase().includes(query) ?? false),
  );
}
