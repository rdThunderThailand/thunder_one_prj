# Wide Layouts spanning several monitors

**Status:** accepted · 2026-08-26 · amended 2026-08-28
**Supersedes:** `0044-multi-zone-layout.md` §13
**Extends:** `0044-multi-zone-layout.md` §4

## Context

ADR 0044 §13 put video walls out of scope: *"Release one covers one display divided into Zones.
Multi-monitor spanning — the `16:3`, 5760×1080 case in the reviewed Aurora payload — is deferred to
its own ADR"*, and ADR 0044:282 told Sales that Aurora video-wall customers could not migrate yet.

A customer is now running one machine driving three monitors side by side. The deferral has expired,
and this is that ADR.

Reading the player source changes the shape of the problem considerably. Three findings, all verified
against `signage/Ads_Manager_WindowApp-main`:

**The player reports its own window, not a monitor.**

```csharp
// Services/DeviceInfoService.cs:32
var bounds = WindowRegionHelper.GetPhysicalBounds(playerHwnd);
ScreenWidth = bounds.Width;
```

The window is `WindowState="Maximized"` (`Views/PlayerView.xaml:8`), and on Windows that fills the
monitor the window happens to be on. So the customer's machine reports 1920×1080, not 5760×1080. But
because the value is read from the *window* rather than from a display query, a window that spans the
virtual desktop makes the correct number appear with no change anywhere downstream.

**Two audit entries are out of date.** `AUDIT_Player_Gaps_Priority.md` records
*"Multi-monitor / display-change handling — Missing in New"* under **A6**, on the grounds that
Aurora's `SystemEvents_DisplaySettingsChanging` was commented out and so the work is new rather than
a port. The current player already subscribes:

```csharp
// App.xaml.cs:112
SystemEvents.DisplaySettingsChanged += OnDisplaySettingsChanged;
```

