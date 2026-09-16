// ADR 0065 §2. Overview's two Program cards are a fold of one `/media/now-next` response.
//
// Now & Next already resolves priority suppression, merged equal-priority loops and heartbeat
// freshness (ADR 0057). Nothing here re-decides any of that — this only folds its per-Channel
// rows into the single Publication each card draws, and the fold is a decided contract rather
// than a mapping exercise, because the two shapes do not line up: Now & Next returns one row
// per Channel or direct Media Device, an occurrence may carry several Publications, and its
// horizon is bounded where the old card's Next Up was not.

import type { NowNextOccurrence, NowNextResponse, NowNextRow } from "@/features/media-workspace/publications";

type NowNextPublication = NowNextOccurrence["publications"][number];

/** One Program card's subject. `null` in `NowNextPrograms` means the card draws its empty state. */
export type ProgramCardModel = {
  id: string;
  name: string;
  publicationType: string;
  /** Now & Next carries the cover, so the card resolves no preview URLs of its own. */
  thumbnailUrl: string | null;
  /** Rows this Publication occupies in this response, split by row type. */
  channelRows: number;
  deviceRows: number;
  /** Rows reporting `confirmed` — the card's "N Playing" footer, and Now Playing's rank. */
  confirmedRows: number;
  /** Next Up only: the earliest `opens_at` this Publication was seen at. */
  opensAt: string | null;
  /** `+N more` when the airing the card points at is a merged loop; 0 otherwise. */
  mergedWith: number;
};

export type NowNextPrograms = {
  nowPlaying: ProgramCardModel | null;
  nextUp: ProgramCardModel | null;
};

/** `publications[0]` is the card's subject; the rest of a merged loop are disclosed as
 *  `+N more` and never become candidates of their own. */
function subjectOf(occurrence: NowNextOccurrence): NowNextPublication | undefined {
  return occurrence.publications[0];
}

function occupy(
  drafts: Map<string, ProgramCardModel>,
  row: NowNextRow,
  publication: NowNextPublication
): ProgramCardModel {
  const draft = drafts.get(publication.id) ?? {
    id: publication.id,
    name: publication.name,
    publicationType: publication.publication_type,
    thumbnailUrl: publication.thumbnail_url ?? null,
    channelRows: 0,
    deviceRows: 0,
    confirmedRows: 0,
    opensAt: null,
    mergedWith: 0,
  };
  if (row.row_type === "channel") draft.channelRows += 1;
  else draft.deviceRows += 1;
  drafts.set(publication.id, draft);
  return draft;
}

const opensAtMs = (draft: ProgramCardModel) =>
  draft.opensAt === null ? Number.POSITIVE_INFINITY : Date.parse(draft.opensAt);

export function mapNowNextPrograms(response: NowNextResponse | null | undefined): NowNextPrograms {
  const current = new Map<string, ProgramCardModel>();
  const upcoming = new Map<string, ProgramCardModel>();

  for (const row of response?.rows ?? []) {
    const currentSubject = row.current ? subjectOf(row.current) : undefined;
    if (row.current && currentSubject) {
      const draft = occupy(current, row, currentSubject);
      if (row.current.playback_state === "confirmed") draft.confirmedRows += 1;
      // Now Playing spans rows rather than one occurrence, so the label reports the widest
      // merge any of them carries.
      draft.mergedWith = Math.max(draft.mergedWith, row.current.publications.length - 1);
    }

    // A Publication appearing more than once within a single row does not raise its rank
    // (ADR §2), so each row contributes at most one occurrence per Publication — the earliest.
    const earliestInRow = new Map<string, { occurrence: NowNextOccurrence; publication: NowNextPublication }>();
    for (const occurrence of row.upcoming) {
      const publication = subjectOf(occurrence);
      if (!publication) continue;
      const held = earliestInRow.get(publication.id);
      if (!held || Date.parse(occurrence.opens_at) < Date.parse(held.occurrence.opens_at)) {
        earliestInRow.set(publication.id, { occurrence, publication });
      }
    }
    for (const { occurrence, publication } of earliestInRow.values()) {
      const draft = occupy(upcoming, row, publication);
      if (Date.parse(occurrence.opens_at) < opensAtMs(draft)) {
        draft.opensAt = occurrence.opens_at;
        // Next Up points at one airing, so its label follows that airing rather than the widest.
        draft.mergedWith = occurrence.publications.length - 1;
      }
    }
  }

  // Rank is confirmed rows, the closest available reading of the old `playingTargets` sort,
  // with the `localeCompare` tie-break the previous selector used. A row that is merely
  // scheduled never reaches the card, because the card's LIVE badge is unconditional on it.
  const nowPlaying = [...current.values()]
    .filter((draft) => draft.confirmedRows > 0)
    .sort((a, b) => b.confirmedRows - a.confirmedRows || a.name.localeCompare(b.name))[0] ?? null;

  // Earliest opening wins outright; row count is only the tie-break, preserving a selector
  // that sorted on `next_opens_at` and ignored target counts entirely.
  const nextUp = [...upcoming.values()]
    .sort(
      (a, b) =>
        opensAtMs(a) - opensAtMs(b) ||
        b.channelRows + b.deviceRows - (a.channelRows + a.deviceRows) ||
        a.name.localeCompare(b.name)
    )[0] ?? null;

  return { nowPlaying, nextUp };
}
