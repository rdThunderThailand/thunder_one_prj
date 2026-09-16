# Ticket 16 — Layout ↔ target geometry fit (advisory)

**Ticket:** `docs/layouts/tickets/16-layout-target-geometry-fit.md`
**Decided by:** `docs/adr/0055-geometry-fit-is-advisory.md`
**Risk:** R1 — frontend across six files. **No migration, no R0, nothing touches production.**

**Goal:** warn the operator, at steps 3 and 5, when a targeted Media Device's geometry does not fit
the Layout or has never been reported. Nothing is refused anywhere, and no server behaviour changes.

**Not in this plan:** the `media_heartbeat` `profile_required` widening. It moved to ticket 18 —
neither player build reads the heartbeat response body, so widening the flag here would deploy an R0
to production with no reader and nothing to verify against. See ADR 0055 and ticket 18. If a step
below seems to want it, the answer is no.

---

## Facts already verified — do not re-derive

Measured read-only on production (`sfiefevtxalqjizdkcsw`) and `develop` (`ftfmokgphewzyxzwjitv`),
2026-08-27. ADR 0055 carries the full argument; this is the operational subset.

1. **The wizard already has every value the check needs.** `ChannelListItem.devices[]` is
   `ChannelDevice`, which carries `orientation: "landscape" | "portrait" | null` and
   `resolution: string | null`. `media_screens_list` composes `resolution` as
   `screen_width || 'x' || screen_height` — so parsing `"1920x1080"` recovers the exact profile
   fields ADR 0055 decision 1 says to use. **No new endpoint, no RPC read change.**
2. **`usePublishDraft` already loads `channels`** and already holds `compositionId`. It is **347
   lines**, over the 300-line convention — do not add to it. Add a separate hook and call it in
   `CreatePublicationPage.tsx`, which already consumes `usePublishDraft()` (line 181) and passes
   `channels` to both `ChannelsStep` (line 452) and `ReviewPublishStep` (line 466).
3. **The Layout's `aspect_ratio` is not on the Composition types.** `CompositionListItem` and
   `CompositionDetail` carry `layout_id` / `layout_name` only. `fetchComposition(id)` →
   `layout_id`, then `fetchLayout(layout_id)` → `LayoutListItem.aspect_ratio`. Both already exist in
   `compositions/services/compositions-api.ts` and `layouts/services/layouts-api.ts`.
4. **`parseAspectRatio` already exists** at `layouts/geometry.ts:90`, returns `[w, h] | null`,
   accepts up to 5 digits a side, and returns `null` rather than defaulting to 16:9. Reuse it.
5. **Production geometry, all four profiled Devices, heartbeating that day:**

   | Device | `orientation` | `screen_width`×`screen_height` | `screen_ratio` | `screen_dimension` |
   |---|---|---|---|---|
   | Screen 01, 02 | landscape | 1920×1080 | 16:9 | 1920x1080 |
   | Screen 03 | landscape | **1920×1008** | 16:9 | **1920x1080** |
   | Screen 04 | landscape | **1920×1200** | **9:16** | **1080x1920** |

   `1008 = 1080 − 72` (taskbar): the profile call reports the **work area**. Screen 04's columns
   contradict each other — this is why orientation is derived from `screen_width`/`screen_height`
   and `screen_ratio` / `screen_dimension` are never read.
6. **Only one Layout exists** (`16:9`), and production has **0** composition Publications. The
   warning is therefore unobservable on production until one is published; `develop` has one
   composition Publication (`7b6cb708-…`, tenant `22222222-…`) used as the fixture for tickets 05,
   06 and 09.
7. **No player build reads the heartbeat response body.** `device-profile` is sent on the players'
   own lifecycle triggers (Windows: start, settings change, display change; Android: entering the
   player shell) and **never in response to a heartbeat**. Verified in both player repos, sources in
   ticket 18. This is why there is no migration here.
8. **`compositions.layout_id` is `NOT NULL REFERENCES media_core.layouts(id) ON DELETE RESTRICT`** —
   it cannot be nulled to simulate a failed layout fetch. Task 4 Step 6 forces that path on the
   client.
9. **ESLint forbids synchronous `setState` in a `useEffect` body**, and follows into async callees.
   Use a promise chain and `setState` inside `.then()`.
10. **There is no test runner.** Checks are `*.check.mts` run as `node <file>.check.mts`.
11. **`usePlaylistPreview.ts:18` is the house pattern** for "fetch a thing keyed by a draft id" —
    keyed state, stale responses discarded, failure distinguished from absence. Task 2 copies it.

---

## File structure

