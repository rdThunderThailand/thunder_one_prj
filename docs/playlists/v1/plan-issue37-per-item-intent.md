# Plan — #37 Per-item playback intent reaches the player payload

Decision record: `docs/adr/0060-playlist-editor-single-page.md` §5, extended by the resolution
rules settled on 2026-09-03 (this plan's §0).

Two repos. `Thunder_Core` owns the schema, `media_publication_activate` and `media_job_poll`;
`thunder_one_prj` owns the editor pane, `metadata.ts` and the contract doc.

## 0. Resolution rules (settled — do not re-litigate)

| field | playlist-level source | snapshot column | resolved when absent everywhere |
|---|---|---|---|
| `transition_duration_seconds` | `metadata.playback.transition_duration` (seconds) | `NOT NULL` | `1` when the item's transition is `fade`; `0` when `cut` |
| `fit` | `metadata.playback.media_fit` (`fit\|fill\|stretch`) | `NOT NULL` | `'fit'` |
| `background_color` | **none — per-item only** | nullable | `NULL` = do not paint a background |
| `notes` | **none — per-item only** | nullable | `NULL` |

- `1` for an unset fade is not an invented number: it mirrors `duration.ts:37`
  (`transition === "cut" ? 0 : playback.transitionDuration ?? 1`), which is what the editor
  already shows in the loop length. The migration comment must say so.
- `'fit'` is the only default that cannot silently crop or distort a tenant's media.
- Inheritance resolves against `playlists.metadata.playback` on **both** the flat and the zoned
  activation path. ADR 0060 §3b concerns the Zone's `playback` object (`play_mode` / `repeat` /
  `start_from`), not per-item inheritance; `duration_seconds` already COALESCEs identically on
  both paths.
- `notes` is stored for provenance but **not emitted in the poll payload** — it is an authoring
  annotation no player acts on, and every poll (~60s, every device) would carry it. This
  deliberately narrows issue #37's AC; record the reason in the issue.
- `playlist_items.transition` stays `NOT NULL DEFAULT 'cut'`, seeded at add-time from
  `defaultTransition` (`playlist-editor-state.ts:79`). It does **not** become inheriting: that
  would mean migrating 133 production rows while guessing which `cut` was intended and which was
  a default. Mark the split rule with a `ponytail:` comment on the column.

## Phases

Each phase ends verifiable on its own. Do not start a phase before the previous one is verified.

### Phase 1 — `playlist_items` columns (Thunder_Core, R0)

- Migration adds four nullable columns; `fit` gets a `CHECK (fit IN ('fit','fill','stretch'))`,
  `transition_duration_seconds` a `CHECK (>= 0)`.
- `COMMENT ON COLUMN` for each: name the unit on `transition_duration_seconds`, and state
  `NULL = inherit the playlist's value` on the two that inherit / `NULL = unset` on the two that
  do not.
- **Verify:** `\d media_core.playlist_items` on the dev DB shows the columns and constraints.

### Phase 2 — write path (Thunder_Core)

- Whatever RPC the editor saves items through must accept and persist the four values, passing
  `NULL` through unchanged rather than coercing empties to defaults — the distinction between
  "inherit" and "explicitly this value" lives here.
- **Verify:** save an item with all four set and one with all four empty; read both rows back.

### Phase 3 — snapshot columns + materialization (Thunder_Core, R0)

- `publication_snapshot_items` gains the four columns with the nullability from §0. Existing rows
  backfill from the column defaults (`0`, `'fit'`, `NULL`, `NULL`).
- `media_publication_activate`: extend **both** INSERT…SELECT branches (flat and composition) with
  the COALESCE chains from §0. The `cut` → `0` rule is a CASE on the item's resolved transition,
  not a COALESCE.
- `CREATE OR REPLACE FUNCTION` keeps the same signature here, so no `DROP FUNCTION` is needed —
  but re-check the signature before writing, and re-`GRANT`/`REVOKE` to match the original if a
  DROP does turn out to be necessary.
- **Verify:** activate a Publication on dev; `SELECT` the snapshot rows and check every resolution
  case — item override, playlist inherit, nothing set anywhere, and a `cut` item.

### Phase 4 — poll payload (Thunder_Core, R0)

- `media_job_poll`: add `transition_duration_seconds`, `fit` and `background_color` as **flat keys
  on `slot_base`**, beside the existing `transition`. Not inside the `playback` object — that
  object is Zone-level state copied onto each slot, and mixing per-item values into it makes the
  two indistinguishable to the player. `notes` is not emitted.
- Both payload shapes (flat `slots[]` and zoned `zones[].slots[]`) get them, because both build
  from `slot_base`.
- **Verify (the AC that bites):** call the **deployed HTTP endpoint** with a real device token and
  read the four fields out of the JSON. Not `SELECT media_job_poll(...)`. Backend deploys from
  `develop`, so this needs the change on `develop` first.

### Phase 5 — editor pane (thunder_one_prj)

- `PlaylistPropertiesPane.tsx` Item tab gains transition duration, background colour and notes;
  the existing `fit` select stops being a stub and writes to the item. Delete the header comment
  that says these "land with #37".
- Empty must be representable and must round-trip as `NULL` — an empty control means inherit.
  Show the inherited value as the placeholder so the pane reads as inherited-vs-overridden without
  a second control per field.
- `metadata.ts` needs no new key (§0). Confirm this in review rather than assuming it.
- Item types (`DraftItem`) and the save mapping carry the four values through.
- **Verify:** browser — set all four, save, reload, values persist; clear them, save, reload, the
  pane shows the inherited values as placeholders. **Ask before this verify point.**

### Phase 6 — contract doc + prod migration

- `docs/layouts/contract-v2-zones.md`: document the three new slot fields, their units and their
  vocabularies, and state that a player may ignore any of them.
- Apply Phases 1/3/4 migrations to prod via Supabase MCP `apply_migration` (the migration CLI is
  broken — memory `thunder-core-migration-cli-drift`). **R0: show the exact SQL and ask first.**
  Auto-mode blocks MCP writes; expect a denial and a re-run after approval.
- After applying, dump `prosrc` for both functions back and diff against the migration files.

## Known consequence to state when reporting

Stored `metadata.playback.transition_duration` values begin to take effect for the first time.
ADR 0060 §5 measured the reach on 2026-09-02: 7 of 86 Playlists carry the key, and 17 of 133 items
across 8 Playlists resolve to a transition other than `cut`. Seventeen items is the ceiling.

## Out of scope

- Windows / Android player behaviour — their repos, tracked through the contract doc.
- `lock_duration`, new transition vocabulary — ADR 0060 §5 rules both out.
- #42 preview simulation — deferred by ADR 0061 §6.
