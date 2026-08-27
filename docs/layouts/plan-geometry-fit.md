# Ticket 16 — Layout ↔ target geometry fit (advisory)

**Ticket:** `docs/layouts/tickets/16-layout-target-geometry-fit.md`
**Decided by:** `docs/adr/0055-geometry-fit-is-advisory.md`
**Risk:** R1 (frontend across four files + one `CREATE OR REPLACE` migration). The production apply is
**R0** and needs its own approval at the end.

**Goal:** warn the operator, at steps 3 and 5, when a targeted Media Device's geometry does not fit
the Layout or has never been reported — and start prompting unprofiled Devices to report. Nothing is
refused anywhere.

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
7. **Production and `develop` now hold identical `media_heartbeat` bodies** — ticket 07 applied to
   production 2026-08-27. One migration body satisfies both.
8. **`media_heartbeat` currently computes** (verified against the live definition on both):
   ```sql
   'profile_required', (v_row.os_version IS NULL AND v_row.machine_name IS NULL)
                       OR v_row.player_capabilities IS NULL
   ```
9. **ESLint forbids synchronous `setState` in a `useEffect` body**, and follows into async callees.
   Use a promise chain and `setState` inside `.then()`.
10. **There is no test runner.** Checks are `*.check.mts` run as `node <file>.check.mts`.
11. **Supabase CLI migrations are broken** (history drift). Apply via the Supabase MCP
    `apply_migration`. Auto-mode has blocked MCP writes before — if it does, stop and ask, then retry.

---

## File structure

| File | Responsibility |
|---|---|
| `src/features/media-workspace/layouts/geometry.ts` | **Modify.** Add the fit function beside `parseAspectRatio`, which it reuses. No new file — the parser and the band belong together. |
| `src/features/media-workspace/layouts/geometry.check.mts` | **Modify.** Add the fit cases to the existing 73-line check. |
| `src/features/media-workspace/publications/hooks/useLayoutAspectRatio.ts` | **Create.** `compositionId → aspect_ratio \| null`. Two fetches, promise-chained. Kept out of `usePublishDraft` because that file is already over the line limit. |
| `src/features/media-workspace/publications/components/CreatePublicationPage.tsx` | **Modify.** Call the hook; pass `aspectRatio` to `ChannelsStep` and `ReviewPublishStep`. |
| `src/features/media-workspace/publications/components/ChannelsStep.tsx` | **Modify.** Render the step-3 warning. |
| `src/features/media-workspace/publications/components/ReviewPublishStep.tsx` | **Modify.** Render the same warning at step 5. Touch nothing that decides `canPublish`. |
| `Thunder_Core/supabase/migrations/2026____________profile_required_geometry.sql` | **Create.** `CREATE OR REPLACE media_heartbeat` only. |

Not touched, deliberately: `publish-eligibility.ts`, `publish-eligibility.check.mts`,
`media_publication_activate`, `media_schedule_conflicts`, `types/index.ts`.

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
  // A square Device has no orientation to disagree with.
  if (dw !== dh && dw > dh !== lw > lh) return "orientation-mismatch";

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
**Produces:** `useLayoutAspectRatio(compositionId: string | null): string | null`

- [ ] **Step 1: write the hook**

```tsx
"use client";

import { useEffect, useState } from "react";
import { fetchComposition } from "@/features/media-workspace/compositions/services/compositions-api";
import { fetchLayout } from "@/features/media-workspace/layouts/services/layouts-api";

/** The Layout's declared aspect ratio, for the advisory geometry fit warning (ADR 0055).
 *  Composition reads carry `layout_id` but not the ratio, so it takes two hops. Null while
 *  loading, on failure, and for a Publication with no Composition — the warning simply does
 *  not render, which is the correct advisory behaviour. */
export function useLayoutAspectRatio(compositionId: string | null): string | null {
  const [aspectRatio, setAspectRatio] = useState<string | null>(null);

  useEffect(() => {
    if (!compositionId) {
      setAspectRatio(null);
      return;
    }
    let cancelled = false;
    fetchComposition(compositionId)
      .then((composition) => fetchLayout(composition.layout_id))
      .then((layout) => {
        if (!cancelled) setAspectRatio(layout.aspect_ratio);
      })
      .catch(() => {
        if (!cancelled) setAspectRatio(null);
      });
    return () => {
      cancelled = true;
    };
  }, [compositionId]);

  return aspectRatio;
}
```