| File | Responsibility |
|---|---|
| `src/features/media-workspace/layouts/geometry.ts` | **Modify.** Add the fit function beside `parseAspectRatio`, which it reuses. No new file — the parser and the band belong together. |
| `src/features/media-workspace/layouts/geometry.check.mts` | **Modify.** Add the fit cases to the existing 73-line check. |
| `src/features/media-workspace/publications/hooks/useLayoutAspectRatio.ts` | **Create.** `compositionId → { aspectRatio, failed }`, keyed by id like `usePlaylistPreview`. Kept out of `usePublishDraft` because that file is already over the line limit. |
| `src/features/media-workspace/publications/components/CreatePublicationPage.tsx` | **Modify.** Read `compositionId` from the store (the hook does not return it), call the hook, pass `aspectRatio` and `fitCheckFailed` to `ChannelsStep` and `ReviewPublishStep`. |
| `src/features/media-workspace/publications/components/ChannelsStep.tsx` | **Modify.** Render the step-3 warning. |
| `src/features/media-workspace/publications/components/ReviewPublishStep.tsx` | **Modify.** Render the same warning at step 5. Touch nothing that decides `canPublish`. |
| `src/features/media-workspace/publications/channels-logic.ts` + `.check.mts` | **Modify.** The selected-Channel → Device fan-out already lives here; the warning summary joins it. |

Not touched, deliberately: `publish-eligibility.ts`, `publish-eligibility.check.mts`,
`media_publication_activate`, `media_schedule_conflicts`, `media_heartbeat`, `types/index.ts`, and
every file under `Thunder_Core/`.

---

## Task 1 — the fit function and its check

**Files:** Modify `src/features/media-workspace/layouts/geometry.ts`,
`src/features/media-workspace/layouts/geometry.check.mts`

**Produces:** `deviceFit(resolution: string | null, aspectRatio: string): DeviceFit`, where
`type DeviceFit = "fits" | "orientation-mismatch" | "aspect-mismatch" | "unknown"`.

- [ ] **Step 1: add the failing cases to `geometry.check.mts`**

```ts
import { deviceFit } from "./geometry.ts";

// Fits — the two shapes the production fleet actually reports (ADR 0055).
assert.equal(deviceFit("1920x1080", "16:9"), "fits");
assert.equal(deviceFit("1920x1008", "16:9"), "fits");   // taskbar work area, 1.071 in band
assert.equal(deviceFit("1920x1200", "16:9"), "fits");   // 16:10 panel, 1.111 in band
assert.equal(deviceFit("1080x1080", "16:9"), "fits");   // square fits anything

// Does not fit.
assert.equal(deviceFit("1080x1920", "16:9"), "orientation-mismatch");
assert.equal(deviceFit("1024x768", "16:9"), "aspect-mismatch");    // 4:3, 1.333
assert.equal(deviceFit("1920x1080", "16:3"), "aspect-mismatch");   // videowall layout, 3.000

// Unknown — never "does not fit".
assert.equal(deviceFit(null, "16:9"), "unknown");
assert.equal(deviceFit("1920x", "16:9"), "unknown");
assert.equal(deviceFit("0x1080", "16:9"), "unknown");
assert.equal(deviceFit("1920x1080", "not-a-ratio"), "unknown");
```

- [ ] **Step 2: run it and watch it fail**

Run: `node src/features/media-workspace/layouts/geometry.check.mts`
Expected: fails on the import — `deviceFit` is not exported.

- [ ] **Step 3: implement it in `geometry.ts`, below `parseAspectRatio`**

```ts
export type DeviceFit = "fits" | "orientation-mismatch" | "aspect-mismatch" | "unknown";

/** ponytail: 1.15 is measured, not theoretical — it must accept a taskbar-cropped 1920×1008
 *  (1.071) and a 16:10 panel (1.111), and reject 4:3 (1.333) and any video-wall ratio.
 *  Re-tune it against a fleet measurement, not by taste (ADR 0055 §4). */
const ASPECT_TOLERANCE = 1.15;

/** Layout ↔ target fit, advisory (ADR 0055). `resolution` is `media_screens_list`'s
 *  `screen_width || 'x' || screen_height`; orientation is derived from those two rather than read
 *  from `assets.orientation`, which contradicts them on real Devices. `screen_ratio` and
 *  `screen_dimension` are deliberately not consulted — both are deprecated and double-written. */
export function deviceFit(resolution: string | null, aspectRatio: string): DeviceFit {
  const device = parseAspectRatio((resolution ?? "").replace("x", ":"));
  const layout = parseAspectRatio(aspectRatio);
  if (!device || !layout) return "unknown";

  const [dw, dh] = device;
  const [lw, lh] = layout;
  // A square Device fits any Layout (ADR 0055 §3) — return before the band, or 1080x1080
  // against 16:9 falls through to a spread of 1.778 and reports a mismatch.
  if (dw === dh) return "fits";
  if (dw > dh !== lw > lh) return "orientation-mismatch";

  const deviceAR = dw / dh;
  const layoutAR = lw / lh;
  const spread = Math.max(deviceAR, layoutAR) / Math.min(deviceAR, layoutAR);
  return spread <= ASPECT_TOLERANCE ? "fits" : "aspect-mismatch";
}
```

