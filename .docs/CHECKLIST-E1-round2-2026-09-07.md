# CHECKLIST — E1 round 2 (2026-09-07)

Only the two gaps left after your round-1 run. **A, B, C, §F and E1-behaviour already passed —
do not re-run them.**

## What changed since your last run

**One file: `src/features/media-workspace/compositions/status-display.ts`** (plus its
`.check.mts`). One new branch in `describeSaveError`, placed before the generic one:

```ts
if (message.includes("a layout named")) {
  return "บันทึกไม่ได้ — มี Template ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น";
}
```

Why: `useCompositionSave` routes anything starting with `Already` to `describeActivateError`
before `classifyApiError` can see it, so `media_layout_upsert`'s
`Already exists: a layout named "…" exists` was landing on the branch worded for a Composition.
`a layout named` vs `a composition named` is the only thing separating the two RPCs.

**Nothing else changed.** Section D below tests code that is byte-for-byte the same as what you
already ran — it is a coverage gap, not a re-test: round 1's `zz-e1-a` had 0/2 Zones bound, so
the one thing that could actually corrupt data was never exercised.

---

## D. The promotion must not orphan the Zone bindings ← the only real risk left

**Why this can break.** Renaming resends the geometry through `media_layout_upsert`. That RPC
deletes every `layout_zones` row **not** present in the incoming set, and
`composition_zones.layout_zone_id` is a foreign key into exactly those rows. `promoteLayoutToTemplate`
sends every Zone **with its `id`**, so the RPC should take the UPDATE path and delete nothing.
If the ids ever failed to round-trip, the Zones would be deleted and re-inserted with new ids and
every binding would point at rows that no longer exist.

`media_layout_upsert` also refuses outright if a Zone it is about to delete is referenced —
`Invalid input: zone is used by composition(s) …`. So a failure here shows up as either that
error or as silently unbound Zones.

### Setup

```bash
CORE_API_URL=http://localhost:3001 npm run dev
```

Create a Composition **`zz-e1-b`** with **2 Zones, both bound to content** (approved assets —
search `KFC`, `sample` or `Predator`; most of page 1 is `draft` and unselectable). Save it once.

### Before promoting — record the truth

```sql
select cz.layout_zone_id, lz.name as zone_name, cz.playlist_id
from media_core.composition_zones cz
join media_core.compositions c on c.id = cz.composition_id
join media_core.layout_zones lz on lz.id = cz.layout_zone_id
where c.name = 'zz-e1-b'
order by lz.position;
```

Copy the two `layout_zone_id` values somewhere. **This is the comparison.**

### Steps

| # | Step | Expected |
|---|---|---|
| D1 | Confirm both Zones read *Bound* in Zone Overview | 2/2 bound, no unbound badge |
| D2 | `Save as Template` → name it **`zz-e1-tpl-bound`** → save | Redirects to the Templates list, row named `zz-e1-tpl-bound` |
| D3 | Re-run the SQL above | **Same two `layout_zone_id` values**, same `playlist_id` values, 2 rows — not 0, not new uuids |
| D4 | Reopen `zz-e1-b` from `/media-workspace/layouts` | Both Zones still read *Bound*, same content shown |
| D5 | Open the preview | Both Zones play the same content as before D2 |

**Fail looks like:** D3 returns 0 rows or different `layout_zone_id`s · D2 errors with
`zone is used by composition(s) …` · D4 shows Zones as *Unbound*.

---

## E. The corrected error copy

You reached this last time with an **inactive** Template's name — the client-side check only
holds the active ones (`fetchLayouts()` does not return inactive), which is exactly the gap this
message exists for.

| # | Step | Expected |
|---|---|---|
| E1 | Find an **inactive** Template's name (§SQL below) | — |
| E2 | On any saved Composition, `Save as Template`, type that name | Button stays **enabled** — the client cannot see inactive Templates, so it does not block |
| E3 | Click `Save as Template` | Fails with **`บันทึกไม่ได้ — มี Template ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น`** — the word is **Template**, not *Composition* |
| E4 | The banner's position | In the header's error slot, not hidden behind a modal (unchanged from last run) |
| E5 | SQL §F | No new `kind='template'` row appeared — rename-before-flip means a failed rename leaves nothing visible |

```sql
select id, name, kind, status from media_core.layouts
where kind = 'template' and status = 'inactive' limit 5;
```

---

## F. Confirm state afterwards

```sql
select l.id, l.name, l.kind, l.status,
       (select count(*) from media_core.compositions c where c.layout_id = l.id) as used_by
from media_core.layouts l
where l.name like 'zz-e1-%'
order by l.name;
```

Expected after D + E: `zz-e1-tpl-bound` with `kind='template'`, `used_by=1`, and no row whose
name still looks like `comp:<uuid>` from this run.

## G. Cleanup

Adds `zz-e1-b`, `zz-e1-tpl-bound` and their inline Playlists to the pending list. Running total
across all runs is now ~24 rows on develop, **nothing deleted** — one combined list goes up for
approval before any DELETE (R0).
