/**
 * Drift detection for a composition Publication (ADR 0049 §7, §11).
 *
 * Activation freezes the Composition into a snapshot together with the revision of everything it
 * materialized (ticket 05); `media_publication_get` returns each recorded value beside the live one.
 * The comparison is here rather than in SQL because the indicator has to name *what* changed — the
 * Composition, its Layout, or which Playlist — and a boolean could not.
 *
 * This replaces `hasLayoutZoneDrift` from the superseded model, which diffed Zone id sets and so
 * fired on every Layout save while missing every real content change.
 */

/** One Channel named in a Group's `added`/`removed` set (ADR 0074 §6). */
export type PublicationDriftGroupChannel = { channel_id: string; name: string };

/** Reported only for a Group whose live membership no longer matches the snapshot's
 *  provenance rows — `media_publication_get` omits a Group with no change at all. */
export type PublicationDriftGroup = {
  group_id: string;
  name: string;
  added: PublicationDriftGroupChannel[];
  removed: PublicationDriftGroupChannel[];
};

/** The recorded/live pairs as `media_publication_get` returns them. Both fields are `null`
 *  outright (not an object of null recorded/live) on a flat Publication's snapshot — the SQL
 *  only builds the object `WHEN pub.composition_id IS NOT NULL` (ADR 0074 §6). A flat
 *  Publication targeting a Group gets a non-null `drift_check` too, so this case is real, not
 *  hypothetical. */
export type PublicationDriftCheck = {
  composition_revision: { recorded: number | null; live: number | null } | null;
  layout_updated_at: { recorded: string | null; live: string | null } | null;
  zones: {
    zone_name: string | null;
    playlist_name: string;
    recorded_revision: number | null;
    live_revision: number | null;
  }[];
  /** Absent on a flat (non-composition) Publication's snapshot, which the backend never
   *  attaches Group provenance rows to unless it targeted a Group (ADR 0074 §6). */
  groups?: PublicationDriftGroup[];
};

/** One thing that changed since publish. `zone_name` is the name as published. */
export type DriftFinding =
  | { level: "composition" }
  | { level: "layout" }
  | { level: "playlist"; zoneName: string | null; playlistName: string }
  | { level: "group"; groupName: string; added: string[]; removed: string[] };

/**
 * Every level that no longer matches what is airing, in the order an operator reads them:
 * the Composition first, then its Layout, then each Zone's Playlist.
 *
 * Empty means nothing to re-publish. Two guards make it empty regardless of the values:
 * a Publication that is not `active` is airing nothing, and a flat Publication has no Composition
 * to drift from — the backend sends `drift_check: null` for the second, and for a composition
 * Publication that was never activated and so has no snapshot.
 */
export function publicationDrift(publication: {
  status: string;
  drift_check?: PublicationDriftCheck | null;
}): DriftFinding[] {
  if (publication.status !== "active") return [];

  const check = publication.drift_check;
  if (!check) return [];

  const findings: DriftFinding[] = [];

  if (check.composition_revision && hasChanged(check.composition_revision.recorded, check.composition_revision.live)) {
    findings.push({ level: "composition" });
  }
  if (check.layout_updated_at && hasChanged(check.layout_updated_at.recorded, check.layout_updated_at.live)) {
    findings.push({ level: "layout" });
  }
  for (const zone of check.zones) {
    if (hasChanged(zone.recorded_revision, zone.live_revision)) {
      findings.push({
        level: "playlist",
        zoneName: zone.zone_name,
        playlistName: zone.playlist_name,
      });
    }
  }
  // The backend only lists a Group here when its live membership no longer matches the
  // snapshot's provenance rows (ADR 0074 §6), so every entry is drift — no hasChanged gate.
  for (const group of check.groups ?? []) {
    findings.push({
      level: "group",
      groupName: group.name,
      added: group.added.map((c) => c.name),
      removed: group.removed.map((c) => c.name),
    });
  }

  return findings;
}

/**
 * A missing value on either side is not drift. A null recorded value means the snapshot predates
 * the drift columns, and a null live value means the row it was read from is gone — neither is a
 * change an operator could act on, and both would otherwise flag every old Publication forever.
 */
function hasChanged(recorded: number | string | null, live: number | string | null): boolean {
  if (recorded === null || live === null) return false;
  return recorded !== live;
}