- [ ] **Step 4: run the check**

Run: `node src/features/media-workspace/layouts/geometry.check.mts`
Expected: PASS, including the pre-existing cases.

- [ ] **Step 5: commit**

```bash
git add src/features/media-workspace/layouts/geometry.ts src/features/media-workspace/layouts/geometry.check.mts
git commit -m "feat(layouts): compute Layout to target geometry fit"
```

---

## Task 2 — the Layout's aspect ratio reaches the wizard

**Files:** Create `src/features/media-workspace/publications/hooks/useLayoutAspectRatio.ts`;
modify `src/features/media-workspace/publications/components/CreatePublicationPage.tsx`

**Consumes:** `fetchComposition`, `fetchLayout` (both already exist).
**Produces:** `useLayoutAspectRatio(compositionId: string | null): { aspectRatio: string | null; failed: boolean }`

Three things the naive version gets wrong, all of them already solved by `usePlaylistPreview.ts:18`
— **copy that pattern, do not invent a second one**:

1. **Stale ratio across a Composition switch.** Keying the state by id and reading
   `result?.id === compositionId ? result : null` means A's ratio is never shown while B loads.
2. **A failed fetch silently means "no Composition".** Collapsing both to `null` hides every
   warning at the moment the check is least trustworthy. Distinguish `failed`.
3. **`setState` synchronously in the effect body** on the `!compositionId` path — the exact ESLint
   rule this repo enforces. The keyed read makes it unnecessary: no Composition means nothing
   matches the key, so no state has to be cleared.

- [ ] **Step 1: write the hook**

```tsx
"use client";

import { useEffect, useState } from "react";
import { fetchComposition } from "@/features/media-workspace/compositions/services/compositions-api";
import { fetchLayout } from "@/features/media-workspace/layouts/services/layouts-api";

/** The Layout's declared aspect ratio, for the advisory geometry fit warning (ADR 0055).
 *  Composition reads carry `layout_id` but not the ratio, so it takes two hops.
 *  Keyed by composition id, exactly as usePlaylistPreview is keyed by playlist id, so a stale
 *  response for a previously-selected Composition never renders. `failed` is distinct from
 *  "no Composition": the caller must say it could not check, not quietly show nothing. */
export function useLayoutAspectRatio(compositionId: string | null): {
  aspectRatio: string | null;
  failed: boolean;
} {
  const [result, setResult] = useState<
    { id: string; aspectRatio: string } | { id: string; failed: true } | null
  >(null);

  useEffect(() => {
    if (!compositionId) return;
    let alive = true;
    fetchComposition(compositionId)
      .then((composition) => fetchLayout(composition.layout_id))
      .then((layout) => alive && setResult({ id: compositionId, aspectRatio: layout.aspect_ratio }))
      .catch(() => alive && setResult({ id: compositionId, failed: true }));
    return () => {
      alive = false;
    };
  }, [compositionId]);

  const current = result?.id === compositionId ? result : null;
  return {
    aspectRatio: current && "aspectRatio" in current ? current.aspectRatio : null,
    failed: current ? "failed" in current : false,
  };
}
```

- [ ] **Step 2: wire it in `CreatePublicationPage.tsx`**

`compositionId` is **not** returned by `usePublishDraft()` and is **not** among the page's existing
store selectors — read it from the store beside them (they start at line 40):

```tsx
const compositionId = usePublicationDraftStore((s) => s.compositionId);
const { aspectRatio: layoutAspectRatio, failed: fitCheckFailed } = useLayoutAspectRatio(compositionId);
```

then pass `aspectRatio={layoutAspectRatio}` and `fitCheckFailed={fitCheckFailed}` to both
`<ChannelsStep …>` (line 452) and `<ReviewPublishStep …>` (line 466).