- [ ] **Step 2: wire it in `CreatePublicationPage.tsx`**

Call it beside the existing `usePublishDraft()` destructure (line 181), and pass the result down:

```tsx
const layoutAspectRatio = useLayoutAspectRatio(compositionId);
```

then `aspectRatio={layoutAspectRatio}` on both `<ChannelsStep …>` (line 452) and
`<ReviewPublishStep …>` (line 466). `compositionId` is already available from the draft store.

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

## Task 4 — `profile_required` prompts for geometry

**Files:** Create `Thunder_Core/supabase/migrations/<ts>_profile_required_geometry.sql`

The body is production's current `media_heartbeat` verbatim with the flag rewritten. Signature is
unchanged, so `CREATE OR REPLACE` is correct and no `DROP` is involved. Re-read the live definition
before writing the file rather than reconstructing it — it carries the sync telemetry
(`sync_phase_error_ms`, `sync_loop_duration_seconds`) that an older body would silently drop.

- [ ] **Step 1: capture the current body from production**

```sql
select pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'media_heartbeat';
```

- [ ] **Step 2: write the migration** — same body, this flag:

```sql
        'profile_required', (
            v_row.os_version IS NULL
            OR v_row.machine_name IS NULL
            OR v_row.screen_width IS NULL
            OR v_row.screen_height IS NULL
        ) OR v_row.player_capabilities IS NULL,
```

Two changes, both required by the ticket: geometry joins the condition, and the identity clause
becomes `OR` so a partial profile is prompted. Keep the trailing
`REVOKE ALL … FROM PUBLIC, anon, authenticated;` and `GRANT EXECUTE … TO service_role;`. Header
comment states: ticket 16, ADR 0055 §8; why `CREATE OR REPLACE` is safe here; and that the body is
copied from the live definition, not rebuilt.

- [ ] **Step 3: apply to `develop` and probe**

Apply via Supabase MCP `apply_migration` to `ftfmokgphewzyxzwjitv`, then probe against a scratch
Device — the partial-profile cases the ticket names:

```sql
-- identity present, geometry missing  → expect profile_required: true
-- identity present, capabilities set, geometry missing → true
-- geometry present, identity missing  → true
-- everything present                  → false
```
Restore whatever columns the probe nulled out afterwards.

- [ ] **Step 4: verify on `develop`**

Exactly one overload of `media_heartbeat`; ACL is `postgres` / `service_role` only; the live
definition matches the file; the `telemetry` object is unchanged key-for-key.

- [ ] **Step 5: commit the migration**

```bash
cd ../Thunder_Core
git add supabase/migrations/<ts>_profile_required_geometry.sql
git commit -m "feat(media): prompt a Device to report missing geometry"
```

- [ ] **Step 6: production apply — R0, STOP AND ASK**

Present the exact diff, the environment, and the effect (Devices with partial profiles begin being
re-prompted; no data is written or deleted) and wait for approval. Then apply verbatim to
`sfiefevtxalqjizdkcsw` and re-run the Step 4 verification there.

---

## Task 5 — verify at the layer the operator uses, and write it down

- [ ] **Step 1: ask before browser-testing.** Per the working agreement, at every verify point:
      offer (1) I drive the browser, (2) a checklist you run, (3) skip. Options 2 and 3 count as
      unverified and force the PR to Draft.
- [ ] **Step 2: step 3.** On `develop`, open the composition Publication fixture, select the Channel
      holding Screen 04 (`1080x1920` — orientation mismatch against the 16:9 Layout) and confirm the
      unfitting warning names it. Confirm an unprofiled Device produces the other sentence.
- [ ] **Step 3: step 5.** Confirm the same warning renders **and the Publish button stays enabled**.
      This is the acceptance criterion most likely to regress, since every neighbouring warning in
      that component does gate.
- [ ] **Step 4: no regression on the flat path.** A Publication with no Composition shows neither
      sentence at either step.
- [ ] **Step 5: restore `develop`** — any Publication status or Device column the probes changed.
- [ ] **Step 6: `.docs/SESSIONLOG-ticket16-geometry-fit-<date>.md`**, stating plainly which layers
      were verified and which were not, and update ticket 16's Status line.

---

## Open questions

None. ADR 0055 settled the fit definition, the field set, the tolerance, the warn-not-block
decision, and ticket 17's expanded charter. The one number still unset — ticket 17's fleet readiness
threshold — is deliberately out of scope here and belongs at grooming.
