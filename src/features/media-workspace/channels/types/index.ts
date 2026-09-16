import type { MediaDeviceHealth } from "../../../../types/domain.ts";

/**
 * ADR 0037: one status, three values. `draft` is stored; `active` / `inactive` are derived
 * server-side from `publication_count` — a committed Channel that nothing publishes to is Inactive.
 * Device liveness is no longer a second status axis; it is read off `devices[].health`.
 */
export type ChannelLifecycle = "draft" | "active" | "inactive";
export type ChannelCategory = "dooh" | "in_store" | "online" | "social";
export type ChannelOrientation = "landscape" | "portrait";

/** ADR 0074 §2: Output Kind replaces Channel Category as the wizard's type choice. */
export type ChannelOutputKind = "screen" | "tv" | "kiosk";

/** ADR 0074 §4: Channel health is the Player's health; `Degraded` no longer exists. */
export type ChannelHealth = "online" | "warning" | "offline";

/** A Physical Device candidate read from the existing `/media/screens` endpoint.
 * It is intentionally not a Channel row. */
export interface ChannelDevice {
  id: string;
  name: string;
  code: string;
  health: MediaDeviceHealth;
  last_heartbeat_at: string | null;
  orientation: ChannelOrientation | null;
  resolution: string | null;
  /** Latest reported value only (ADR 0042 decision 4) — not a history, overwritten every heartbeat. */
  sync_phase_error_ms: number | null;
  sync_loop_duration_seconds: number | null;
}

export interface ChannelTypeOption {
  id: string;
  code: string;
  name: string;
  channel_category: ChannelCategory;
  is_active?: boolean;
}

export interface ChannelLocationOption {
  id: string;
  name: string;
}

export interface ChannelGroupSummary {
  id: string;
  name: string;
  playback_mode: "synchronized" | "independent";
}

/** ADR 0074 §3. `NULL` on a single-screen Channel. */
export interface ChannelDisplayConfigScreen {
  index: number;
  resolution: string;
  output: string;
}

/** `rows`/`cols` matrix, e.g. `{rows: 1, cols: 3}` for a 1×3 horizontal wall — matches
 *  `media_core.channel_canvas`'s `(cols*w)x(rows*h)` canvas derivation exactly. */
export interface ChannelDisplayArrangement {
  rows: number;
  cols: number;
}

export interface ChannelDisplayConfig {
  mode: "single" | "multi";
  arrangement: ChannelDisplayArrangement;
  screens: ChannelDisplayConfigScreen[];
}

/** Reference rows owned by the future Channel API. Device and playlist choices
 * deliberately stay on their existing read endpoints until those contracts move. */
export interface ChannelReferenceData {
  channel_types: ChannelTypeOption[];
  locations: ChannelLocationOption[];
}

export interface ChannelListItem {
  id: string;
  name: string;
  description: string | null;
  lifecycle: ChannelLifecycle;
  category: ChannelCategory;
  channel_type: ChannelTypeOption | null;
  location: { id: string; name: string } | null;
  /** ADR 0074 §1: one Device; `null` on a Player-less Draft. */
  player: ChannelDevice | null;
  /** The Player's health, or `null` on a Player-less Draft ("No player" in the UI). */
  health: ChannelHealth | null;
  output_kind: ChannelOutputKind;
  display_config: ChannelDisplayConfig | null;
  groups: ChannelGroupSummary[];
  /** Derived server-side from the canvas (ADR 0074 §3); read-only. */
  expected_orientation: ChannelOrientation | null;
  expected_resolution: string | null;
  default_playlist: { id: string; name: string } | null;
  revision: number;
  updated_at: string;
}

export interface ChannelDetail extends ChannelListItem {
  created_at: string;
}

/** "multi" is a Channel whose `display_config.mode` is `"multi"`, independent of its Output Kind. */
export type ChannelTypeFilter = ChannelOutputKind | "multi";
/** "no_player" is a Player-less Draft (`health === null`). ADR 0074 §4 — status is the Player's
 *  health; `Degraded` does not exist as a filter value. */
export type ChannelStatusFilter = ChannelHealth | "no_player";

export interface ChannelFilters {
  search: string;
  type: ChannelTypeFilter | "all";
  status: ChannelStatusFilter | "all";
  lifecycle: ChannelLifecycle | "all";
}