- [ ] **Step 3: verify it compiles and lints**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "useLayoutAspectRatio|CreatePublicationPage"
```
Expected: no output. (Repo-wide `tsc` is not clean — gate on the changed files only.)

```bash
npx eslint src/features/media-workspace/publications/hooks/useLayoutAspectRatio.ts src/features/media-workspace/publications/components/CreatePublicationPage.tsx
```
Expected: clean. Watch for the no-synchronous-setState-in-useEffect rule.

- [ ] **Step 4: commit**

```bash
git add src/features/media-workspace/publications/hooks/useLayoutAspectRatio.ts src/features/media-workspace/publications/components/CreatePublicationPage.tsx
git commit -m "feat(media-workspace): read the Layout aspect ratio into the publish wizard"
```

---

## Task 3 — the step 3 and step 5 warnings

**Files:** Modify `ChannelsStep.tsx`, `ReviewPublishStep.tsx`

Both render the same thing from the same inputs, so build the summary once. Put it in
`publications/channels-logic.ts`, which already owns `selectedChannelDeviceIds` and is where the
selected-Channel → Device fan-out lives.

**Produces:**
`summarizeGeometryFit(channels, channelIds, aspectRatio): { unfitting: string[]; unprofiled: string[] }`
— Device **names**, deduplicated, sorted, `unfitting` covering both mismatch kinds.

- [ ] **Step 1: add the check cases to `channels-logic.check.mts`**

```ts
const channels = [
  { id: "c1", devices: [
    { id: "d1", name: "Screen 01", resolution: "1920x1080" },
    { id: "d2", name: "Screen 04", resolution: "1080x1920" },
    { id: "d3", name: "Screen 09", resolution: null },
  ] },
  { id: "c2", devices: [{ id: "d4", name: "Screen 05", resolution: "1024x768" }] },
] as unknown as ChannelListItem[];

assert.deepEqual(summarizeGeometryFit(channels, ["c1"], "16:9"),
  { unfitting: ["Screen 04"], unprofiled: ["Screen 09"] });
assert.deepEqual(summarizeGeometryFit(channels, ["c1", "c2"], "16:9"),
  { unfitting: ["Screen 04", "Screen 05"], unprofiled: ["Screen 09"] });
// No Composition selected: nothing to compare against, nothing to warn about.
assert.deepEqual(summarizeGeometryFit(channels, ["c1"], null),
  { unfitting: [], unprofiled: [] });
// Unselected Channels are not scanned.
assert.deepEqual(summarizeGeometryFit(channels, [], "16:9"),
  { unfitting: [], unprofiled: [] });
```

- [ ] **Step 2: run it and watch it fail**

Run: `node src/features/media-workspace/publications/channels-logic.check.mts`
Expected: fails — `summarizeGeometryFit` is not exported.

- [ ] **Step 3: implement it**

```ts
import { deviceFit } from "../layouts/geometry.ts";

/** Which selected Devices to warn about at steps 3 and 5 (ADR 0055 — advisory, never a block).
 *  A null aspectRatio means no Composition is selected, so there is nothing to fit against. */
