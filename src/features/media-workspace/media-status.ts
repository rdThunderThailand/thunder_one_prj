import type { BadgeColor } from "@/components/ui/Badge";

export type MediaStatusEntry = { label: string; color: BadgeColor };

/** One label and tone per Media state (ADR 0125). Every Media badge reads from here. */
export const MEDIA_STATUS = {
  active: { label: "Active", color: "green" },
  live: { label: "Live", color: "green" },
  online: { label: "Online", color: "green" },
  ready: { label: "Ready", color: "green" },
  scheduled: { label: "Scheduled", color: "blue" },
  publishing: { label: "Publishing", color: "indigo" },
  processing: { label: "Processing", color: "indigo" },
  warning: { label: "Warning", color: "yellow" },
  failed: { label: "Failed", color: "red" },
  offline: { label: "Offline", color: "red" },
  draft: { label: "Draft", color: "zinc" },
  inactive: { label: "Inactive", color: "zinc" },
  ended: { label: "Ended", color: "zinc" },
  archived: { label: "Archived", color: "zinc" },
  expired: { label: "Expired", color: "zinc" },
  no_player: { label: "No player", color: "zinc" },
} as const satisfies Record<string, MediaStatusEntry>;

/** Backend values are not ours to control: an unknown state is neutral with its raw value, never a throw. */
export function mediaStatus(state: string): MediaStatusEntry {
  return Object.hasOwn(MEDIA_STATUS, state)
    ? MEDIA_STATUS[state as keyof typeof MEDIA_STATUS]
    : { label: state, color: "zinc" };
}