with a two-second debounce and a comment naming the case (*"ตอนจอเปลี่ยน — resolution, scaling หรือ
ย้ายจอ"*). Plugging in a monitor already re-reports the profile.

**B7 does not apply.** The audit's video-wall concern — *"two screens cannot stay in step ...
disqualifying for a video wall"* (line 223) — is about several players synchronising with each other.
This customer has one machine, one player, one window. There is nothing to synchronise.

What remains is **B1**, the multi-Zone renderer the player still lacks. That is required by ADR 0044
and ADR 0049 regardless of how many monitors are attached; the monitor count adds nothing to it.

The genuine gap is narrower and elsewhere: geometry cannot be expressed precisely enough for a wide
screen.

## Decision

### 1. Zone geometry gains precision: `numeric(6,3)` everywhere it is stored or rounded

`layout_zones.x/y/width/height` are `numeric(4,1)` — one decimal place — and the editor matches with
`type="number" step={0.1}` and `roundPercent` (`ZoneProperties.tsx:36-44`).

Three equal columns need **33.333%**. One decimal place offers 33.3 (three of which total 99.9%,
leaving a strip of background down the right edge) or 33.4/33.3/33.3 (which totals 100% but puts the
seams in the wrong places). At 5760 px wide, **0.1% is 5.76 px**: enough misalignment to cut a face at
a bezel, and invisible to an operator who has no way to type a finer number.

`numeric(6,3)` puts 33.333% at 1919.98 px — 0.02 px out — and holds up well past 8K. The frontend
`step` and `roundPercent` must move with it, or the database will accept a precision the UI keeps
rounding away.

`numeric(5,2)` was rejected: 33.33% is 1919.8 px, fine for three monitors and tight for five or six.

**Precision has to change at every point on the path, or it changes nothing.** There are four, and
three of them round the value down again today:

1. **`layout_zones.x/y/width/height`** — `numeric(4,1)`, where the operator's value lands.
2. **`publication_snapshot_zones.x/y/width/height`** — **`numeric(5,2)` already**, a different type
   from `layout_zones` today. This is the table the player actually reads: activation copies geometry
   into it, and the job payload is built from it. Leaving it at two decimals caps the whole feature at
   1919.8 px — the very number rejected two paragraphs above — while the editor and its preview show
   33.333. Both tables move to `numeric(6,3)` in one migration.
3. **`media_layout_upsert`** hardcodes the rounding before the insert:

   ```sql
   ROUND((z->>'x')::numeric, 1), ROUND((z->>'y')::numeric, 1),
   ROUND((z->>'width')::numeric, 1), ROUND((z->>'height')::numeric, 1)
   ```

   The RPC is the authority — `geometry.ts` says so in its own header comment — so `33.333` becomes
   `33.3` on the way in, with no error, whatever the column type says. These become `ROUND(…, 3)`.

   **The rounding also has to move ahead of the checks.** The pairwise overlap loop reads `p_zones`
   raw and the `ROUND` happens later, at the `INSERT` — so the values validated are not the values
   stored. A payload of `33.3335` passes an overlap test that is then invalidated by the rounding that
   follows it. Round the incoming Zones once, then run the overlap and bounds checks against the
   rounded set — which is also the set ADR 0049 §9 requires the overlap check to see, after the diff
   is resolved.
4. **`toTenths` in `geometry.ts:13`**, which is not merely `roundPercent`'s helper. It is the basis of
   `rectsOverlap` (`:25-28`) and of `validateZones`, whose bounds test compares against a hardcoded
   `1000` for 100% (`:47`, `:52-55`). Left alone, 33.333 and 33.334 compare equal and the overlap rule
   decides at exactly the pixel scale this ADR exists to fix. It becomes `toThousandths`
   (`Math.round(value * 1000)`) and the bound becomes `100000`.

Two things must move in the same change or they break loudly, which is the good case:
`geometry.check.mts:44-45` asserts `roundPercent(33.34) === 33.3`, and
`contract-v2-zones.md:75` states *"percent of display area, 0–100, one decimal place"* — a promise to
whoever writes the player renderer.

### 2. `layouts.reference_resolution` records the pixels the Layout was drawn for

A new nullable column constrained to one spelling:

```sql
reference_resolution varchar NULL
  CHECK (reference_resolution ~ '^[0-9]{3,5}x[0-9]{3,5}$')
```

`aspect_ratio` is derived from it when present. The CHECK is there from the start because the
alternative is `5760 x 1080`, `5760*1080` and `5760X1080` accumulating in the column and a
normaliser written later to cope with all three.

Rendering does not change: Zones stay percentages and the player still scales to whatever window it
has, so one Layout still serves a 1920×1080 and a 3840×2160 screen of the same shape. The resolution
is an **authoring reference**, not a constraint — which is why it is nullable and why existing
Layouts are unaffected.

Every new Layout gets a resolution, but **not through a gate in front of the canvas**. A `template` is
already created through a form that asks for a name, so the resolution field goes there with
`1920x1080` preselected, common presets and Custom. An `inline` Layout is created by drawing, and ADR
0052 §4 exists precisely so that nothing has to be answered before the canvas opens: it starts at
`1920x1080` and the resolution is changed in the inspector like any other Layout property. A modal in
front of the inline canvas was rejected — it reintroduces the step ADR 0052 removed, and buys nothing,
because changing the resolution later preserves every percentage and a same-ratio change is not even
worth a confirmation.

Each dimension is an integer from 100 through 99999 — the same range the CHECK already encodes.
Orientation is not stored; it is `width > height`. `aspect_ratio` is derived and **reduced by their
GCD**, so `1920x1080` stores `16:9` and sits beside the Layouts drawn before this ADR instead of
reading `1920:1080` next to them. Two resolutions count as the same ratio when `w/h` compares equal as
a number, never by comparing the stored strings — `3840x2160` and `1920x1080` both reduce to `16:9`,
but `3000x2000` and `1500x1000` would not survive a string test if a later change stopped reducing.
The database column remains nullable solely for backward compatibility: an existing null-valued Layout
keeps its declared `aspect_ratio`, remains editable and savable, and shows no reference-pixel ruler
until an operator supplies a resolution. No backfill is required.

The canvas is a logical artboard sized by CSS from the ratio, never a pixel-sized DOM element — which
is already how `LayoutCanvas` works. What changes is that it must fit **both** axes of the available
workspace: today it is bounded by width alone, so a `1080x1920` Layout renders taller than the window
and has to be scrolled. Zone geometry stays in percentages while rulers, guides and the inspector
translate it into reference pixels. Changing only scale at the same ratio preserves geometry without
interruption. An aspect-ratio change also preserves percentages, but when Zones exist the editor asks
once for confirmation and, for a shared Template, names how many referencing Compositions will follow
the change — the count `media_layout_get` already returns as `usage_count`.

It earns its place because of §1. Now that the operator must type `33.333`, something has to tell
them where that number comes from. With the pixel width known, the editor can show a Zone's real size
("1920 × 1080 — exactly one monitor") instead of a bare percentage.

Rejected: leaving `aspect_ratio` as the only field. It makes the operator compute `16:3` from
`5760×1080` by hand and gives them no way to check their own arithmetic.

### 3. Monitor seam guides, not snapping

When `reference_resolution` is set, the editor draws guide lines where the monitor edges fall, as a
visual reference the operator can align to.

A guide sits at **cumulative monitor width ÷ total width**, computed from `reference_resolution` — for
three 1920-wide monitors in 5760, at `1920/5760` and `3840/5760`, which is 33.333…% and 66.666…%, not
33.3% and 66.7%. The distinction is the whole subject of §1: a guide drawn at 33.3% is 5.76 px away
from the seam it claims to mark, which is the error this ADR exists to remove.

This is deliberately not snap-to-monitor. Snapping needs to know the display *is* three monitors, and
`5760×1080` alone does not say whether that is 3 × 1920 or 2 × 2880; making it say so means storing a
monitor grid, which is a larger decision than this customer needs. Guides cost almost nothing and
address the failure that matters, because **no preview of any kind shows the black gap between
monitors** — the browser draws one continuous surface. A guide is the only thing that makes the bezel
visible while the Layout is being drawn.

**An "even split into N columns" action carries more of the weight than the guides do.** Precision
alone never tiles cleanly: 33.333 × 3 is 99.999, so someone must be given 33.334, and no amount of
decimal places removes that — it just moves the leftover. A button that divides the frame and hands
out the remainder deliberately gets the operator to a correct Layout; a guide only shows where correct
would have been. Both ship: the action makes the common case right in one click, the guides make the
bezel visible for everything else.

Deferred: an explicit monitor grid, and snapping to it. Revisit if operators keep landing near but
not on a seam.

### 4. `parseAspectRatio` accepts more than two digits

```ts
// geometry.ts:88
const match = /^(\d{1,2}):(\d{1,2})$/.exec(value.trim());
if (!match) return [16, 9];
```

`5760:1080` fails the pattern and **silently becomes 16:9** — no error, no warning, a canvas of
entirely the wrong shape. `256:135` fails the same way. The pattern widens and an unparseable value
becomes a validation error rather than a silent substitution.

This is a defect independent of everything else here and is fixed regardless.

### 5. The player spans all displays only when configured to

`AppConfig` gains `SpanAllDisplays: bool = false`. When true, the player window is positioned across
the virtual desktop instead of maximized:

```csharp
WindowState = Normal;
Left   = SystemParameters.VirtualScreenLeft;
Top    = SystemParameters.VirtualScreenTop;
Width  = SystemParameters.VirtualScreenWidth;
Height = SystemParameters.VirtualScreenHeight;
```

`GetPhysicalBounds` then reports the spanned size with no further change, and the device profile
endpoint already accepts it: `screen_width: z.number().int().positive()` has no upper bound
(`device-profile/route.ts:22`).

Spanning unconditionally was rejected. Production holds 504 devices that have never reported a screen
size and four that have; every one of them is a single-monitor install today. A technician attaching
a maintenance monitor to any of them would stretch the running signage across both. A default-off flag
set during provisioning changes the behaviour of exactly the machines that want it.

## Consequences

- `layout_zones` **and `publication_snapshot_zones`** geometry columns are altered to `numeric(6,3)`.
  Production holds 2 and 99 rows respectively, so no meaningful data risk, but both are R0 applies.
  ADR 0049 is already rewriting `publication_snapshot_zones` to drop `role`; these belong in the same
  migration.
- `media_layout_upsert`'s four `ROUND(…, 1)` calls become `ROUND(…, 3)`, in the same change that turns
  it into a diff (ADR 0049 §9).
- `geometry.ts`: `toTenths` becomes `toThousandths` and the `1000` bound in `validateZones` becomes
  `100000`; `geometry.check.mts:44-45` and `contract-v2-zones.md:75` are updated with it.
- `layouts` gains `reference_resolution varchar NULL`. Existing rows stay `NULL` and behave exactly as
  before.
- `media_layout_upsert` accepts and returns the new column, and — per ADR 0049 §9 — is becoming a
  diff in the same migration set.
- Frontend: `roundPercent` and the `step` on Zone inputs move to three decimals; the aspect-ratio
  parser widens and starts reporting invalid input; the Template create form gains a preset/custom
  resolution field and an inline Layout starts at `1920x1080`; the canvas gains a height bound so a
  portrait Layout fits without scrolling; the editor gains reference-pixel rulers, seam guides, an
  `%`/pixel inspector and an even-split action. Ticket 11 carried this list first and Ticket 19
  supersedes it — nothing on it is dropped.
- Setting `reference_resolution` is another write into a Layout that live Compositions may be bound
  to. It changes no Zone, so ADR 0049 §10 already covers it: a Composition cannot be made incomplete
  by it, and the `layouts.updated_at` bump surfaces it as drift.
- Player: one config field and one window-positioning change. No renderer work is added by this ADR —
  **B1, the multi-Zone renderer, remains the blocker**, and it is already required by ADR 0044.
- `AUDIT_Player_Gaps_Priority.md` needs correcting: the A6 row claiming display-change handling is
  missing is wrong (`App.xaml.cs:112`), and the video-wall caveat in ADR 0044:282 does not apply to a
  single-player span.
- Sales can be told that a one-machine, several-monitor install is supported once B1 lands. A true
  video wall — several machines driving one image in step — is still B7 and still out of scope.