export function summarizeGeometryFit(
  channels: readonly ChannelListItem[],
  channelIds: readonly string[],
  aspectRatio: string | null,
): { unfitting: string[]; unprofiled: string[] } {
  const unfitting = new Set<string>();
  const unprofiled = new Set<string>();
  if (!aspectRatio) return { unfitting: [], unprofiled: [] };

  const selected = new Set(channelIds);
  for (const channel of channels) {
    if (!selected.has(channel.id)) continue;
    for (const device of channel.devices) {
      const fit = deviceFit(device.resolution, aspectRatio);
      if (fit === "unknown") unprofiled.add(device.name);
      else if (fit !== "fits") unfitting.add(device.name);
    }
  }
  return {
    unfitting: [...unfitting].sort(),
    unprofiled: [...unprofiled].sort(),
  };
}
```

- [ ] **Step 4: run the check**

Run: `node src/features/media-workspace/publications/channels-logic.check.mts`
Expected: PASS.

- [ ] **Step 5: render it at step 3**

In `ChannelsStep.tsx`, take `aspectRatio: string | null` as a prop, call `summarizeGeometryFit` with
the store's `channelIds`, and render an amber advisory card above the Channel grid when either list
is non-empty. Two separate sentences, because the ticket requires saying which of the two it is:

- unfitting → *"These screens do not match this Layout's shape and will show it distorted or
  rotated: <names>. You can still publish."*
- unprofiled → *"These screens have not reported their size yet, so their fit is unknown:
  <names>. You can still publish."*

- `fitCheckFailed` → *"Could not check whether these screens fit the Layout."* — the check failing
  is not the same as everything fitting, and going silent there is the one case that would mislead.

Match the existing advisory card styling in `ReviewPublishStep.tsx` — do not invent a new one.

- [ ] **Step 6: render it at step 5**

Same component and copy in `ReviewPublishStep.tsx`, placed with the other advisory rows. **Do not
touch `computeEligibility`, the `checks` array, `gateChecks`, or anything that feeds the Publish
button's `disabled` state.** ADR 0055 §5 and §7.

- [ ] **Step 7: lint the changed files**

```bash
npx eslint src/features/media-workspace/publications/channels-logic.ts src/features/media-workspace/publications/components/ChannelsStep.tsx src/features/media-workspace/publications/components/ReviewPublishStep.tsx
```
Expected: clean.

- [ ] **Step 8: commit**

```bash
git add src/features/media-workspace/publications/channels-logic.ts src/features/media-workspace/publications/channels-logic.check.mts src/features/media-workspace/publications/components/ChannelsStep.tsx src/features/media-workspace/publications/components/ReviewPublishStep.tsx
git commit -m "feat(media-workspace): warn when a target screen does not fit the Layout"
```

---

## Task 4 — verify at the layer the operator uses, and write it down

**No unfitting Device exists on `develop`.** All four profiled Devices there report landscape
`1920x1080` or `1920x1008`, both of which fit the only Layout (`16:9`) — so selecting a real Channel
proves nothing. The mismatch has to be staged, the same way tickets 05, 06 and 09 staged their
fixtures.

- [ ] **Step 1: ask before browser-testing.** Per the working agreement, at every verify point:
      offer (1) I drive the browser, (2) a checklist you run, (3) skip. Options 2 and 3 count as
      unverified and force the PR to Draft.
- [ ] **Step 2: preflight — find the exact rows, by id.** Never mutate by `name`: it is not unique
      and carries no tenant guard, so a bare `WHERE name = 'ThunderOne Screen 04'` can hit Devices in
      other tenants. Resolve the id **and** confirm Channel membership first, or the warning will
      correctly not fire and the run proves nothing:

```sql
select a.id, a.tenant_id, a.name, a.screen_width, a.screen_height, ch.id as channel_id, ch.name as channel
from public.assets a
join media_core.channel_devices cd on cd.device_id = a.id
join media_core.channels ch on ch.id = cd.channel_id
where a.tenant_id = '22222222-...'   -- the fixture tenant, not a guess
order by a.name;
```

- [ ] **Step 3: write the restore statement before mutating anything**, with the values from Step 2
      filled in literally, and keep it in the session log. Then stage the mismatch by id:

```sql
-- RESTORE (write this first, with real values):
-- update public.assets set screen_width = 1920, screen_height = 1080 where id = '<uuid>';

update public.assets set screen_width = 1080, screen_height = 1920 where id = '<uuid>';   -- portrait
update public.assets set screen_width = null, screen_height = null where id = '<other-uuid>';  -- unprofiled
```
      **If any later step fails or is abandoned, run the restore immediately** — do not leave it to
      Step 7. A half-finished verification must not leave `develop` misreporting its screens.
- [ ] **Step 4: step 3 of the wizard.** Open the composition Publication fixture (`7b6cb708-…`),
      select that Channel, and confirm both sentences appear and name the right Devices.
- [ ] **Step 5: step 5 of the wizard.** Confirm the same warning renders **and the Publish button
      stays enabled**. This is the acceptance criterion most likely to regress, since every
      neighbouring warning in that component does gate.
- [ ] **Step 6: the failed-check path.** Confirm the "could not check" advisory renders rather than
      silence. **Do not do this by nulling `compositions.layout_id`** — the column is
      `NOT NULL REFERENCES media_core.layouts(id) ON DELETE RESTRICT`, so the update simply fails,
      and anything that did work would be tampering with a foreign key to fake a fetch error. Force
      it on the client instead: block the exact `GET /api/proxy/media/layouts/<id>` request in
      devtools, or make `fetchLayout` throw behind a one-line local edit reverted in the same step.
- [ ] **Step 7: no regression on the flat path.** A Publication with no Composition shows none of
      the three sentences at either step.
- [ ] **Step 8: restore `develop`** — run the statement written in Step 3, plus any Publication
      status the probes changed, then **re-run Step 2's `select` and confirm the values came back**.
      Do not assume the restore worked.
- [ ] **Step 9: `.docs/SESSIONLOG-ticket16-geometry-fit-<date>.md`**, stating plainly which layers
      were verified and which were not, and update ticket 16's Status line.

---

## Open questions

None. ADR 0055 settled the fit definition, the field set, the tolerance, the warn-not-block decision,
ticket 17's expanded charter, and the removal of the heartbeat migration to ticket 18. The one number
still unset — ticket 17's fleet readiness threshold — is deliberately out of scope here and belongs
at grooming, and it cannot move until ticket 18 ships.
