import assert from "node:assert/strict";
import { mapNowNextPrograms } from "./now-next-programs.ts";
import type { NowNextOccurrence, NowNextResponse, NowNextRow } from "../publications/now-next.ts";

type Publication = NowNextOccurrence["publications"][number];

const pub = (id: string, name: string): Publication => ({
  id,
  name,
  publication_type: "playlist",
  content_name: null,
  thumbnail_url: `${id}.jpg`,
});

const occurrence = (publications: Publication[], over: Partial<NowNextOccurrence> = {}): NowNextOccurrence => ({
  occurrence_id: `occ-${publications[0].id}`,
  opens_at: "2026-09-08T10:00:00.000Z",
  closes_at: null,
  remaining_seconds: null,
  priority: "normal",
  output_kind: publications.length > 1 ? "merged_loop" : "publication",
  publications,
  scheduled_now: true,
  playback_state: "confirmed",
  suppressed: [],
  ...over,
});

const row = (over: Partial<NowNextRow> = {}): NowNextRow => ({
  row_type: "channel",
  channel: { id: "channel", name: "Channel" },
  device: null,
  devices: [],
  current: null,
  upcoming: [],
  suppressed_count: 0,
  ...over,
});

const response = (rows: NowNextRow[]): NowNextResponse => ({
  as_of: "2026-09-08T09:00:00.000Z",
  display_timezone: "Asia/Bangkok",
  horizon_minutes: 180,
  freshness: { online_before: "2026-09-08T08:55:00.000Z", warning_before: "2026-09-08T08:45:00.000Z" },
  summary: {
    scheduled_now_channels: 0,
    playback_confirmed_channels: 0,
    upcoming_60m_channels: 0,
    upcoming_3h_channels: 0,
    total_active_channels: 0,
  },
  rows,
});

const alpha = pub("a", "Alpha");
const beta = pub("b", "Beta");
const gamma = pub("c", "Gamma");

// One Publication across several rows folds into one candidate, ranked by rows occupied and
// split into Channels and direct Devices.
{
  const spread = mapNowNextPrograms(
    response([
      row({ current: occurrence([alpha]) }),
      row({ current: occurrence([alpha]) }),
      row({ row_type: "direct_device", channel: null, device: { id: "d", name: "D" }, current: occurrence([alpha]) }),
    ])
  );
  assert.equal(spread.nowPlaying?.id, "a");
  assert.equal(spread.nowPlaying?.channelRows, 2);
  assert.equal(spread.nowPlaying?.deviceRows, 1);
  assert.equal(spread.nowPlaying?.confirmedRows, 3);
  assert.equal(spread.nowPlaying?.thumbnailUrl, "a.jpg");
  assert.equal(spread.nextUp, null);
}

// A merged loop contributes its first Publication, labelled with how many it hides.
{
  const merged = mapNowNextPrograms(response([row({ current: occurrence([beta, alpha, gamma]) })]));
  assert.equal(merged.nowPlaying?.id, "b");
  assert.equal(merged.nowPlaying?.mergedWith, 2);
}

// A tie on the ranking key breaks by Publication name.
{
  const tied = mapNowNextPrograms(
    response([row({ current: occurrence([beta]) }), row({ current: occurrence([alpha]) })])
  );
  assert.equal(tied.nowPlaying?.id, "a");
  assert.equal(tied.nowPlaying?.confirmedRows, 1);
}

// An empty response — and an absent one — leave both cards on their empty state.
assert.deepEqual(mapNowNextPrograms(response([])), { nowPlaying: null, nextUp: null });
assert.deepEqual(mapNowNextPrograms(null), { nowPlaying: null, nextUp: null });

// Nothing upcoming inside the horizon: Next Up is empty even though rows are airing now.
assert.equal(mapNowNextPrograms(response([row({ current: occurrence([alpha]) })])).nextUp, null);

// A `current` set that is entirely `not_confirmed` never lights the card — the rows are
// scheduled, but nothing is playing on them.
{
  const quiet = mapNowNextPrograms(
    response([
      row({ current: occurrence([alpha], { playback_state: "not_confirmed" }) }),
      row({ current: occurrence([beta], { playback_state: "stale" }) }),
    ])
  );
  assert.equal(quiet.nowPlaying, null);
}

// A mixed set: rank counts confirmed rows only, while the target summary counts every row the
// Publication occupies.
{
  const mixed = mapNowNextPrograms(
    response([
      row({ current: occurrence([beta]) }),
      row({ current: occurrence([beta]) }),
      row({ current: occurrence([alpha]) }),
      row({ current: occurrence([alpha], { playback_state: "stale" }) }),
      row({ current: occurrence([alpha], { playback_state: "not_confirmed" }) }),
    ])
  );
  assert.equal(mixed.nowPlaying?.id, "b");
  assert.equal(mixed.nowPlaying?.confirmedRows, 2);
  const quieter = mapNowNextPrograms(response([row({ current: occurrence([alpha], { playback_state: "stale" }) })]));
  assert.equal(quieter.nowPlaying, null);
}

// Next Up takes the earliest opening outright, whatever it is playing on.
{
  const soonest = mapNowNextPrograms(
    response([
      row({
        upcoming: [
          occurrence([beta], { opens_at: "2026-09-08T11:00:00.000Z" }),
          occurrence([alpha], { opens_at: "2026-09-08T12:00:00.000Z" }),
        ],
      }),
      row({ upcoming: [occurrence([alpha], { opens_at: "2026-09-08T12:00:00.000Z" })] }),
    ])
  );
  assert.equal(soonest.nextUp?.id, "b");
  assert.equal(soonest.nextUp?.opensAt, "2026-09-08T11:00:00.000Z");
  assert.equal(soonest.nextUp?.channelRows, 1);
}

// Two occurrences opening at the same instant rank by distinct rows occupied; a Publication
// appearing twice within one row does not raise its rank.
{
  const at = "2026-09-08T11:00:00.000Z";
  const simultaneous = mapNowNextPrograms(
    response([
      row({ upcoming: [occurrence([alpha], { opens_at: at }), occurrence([alpha], { opens_at: at })] }),
      row({ upcoming: [occurrence([beta], { opens_at: at })] }),
      row({ upcoming: [occurrence([beta], { opens_at: at })] }),
    ])
  );
  assert.equal(simultaneous.nextUp?.id, "b");
  assert.equal(simultaneous.nextUp?.channelRows, 2);
}

console.log("now-next programs checks passed");
