# Plan — one implementation per design-system component

Status: **all planned families implemented locally; continued Button A remains a local preview with verification limits** · 2026-11-13
Scope decision: [ADR 0112](../adr/0112-shared-ui-consolidation-is-delivered-by-component-family.md).
Skeleton contract accepted separately by the owner: [ADR 0105](../adr/0105-skeleton-shares-neutral-four-pixel-primitive.md).
Canonical families now include Skeleton, Progress, Input/TextField, SearchInput, Empty/Error,
Tabs, Modal/Dialog, Badge/Tag and Button. Family decisions are recorded in ADRs 0105–0113.
The owner continued after reviewing the Button A preview; keep A locally. ADR 0110 remains
provisional for release/visual acceptance. No commit, push, sync or deployment has occurred.

Latest follow-up: [cross-workspace regression review](review-component-consolidation-regressions-2026-11-13.md); desktop1440×1000/mobile390×844, one reproduced icon-alignment regression fixed. Historical family measurements below retain their original dates.

Latest owner correction2026-11-14: [ADR0113](../adr/0113-input-restores-the-original-field-appearance.md) supersedes the32px Input default with the original~42px field appearance for ui/Input/TextField/SearchInput. Earlier measurements remain historical; preserve explicit caller sizes.

## Accepted scope

Consolidate shared UI across ThunderOne, delivered one component family at a time. Start browser
review with Media, then cover every other affected consumer before completing that family.
Media-first is a verification sequence, not an isolation boundary: a shared default changes all
its consumers immediately.

| Boundary | Included | Excluded |
|---|---|---|
| Shared implementation | Overlapping components in `src/components/ui/`, including `lovable/`; necessary imports, exports, props, checks and fixtures used by their callers | Unrelated cleanup, dependency changes or a new component framework |
| Consumers | Every current importer of the changed family: Media, People, Thunder Care, Asset Workspace, Auth and any other discovered surface | Moving Media vocabulary, navigation, layouts or status meanings into other workspaces |
| Compatibility | Preserve behavior, validation, accessibility, loading/error states and workspace-specific status mappings | New business workflows, API/schema changes, making mock pages production-ready, page redesigns |
| Delivery | One family per reviewable change; inventory and verify its complete impact before removing a duplicate | A single bulk migration, or declaring a family complete after checking Media alone |

The first implementation slice was **Skeleton**, with option A accepted in ADR 0105 and implemented
locally. Its two import paths now share the renderer in `ui/Skeleton`; all 25 direct callers
use the `ui/Skeleton` path after migrating six imports. Scope acceptance alone did not approve other defaults or APIs; subsequent family ADRs record the
owner decisions. Deferred proposals and file deletions remain outside those decisions.

## Authority and decision status

- Project `AGENTS.md` and accepted ADRs define local integration exceptions. ADR 0096 uses the
  vendored skill/theme copies rather than installing the theme package; ADR 0098 defines the
  Asset Workspace profile.
- The vendored `thunderone-ui` core rules and `tokens.json` govern common visual tokens.
  `references/components.md` describes shared patterns; `references/tailwind.md` supplies recipes.
  A recipe is not authority to override tokens. Disagreements are recorded for resolution, not
  settled by whichever implementation is easier to reuse.
- Each workspace keeps its own profile. A profile adds domain detail and cannot override core
  rules. Where no profile exists, use core rules; do not borrow Media's domain mappings.
- DS-14 governs disputed values: use `tokens.json`, mention the OD, and report **Decision needed**.
  The plan's former blanket rule that `components.md` always wins over recipes is not a skill rule.
- The family table distinguishes implemented local contracts from deferred proposals. Family ADRs
  record the accepted defaults/APIs; historical spec deltas are not blanket restyling instructions.
- Browser measurements establish current behavior and geometry, not approval of the target design.

### Deferred changes

| Item | Boundary until resolved |
|---|---|
| Typography/density (OD-03) | Resolved locally for Badge/Tag by ADR 0111: default10px (`text-2xs`), explicit caller overrides retained. Upstream full typography scale and fixed density remain outside this decision. |
| Tabs presentation | Resolved by ADR 0107: one Radix foundation with explicit underline/segmented patterns; preserve Help overrides and current sizes. Upstream underline spec and segmented metric alignment remain separate work. |
| Modal/Dialog foundation | Resolved by ADR 0108: canonical Radix ui/Dialog with ui/Modal composite retaining existing API/presentation. Portal clash was not a reproduced defect; focus, scrolling and nested behavior are the verification requirements. |
| Shared public props and default sizes | Winner paths, semantic color prop renames and changing defaults require family-level review; scope acceptance alone does not approve them. |

## Why

`src/components/ui/` holds two overlapping sets: `lovable/*` (shadcn-style) and PascalCase files.
The PO prototype repo syncs this folder and has to ban half of it through `OFF_SPEC` in
`docs/prototyping/po-env/scripts/prototype-guard.mjs`. Developers who lift prototype JSX land it
in a codebase that still has both. The target is one principal implementation per equivalent component pattern, with necessary
composites preserved. Align the PO guard with completed families; an empty `OFF_SPEC` map is not
a prerequisite while deferred patterns or intentional restrictions remain.

The original baseline inventory came from origin/dev on 2026-11-13. Implemented rows now carry
current local counts, with AST corrections and measurement provenance in each family section.
Measured values and remaining class-derived hypotheses are identified separately.

## Family contracts and deferred design gaps

| Spec item | Winner | Loser (importers) | Gaps the winner must close |
|---|---|---|---|
| Button (primary / secondary / ghost / icon / link) | **Local A preview (ADR 0110, provisional):** canonical ui/Button Slot/ref renderer; 149 direct importer files | lovable/button is a compatibility re-export; old UI secondary remapped at52 JSX | Default32px/radius12px/font14px/px12; sm/icon-sm32px with radius12; icon36, lg44 and null retained. Positional buttonClasses remains a thin adapter. Native disabled title hover preserved. Owner visual acceptance is pending; not a release decision. |
| Segmented control / tabs | **Implemented locally (ADR 0107):** canonical `ui/Tabs` compound Radix exports; 8 consumer files | `lovable/tabs` is a compatibility re-export; former `items` API callers migrated | Preserve underline/segmented presentation and Help overrides. Old three item callers use manual activation; Asset has one stable real body panel. Existing segmented 36px track / 28px trigger metrics retained; previous proposed 35/27px and surface changes are not implemented. |
| In-page input | **Implemented locally (ADR 0106):** `ui/Input` primitive + `ui/TextField` composite; Label unchanged | `lovable/input` is a compatibility re-export; old labeled ui/Input callers migrated to TextField | Owner restored the original~42px / radius12px / no-shadow appearance (ADR0113). Padding14px/10px, font14px, primary focus treatment; cn overrides retained. 16 primitive consumer files and 6 labeled-field files migrated; TextField uses the one native renderer and preserves ref/validation/ARIA. Prototype guard aligned in the owning main checkout; source sync remains separate. |
| Search | **Implemented locally:** `ui/SearchInput` (14 direct consumer files), on `ui/Input` | `core.SearchInput` retained as compatibility re-export | One implementation forwards native props/value/onChange/ref, role/name and decorative icon. Preserves default placeholder and wrapper width overrides; inherits restored~42px/12px Input defaults (ADR0113). Playback Proof remains controlled; 13 mock callers remain unbound and do not filter. Header search is out of scope. |
| Status pill / dot | **Implemented locally (ADR 0109):** ui/Badge single renderer; 103 direct importer files including StatusBadge/types | lovable/badge retains a default-preserving adapter; core.StatusBadge re-exports canonical wrapper | Current dot/pill/12px/color API and legacy tone appearances retained. No automatic pill dot, fixed height or semantic color rename. Existing generic StatusBadge map is preserved, not a new workspace mapping. Colored taxonomy in original canonical callers remains a separate audit. |
| Tag (taxonomy) | **Implemented locally:** ui/Tag neutral outline composite on ui/Badge; 5 feature importer files / 8 verified usages | Confirmed taxonomy only, from former legacy Badge callers | Default 12px / content-sized height; explicit font/padding kept. No color/status variant prop. Program Draft outline stays Badge. Initial estimate of outline 16/23 was incorrect (mixed Button variants): legacy AST inventory was 37 JSX uses, only 4 static outline, plus dynamic status-outline. OD-03 remains open. |
| Skeleton | **Accepted option A (ADR 0105), implemented locally:** `ui/Skeleton` renderer | `lovable/skeleton` retained as named re-export; no deletion | `animate-pulse rounded-xs bg-muted`, HTML div props and `cn` merging; caller overrides remain effective. All 25 direct importers use `ui/Skeleton` (six migrated). Isolated browser fixtures verified; live loading transitions not fully observed. The spec does not mandate Skeleton tint/radius. |
| Empty / error state | **Implemented locally:** `ui/EmptyState` exports EmptyState + ErrorState; 28 consumer files | core EmptyState is a description→detail adapter; ErrorState is a re-export | One presentation renderer; detail API and error description/default copy retained, actions forwarded unchanged. UI spacing/36px icon is canonical; h3 preserves core heading semantics, decorative icon hidden, errors have one alert wrapper. Existing title+detail structure retained. |
| Dialog | **Implemented locally (ADR 0108):** canonical ui/Dialog compound foundation; ui/Modal composite | lovable/dialog retained as compatibility re-export; 17 compound importer files migrated | All 19 Modal consumer files keep their props. Modal retains width names, inner geometry, opt-in close, closed-child unmount and overflow mode. Controlled opener focus capture/return and viewport scrolling added for Radix equivalence. Compound defaults retained; no blanket style redesign. |
| Progress | **Implemented locally:** `ui/ProgressBar` (22 direct importer files) | `lovable/progress` retains only the named `Progress` compatibility alias | Keeps legacy color keys, canonical clamp/stripes, optional zero value and HTML div props. Two migrated Media callers retain 4px/6px heights; their tracks become neutral. Semantic color renaming is deferred API work, not part of renderer consolidation. |

`lovable/core.tsx` ends up holding only `VisuallyHidden`, `IconButton`, `LoadingState` (none
overlap); fold them into their natural homes or leave the file — not required for this plan.

## Family delivery record

Smallest blast radius first, starting with Skeleton. Each row is a component-family slice, not a
workspace-only slice. PRs, when explicitly requested, target `dev`; normal commit/push/delete
approval rules still apply. Remove a superseded implementation only after its consumers are migrated
and verification is complete. Update the PO guard only where it exists in the owning checkout;
this worktree does not contain that untracked guard. Rows 5a and 5b are separate changes with
independent consumer inventories and completion gates, despite sharing a source file today.
Deferred items above override this roadmap.

| # | Step | Files touched | Risk | Main hazard |
|---|---|---|---|---|
| 1 | Skeleton option A: `ui/Skeleton` renderer, legacy lovable path re-exports it; six imports migrated | 8 source files | Implemented locally; verification limits below | Live loading transitions are not fully observed. No caller import rewrite or deletion. |
| 2 | Progress: two Media callers now use `ui/ProgressBar`; legacy path is a named alias | 4 source files | Implemented locally; coverage limits below | Preserved explicit 4px/6px heights. Neutral track and canonical width transition on the two migrated callers; color keys unchanged. |
| 3 | Tabs: canonical ui compound exports, explicit patterns, three items-API rewrites and five Radix import migrations | 10 source files + check | Implemented locally; coverage below | Preserve callbacks/unmounting and manual activation at old callers; one stable Asset body. Legacy export retained; no size redesign. |
| 4 | Input: `ui/Input` is the primitive, `ui/TextField` wraps label/error; 22 callers migrated | 25 source files incl. new TextField | Implemented locally; coverage/coordination limits below | Owner restored original~42px/12px defaults in ADR0113. Explicit h-8/h-9 callers keep py-1 and other overrides stay effective. External old ui/Input composite consumers must migrate. |
| 5a | SearchInput now canonical in ui; Playback Proof import migrated; core export retained | 3 source files | Implemented locally; coverage limits below | Mock callers still lack search handlers. This consolidates the control, not their filtering behavior. |
| 5b | Empty/Error share ui/EmptyState renderer; five Media imports migrated | 7 source files | Implemented locally; runtime limits below | Core consumers align to shared UI spacing/icon size. Action callbacks and single alert wrapper retained; backend error/retry flow not forced. |
| 6 | Dialog: canonical ui/Dialog; ui/Modal composes it; migrate 17 compound imports | 20 source files + check | Implemented locally; browser limits below | Preserve controlled focus return, immediate close, nested topmost dismissal, form ownership and tall-content scrolling. Legacy alias remains. |
| 7 | Badge/Tag: canonical renderer, legacy tone compatibility, 22 feature import migrations, StatusBadge canonical path and 8 verified Tag usages | 27 source files + check | Implemented locally; scope limits below | Keep dynamic status mappings/defaults/null, class/native-prop compatibility and OD-03 density boundary. Do not infer taxonomy from outline alone. |
| 8 | Button A preview: one ui/Button foundation,81 legacy import migrations,52 secondary remaps and retained class helpers | 151 existing source files in inventory + check | Implemented locally as provisional preview | App-wide default density/old UI font-weight and nowrap change require visual acceptance. Native submit/ref/disabled/Slot contracts checked; narrow People header limitation predates A. |

### Skeleton first-slice review (resolved by ADR 0105)

The owner accepted option A and the smaller re-export approach in ADR 0105. The sole renderer
now lives in ui/Skeleton; lovable/skeleton preserves its old public import path. Both use neutral
fill, explicit 4px token radius, HTML div props and `cn` merging. At that first slice this resolved only Skeleton; later decisions and implementations are recorded
in ADRs 0106–0110 and the current family table above.

The source trace includes direct consumers such as HelpStates and the local LoadingState export
in lovable/core. Help imports the primitive directly. Its `rounded-lg`/`rounded-xl` overrides
remain effective, as do the other caller radii. The implementation verification section separates
actual component-preview evidence from live-route coverage; that remaining distinction still
prevents claiming all family completion gates are met.

### Skeleton contract decision — option A accepted (2026-11-13)

Goal: one rendering implementation while keeping the existing imports usable during this first
slice. The owner selected option A; it is now implemented in the two source files. Neither
option is mandated by the design-system Skeleton spec; the alternatives below preserve the review record.

| Option | Default style | Impact and trade-off |
|---|---|---|
| **A — accepted: preserve the current shared-UI baseline** | `animate-pulse rounded-xs bg-muted` (neutral fill, token radius 4px) | Keeps the intended default style of the 19 existing `ui/Skeleton` importers. The 6 lovable importer files change from primary tint / 10px radius to neutral / 4px, except where callers override radius. Smallest default-style change by importer count; inspect every affected loading surface. |
| B — not selected: neutral fill with the existing lovable radius | `animate-pulse rounded-md bg-muted` (neutral fill, token radius 10px) | Keeps the lovable radius for 6 importers but changes the intended default radius for the 19 shared-UI importers where not overridden. Both options required reviewing class override behavior. |

The accepted recommendation A preserves the intended defaults of the larger current consumer set and avoids
introducing a new style variant or prop. This is a compatibility recommendation, not a rule that
majority usage sets the design system. `rounded` in the current shared implementation is the
4px class-based baseline at proposal time. The accepted implementation uses explicit token
`rounded-xs`; the implementation preview below subsequently measured it at 4px. Token values are 4px/10px in
`src/design-system/t1-tailwind-v4.css`; that generated file was not modified.

The accepted implementation shape (common to both reviewed options):

- Put the sole renderer in `src/components/ui/Skeleton.tsx`, preserving the original primitive's
  HTML div props and `cn` merge pattern. The owner selected `ui/...` as the canonical name.
- Migrate the six lovable imports so all 25 direct consumer files use `@/components/ui/Skeleton`.
  Keep `src/components/ui/lovable/skeleton.tsx` as a named compatibility re-export; no file deletion.
- Preserve caller sizes, custom classes and HTML props (`style`, `aria-*`, etc.). Keep semantic
  loading wrappers in their owning features; do not add duplicate status announcements to the primitive.
- `cn` makes conflicting caller classes win. The current shared implementation concatenates
  classes, so this is an intentional behavior clarification, not proof of pixel-identical output.
  Inspect existing `rounded-full`, `rounded-lg`, `rounded-xl`, arbitrary-radius and `rounded-2xl`
  consumers. No wrapper or config option is added to preserve accidental CSS precedence.

#### Consumer inventory before the canonical-name amendment

Initial source scan on 2026-11-13: **25 direct importer files**, 19 shared-UI and 6 lovable.
The inventory below preserves those original paths; after the owner's name amendment, all 25
use `@/components/ui/Skeleton`. The source scan
also found no relative Skeleton imports, extra Skeleton re-exports or external imports of
`lovable/core`'s `LoadingState`. The latter remains a local export and must keep compiling.
Current direct Skeleton JSX uses `className` and React `key`; no other direct props were found.
HTML props remain part of the existing lovable component contract even without a current caller.

| Direct importer file | Current import |
|---|---|
| `src/app/(dashboard)/(application)/media-workspace/player-releases/loading.tsx` | `@/components/ui/lovable/skeleton` |
| `src/app/(dashboard)/(shell)/profile/loading.tsx` | `@/components/ui/Skeleton` |
| `src/components/layout/NotificationBell.tsx` | `@/components/ui/Skeleton` |
| `src/components/ui/lovable/core.tsx` | `@/components/ui/lovable/skeleton` |
| `src/features/asset-workspace/components/states/states.tsx` | `@/components/ui/Skeleton` |
| `src/features/help/components/HelpStates.tsx` | `@/components/ui/lovable/skeleton` |
| `src/features/media-workspace/calendar/components/CalendarPage.tsx` | `@/components/ui/lovable/skeleton` |
| `src/features/media-workspace/channel-groups/components/ChannelGroupsSummaryTiles.tsx` | `@/components/ui/Skeleton` |
| `src/features/media-workspace/channels/components/ChannelEditorStates.tsx` | `@/components/ui/Skeleton` |
| `src/features/media-workspace/channels/components/ChannelSummaryTiles.tsx` | `@/components/ui/Skeleton` |
| `src/features/media-workspace/channels/components/ChannelsListStates.tsx` | `@/components/ui/Skeleton` |
| `src/features/media-workspace/compositions/components/CompositionEditorSkeleton.tsx` | `@/components/ui/lovable/skeleton` |
| `src/features/media-workspace/content-library/ContentFolderRail.tsx` | `@/components/ui/Skeleton` |
| `src/features/media-workspace/overview/components/LowerOverview.tsx` | `@/components/ui/Skeleton` |
| `src/features/media-workspace/overview/components/ProgramStatusCards.tsx` | `@/components/ui/Skeleton` |
| `src/features/media-workspace/overview/components/RecentAlertsCard.tsx` | `@/components/ui/Skeleton` |
| `src/features/media-workspace/overview/components/StatCardsRow.tsx` | `@/components/ui/Skeleton` |
| `src/features/media-workspace/playlists/components/PlaylistSidePanel.tsx` | `@/components/ui/Skeleton` |
| `src/features/media-workspace/publications/components/CompositionPickerModal.tsx` | `@/components/ui/Skeleton` |
| `src/features/media-workspace/publications/components/PlaylistPickerModal.tsx` | `@/components/ui/Skeleton` |
| `src/features/media-workspace/publications/components/now-next/NowNextPage.tsx` | `@/components/ui/lovable/skeleton` |
| `src/features/mission-control/components/HomeSkeletons.tsx` | `@/components/ui/Skeleton` |
| `src/features/my-work/components/MyWorkSkeleton.tsx` | `@/components/ui/Skeleton` |
| `src/features/people/shared/components/PeopleListSkeleton.tsx` | `@/components/ui/Skeleton` |
| `src/features/workspaces/components/WorkspacesSkeleton.tsx` | `@/components/ui/Skeleton` |

#### Rendered verification checklist (partially exercised; limits below)

Start with Media loading states: Overview, Channels/list/editor, Channel Groups, folder rail,
pickers, Playlist side panel, Calendar, Now & Next, composition editor and Player releases.
Then inspect Help loading wrappers/routes, People lists, Asset Workspace loading rows, profile,
Mission Control, My Work, workspaces and the shared NotificationBell. These include consumers
through feature exports, not just the 25 files above. Preserve their structure, sizes and status
announcements. Auth and Thunder Care have no direct Skeleton import in this inventory; indirect
shared-shell impact remains part of review.

Before claiming completion, request the user's browser verification mode at that checkpoint.
Do not force runtime failures or mutate application data to expose a loading state. Record any
state not observed as unverified. Use a small existing-style check to exercise the chosen
class/prop contract, plus existing project checks; inspect rendered results in the supported light
theme. No artificial dark theme, new dependency, page redesign or upstream token edit is in scope.

#### Checks performed during the proposal (before implementation)

Inspected both primitives, `cn` → `clsx`/`twMerge`, Help/Asset loading wrappers and direct consumers.
Executed the installed `tailwind-merge` against candidate A with caller classes `rounded-full`,
`rounded-lg`, `rounded-xl`, `rounded-[14px]` and `rounded-2xl`: each caller radius replaced the base
radius. This is a class-merge check only, not a React props or rendered-browser test. No component
source changed and no new browser check was run at that proposal stage; subsequent implementation
and browser results are recorded below.

### Progress first-slice review — implemented locally (2026-11-13)

Initial source inventory: 20 files imported ui/ProgressBar; 2 Media table files imported
lovable/progress (NowPlayingTable and PublicationsTable). All 22 now import ui/ProgressBar;
the old Progress export is a named compatibility alias of the same function.
No deletion, dependency or semantic color-prop rename is included. Color-key renaming is a
separate API proposal and is not needed for one renderer.

Preserve the existing canonical clamp, 0–100 ARIA range, color mapping and animated stripes.
Retain the old Progress contract of optional value (default 0) and HTML div props by making
them additive to ProgressBar. Use cn so explicit caller width/height remains effective.
NowPlayingTable already passes h-1.5 w-20 (6px / 80px); PublicationsTable passes h-1 (4px).
The former plan hazard of both shrinking from h-2 was inaccurate: preserve these caller sizes.
The two migrated tracks take the canonical neutral bg-muted rather than primary/20; the fill
uses width/clamping and the canonical duration-500 transition rather than transform/transition-all.
No indeterminate state or new business behavior is introduced.

Verification exercised both imports, optional default, clamping, colors, stripes, caller size
overrides and HTML props, followed by real Media routes and isolated real-component cases.
Existing 20 ui consumers retain their default APIs/colors; cn now makes width/height overrides
explicit. Not every existing consumer route has been browser-tested.

#### Progress verification results

- `node /tmp/thunder-progress-contract.check.mts`: failed before editing at
  `both imports must expose one progress implementation`; passed afterward for identity,
  default zero, clamp/ARIA, all four color keys, stripes on/off, caller size overrides and
  HTML props through real React SSR. Temporary check uses the actual primitive and cn.
- `pnpm exec tsc --noEmit`: exit 0. `pnpm lint`: exit 0, two unchanged img warnings in
  Avatar and CompositionLibraryPreview. Design-system copy check and `git diff --check` passed.
- Independent scrutinize review: **ship for implementation**, no source findings.
- Verified dev-server process cwd is this worktree (localhost:3187). Read-only browser on
  Now & Next measured both live bars at 80×6px, neutral track rgb(243,244,246), value about
  74.04% and fill width about 59.23px. Programs measured 4px high bars at 0% and 100%.
- Actual component + current emitted CSS preview at localhost:3188/progress.html: 15 cases,
  including 25/50/75/100%, negative/over-100 clamp, default/alias, both Media sizes, four colors
  and animated stripes. A 240px track filled 60/120/180/240px respectively; the 80px/75% case
  filled 60px. Animation CSS reported progress-stripes and a 0.5s width transition.
- Preview checked at normal viewport and 547×900; temporary viewport override reset.

Limits: no publish/retry action or production data write. No complete live-route sweep of the
20 original callers across People, Asset Intelligence, Governance, Intelligence and Mission
Control; their shared color/size/animation contracts were checked at component level. Actual
live interpolation during data changes, every error/null state and dark theme were not exercised.
Do not mark the full cross-workspace completion gate passed. No file deletion, commit or push.

### Input contract decision — accepted, implemented locally (2026-11-13)

Owner chose ui/Input as the bare input primitive and ui/TextField as the labeled/error composite,
and approved default height 32px / radius 12px for this family. Move the existing lovable input
renderer to ui/Input; keep the legacy lovable path as a named re-export. Migrate all 16 primitive
consumer files to ui/Input. Move the old labeled Input contract into ui/TextField and migrate
its 6 consumer files (four Auth forms plus Create Channel/Create Group). TextField renders the
shared Input; it is not another native input implementation. Label remains as-is.

Preserve native input props, refs, controlled value/change handlers, required/disabled/readOnly,
min/max/minLength/maxLength, file/multiple, date/time and keyboard events. Retain label htmlFor,
explicit id or name fallback, validation errors and aria-invalid/describedby wiring. Keep the
labeled field text-sm baseline; the primitive retains text-base/md:text-sm. Caller h-8/h-9,
width, padding and font overrides remain effective through cn. Canonical defaults become
`h-(--spacing-control) rounded-(--radius-control) bg-card`; no generated theme change or dependency.
The installed tailwind-merge does not group the custom aliases h-control/rounded-control, so
explicit token-variable classes preserve caller overrides without global cn configuration.

Use one existing-style real-module check for alias identity, ref forwarding, native props,
caller class overrides and actual React SSR label/error association. Browser: safe editing of
search/date fields and an unsaved Create Channel field, plus isolated native types and field
states. Never submit Auth, upload files, save a Channel or modify backend data to test this change.
PO guard in the main checkout still bans ui/Input based on the old composite contract; document
that coordination requirement rather than editing that unrelated untracked checkout silently.

#### Input verification results

- Owner authorized ui/Input primitive + ui/TextField label/error and 32px/12px defaults (ADR 0106).
  All 16 former primitive consumers now use ui/Input, the 6 labeled consumers use TextField,
  and TextField itself imports Input. No source consumer uses lovable/input. No Label changes.
- `node /tmp/thunder-input-contract.check.mts`: red before editing at shared-renderer identity;
  during implementation red on conflicting h-control/h-9 classes; green after the local
  token-variable-class fix. Exercises actual modules, React refs/props and SSR: alias identity,
  native types/flags/events, sizes/radius overrides, label/id/name and error/description merging.
- `pnpm exec tsc --noEmit`: exit 0. `pnpm lint`: exit 0, two unchanged img warnings.
  Design-system consistency and `git diff --check`: passed. Independent scrutinize: **ship**.
- Correct-worktree browser on localhost:3187: Media Library search measured 32px / 12px;
  a nonmatching query produced no results, and clearing it restored results. Create Channel
  empty-name Next showed the error with aria-invalid and an existing describedby error element;
  measured TextField 32px / 12px / 14px font, then typed an unsaved name, advanced and closed.
- Signed-in localhost redirects Register to Mission Control. Tested the same server via
  127.0.0.1:3187/register without the localhost session: all 4 real Auth fields measured
  32px/12px/14px with required/type/autocomplete and matching labels. Typed/cleared Name only;
  no account submission, credentials or session changes.
- Real component/CSS preview at localhost:3188/input.html: 13 cases for text/search/email/password,
  date/time/file-multiple, disabled/readonly, explicit size and labeled/error/disabled fields.
  Defaults measured 32px/12px; explicit h-9 stayed 36px. TextField remained 14px on the 547px
  viewport; bare inputs retained 16px below md. Date/time edits and native email mismatch worked;
  label click focused the matching field. File chooser button fit at 32px; no file selected/uploaded.
  Normal and 547×900 layouts inspected; temporary viewport override reset.

Limits: no Auth submission, invite/set-password flow, upload, every picker/date/time caller or
Asset demo route tested live; native types and field states were checked in isolation. Legacy
ui/Input's labeled contract is intentionally replaced, so external consumers require migration.
The main checkout's untracked PO guard still bans ui/Input using its old contract and must be
aligned before prototype adoption; it was not silently modified from this worktree. No deletion,
upstream token edit, dependency, commit, push, dark-theme or production write. Full family
cross-workspace completion remains subject to those live-route and coordination limits.

### SearchInput slice — implemented locally (2026-11-13)

Initial source inventory: 13 direct ui/SearchInput consumers in Thunder Care (placeholder/className
only), plus Playback Proof's controlled SearchInput imported from lovable/core. The working core
implementation now lives in ui/SearchInput; core's named export is a compatibility re-export.
PlaybackProofToolbar now imports the canonical path, for 14 direct consumer files total. Other
core exports and Empty/Error behavior are unchanged.

Preserve the old ui default placeholder, wrapper className behavior and the working core input
contract: HTML input props, value/onChange, ref, type=search, role=searchbox, accessible name
and decorative icon. Use the canonical ui/Input for 32px/12px defaults. Preserve explicit wrapper
widths such as Playback Proof's w-64; keep full width for existing ui consumers where unspecified.
No new state/effect, search service, API, mock-list filtering or additional style prop.

Verify actual prop/ref forwarding, default/explicit accessible names, input reuse and legacy
export identity; then browser-check Playback Proof controlled input/URL behavior and the existing
mock boundary in Thunder Care. Explicitly report that the 13 unbound pages still do not filter;
this slice fixes the shared input contract, not their business behavior. Keep Search separate
from the next Empty/Error family.

#### SearchInput verification results

- `node /tmp/thunder-search-input-contract.check.mts`: red before edit at shared implementation
  identity; green after. Uses actual modules/React SSR to check the alias, canonical ui/Input,
  ref/value/onChange/native props, default/explicit names, decorative icon and wrapper widths.
  Adjusted the test's aria-hidden assertion to accept the existing string true representation;
  no icon behavior change was required.
- `pnpm exec tsc --noEmit`: exit 0. `pnpm lint`: exit 0, the same two existing img warnings.
  Design-system consistency and `git diff --check` passed. Independent scrutinize: **ship**.
- Correct-worktree browser (process cwd verified, localhost:3187): Playback Proof SearchInput
  measured 256×32px / radius 12px with role searchbox and its placeholder-based accessible name.
  A nonmatching query propagated through the existing debounce into URL q and an empty result.
  Escape cleared the native search value; the URL query disappeared and the table returned.
- Thunder Care customer cases: searchbox measured 320×32px / radius 12px with an accessible
  name. A nonmatching input left table text identical and all 8 mock data rows (9 incl. header)
  present, confirming the explicit non-filtering boundary. Cleared the value afterward.

Limits: only representative Playback Proof and customer-cases flows were checked, not all 13
mock pages. Native clear behavior observed via Escape; pointer-clicking the clear affordance
was not tested. A requested narrow viewport did not change the measured Playback Proof tab
(innerWidth remained 1280); narrow layout is unverified, and temporary overrides were reset.
No Export CSV, create/update action, new mock search behavior, file deletion, commit or push.
The PO table already uses ui/SearchInput and needs no path change for this slice.

### Empty/Error slice — implemented locally (2026-11-13)

Initial source inventory: 23 consumer files used ui/EmptyState; 5 Media files imported EmptyState/ErrorState
from core. All 28 now use ui/EmptyState exports. Core's ErrorState is a re-export and its EmptyState
is a thin description-to-detail adapter for compatibility; no duplicated DOM renderer remains.
Keep canonical EmptyState's detail contract and ErrorState's existing description/default copy.
No feature-specific ErrorState, raw-error handling, retry workflow or EmptyState API redesign.

Use the current shared UI layout: normal min-h-40/py-6, compact min-h-28/py-4, 36px icon and
centered action. The old core normal min-h-52/py-8, 40px icon and max-w-sm presentation becomes
this shared layout for its 5 Media consumers. Preserve core's heading semantics with h3 in the
shared renderer (same typography/margins as the old UI title p), hide decorative icon from AT,
and keep ErrorState's single alert wrapper. Use cn for caller overrides; pass action React nodes
through unchanged so retry/clear/create links retain their behavior. No new alert on plain empties.

Verify default/custom copy, compact/class overrides, heading/icon/alert semantics, action node
and callback preservation, compatibility mapping and ErrorState alias. Browser-check a real
filtered Programs empty state and clear-filter recovery, an existing shared compact empty card,
and isolated default/custom errors with actions. Do not force backend failures or mutate data
just to expose errors; distinguish isolated rendering from real retry/network verification.

#### Empty/Error verification results

- `node /tmp/thunder-empty-state-contract.check.mts`: red before edit because canonical
  ErrorState was absent/not identical to the core export; green afterward. Tests actual React
  modules/SSR, default/custom copy and escaping, legacy description mapping, compact/class
  overrides, action node and callback forwarding (not called during render), h3/decorative icon
  and exactly one alert for errors, none for empty states.
- `pnpm exec tsc --noEmit`: exit 0. `pnpm lint`: exit 0 with the same two existing img warnings.
  Design-system consistency and `git diff --check` passed. Independent scrutinize: **ship**.
- Verified-worktree browser at localhost:3187: Programs search produced the real filtered empty
  state (h3, 36px decorative icon, no alert, 176px including its action). Clicking the existing
  clear-filter button restored the table and cleared search. No create/update/publish action.
- Overview's real compact No delivery data state measured min-height112px / actual114px, icon36px,
  h3 and no alert. Existing UI size/typography classes remain; heading semantics are now explicit.
- Actual components/current CSS preview on localhost:3188/empty.html covers 7 normal/compact,
  action, default/custom-error and legacy variants. Normal no-action state160px, compact116px;
  actions grow content naturally. Each error had one alert, plain empties none, icons hidden.
  At measured innerWidth547px, document scrollWidth547px (no horizontal overflow); viewport reset.

Limits: error rendering/action structure was verified in isolation and callbacks in the module
check; no backend failure or real retry network flow was induced. Not a browser sweep of all28
consumer routes or a screen-reader session. Domain-specific error/retry wrappers are unchanged.
No file deletion, commit, push, dark-theme simulation or application-data mutation.

### Button compatibility requirements (step 8; corrected by current AST inventory)

- Old ui secondary (52 JSX) means outline/card, not filled secondary; remapped explicitly.
- Current inventory:70 old UI importers (61 import Button,122 JSX) and81 legacy importers
  (79 import Button,193 JSX). These file sets overlap; final canonical importer union is149.
- Legacy JSX sizes:84 sm,18 icon,9 icon-sm,81 omitted,1 dynamic. Old UI122 all omit size.
  No static lg use was found, but lg/null remain compatible rather than removed.
- No old UI Button inside a lexical form or with form ownership omits type. The previous Triage
  submit warning was wrong: it has no native form and uses onClick. Existing foundation Cancel/Back
  inside ControlledActionDialog rely on type=button; preserve that default and explicit submit/reset.
-26 old UI JSX and one helper native-button use disabled title hints; native pointer events remain
  available while disabled blocks activation. Four asChild links exist, none disabled. No new
  custom disabled-link behavior is claimed.
- buttonClasses has29 actual calls in21files (23 Links and6 native buttons), not a link-only set.
  Keep a thin helper on canonical variants rather than rewrite29 JSX. Existing buttonVariants calls
  remain supported, with cn merging so caller overrides win.
- Old UI font-weight500 becomes foundation600, with shrink0/nowrap. Narrow comparisons are required;
  owner has authorized local option A preview, not permanent release acceptance.

## Per-family completion gate

1. Rebuild the current importer inventory, including relative imports, re-exports, composites,
   checks, fixtures and caller style overrides. Historical counts below are estimates, not a
   substitute for that inventory.
2. Record each affected workspace/route and the expected visual and behavioral change. Verify
   Media first where affected, then every other affected workspace; no shared-default change is
   treated as Media-only.
3. Keep existing behavior and accessibility compatible. Resolve any public-prop or design fork
   before implementation; deferred items cannot silently enter a slice.
4. Migrate every consumer in the family, or explicitly retain the old entry point as a temporary
   compatibility path. Do not claim full consolidation while that path remains necessary.
5. Ask the user for the browser verification mode at each completion checkpoint (CLAUDE.md §3).
   Verify affected loading/empty/error states and interactions in the supported light theme,
   with desktop/narrow coverage as relevant. Test dark only when a supported dark theme exists.
   A skipped/checklist-only browser pass remains unverified.
6. Run the existing typecheck, lint and design-system consistency check, plus a small existing-style
   check for non-trivial changed logic where needed. Report actual commands/results and limits.
7. Confirm no remaining imports of any implementation proposed for deletion; get the required
   approval before deleting it. Adjust relevant PO restrictions to match the completed change.

The overall consolidation is complete only when all approved families meet this gate; deferred
patterns remain explicitly pending rather than being counted as defects to fix automatically.

## Canonical-name amendment — 2026-11-13

The owner requested `ui/...` as the primary name. Moved the same renderer to ui/Skeleton,
reversed the legacy re-export and migrated the six remaining imports; all 25 direct consumer
files now use ui/Skeleton. No source imports the old alias. The temporary contract self-check
passed again, as did typecheck, design-system check and lint (two unchanged warnings).
Regenerated the isolated preview from actual components: primitive cases and all 8 wrapper
HTML bodies are byte-identical to before this naming change. Browser was not rerun for this
relocation; previous live-route coverage limits still apply. No legacy file deletion or commit.

## Initial Skeleton implementation verification — 2026-11-13

The following records the initial implementation before the canonical-name amendment above.

- Source: only `src/components/ui/Skeleton.tsx` and `src/components/ui/lovable/skeleton.tsx`
  changed. Both paths resolve to the same function. No caller imports or PO guard changes:
  the guard already directs callers to the retained `ui/Skeleton` path.
- `node /tmp/thunder-skeleton-contract.check.mts`: before the source change, failed with
  `both import paths must expose one implementation`; afterward passed function identity,
  neutral/4px class defaults, caller radius/background/size overrides, HTML props via actual
  React SSR, handler/style preservation and no duplicate status role. Node needed JSX/extension
  resolution hooks for this temporary check; it does not mock the primitive or `cn`.
- `pnpm exec tsc --noEmit`: exit 0. `pnpm lint`: exit 0, two existing `no-img-element` warnings
  in Avatar and CompositionLibraryPreview. `node src/design-system/design-system.check.mts`
  and `git diff --check`: passed.
- Independent `scrutinize` follow-up: **ship for option A implementation**, no source finding.
- Verified the actual dev process on port 3187 has this worktree as its working directory.
  Calendar loaded, People displayed its loading fallback then data, Help displayed Loading then
  content. Asset pages in this branch are placeholders, so they cannot prove the list transition.
- Isolated browser preview at `http://localhost:3188` uses actual React components/wrappers and
  the generated CSS from this worktree's verified dev server, without API calls. Both import
  paths measured neutral `rgb(243,244,246)`, radius 4px, pulse animation; caller radii measured
  12px, 16px, 14px, 20px and full rounding. Results held at 1280px and 547px viewport widths;
  temporary viewport override was reset.
- Rendered 8 real wrapper components in that preview: Media channel list/composition editor,
  People lists, My Work, Workspaces, Mission Control, Help home and Asset loading. All used the
  neutral fill and preserved their existing radius overrides and loading-wrapper attributes.

**Limits:** isolated component rendering is not every live route transition. Calendar's transient
Skeletons were not captured; People/Help loading text was observed but geometry had disappeared
by the next measurement. Other route transitions, NotificationBell and all loading/error paths
were not exhaustively exercised. No production/browser data writes, dark-theme simulation,
commit or deployment. Do not claim the full family completion gate has passed.

## Earlier browser measurements — provenance correction (2026-11-13)

**Withdrawn as evidence for this worktree.** The original server startup on port 3100 failed
with `listen EPERM`; the listener actually belonged to `thunder_one_prj-player-release`, confirmed
by the process working directory. The observations below were real browser observations of that
other checkout, whose exact revision was not established here. They are retained only as history,
not as a measured baseline or validation of this plan's target files. Source inspections in this
worktree remain separate evidence. The corrected Skeleton verification above uses port 3187.



User authorized browser measurement. Started this worktree with `pnpm dev --port 3100`
(port 3000 belongs to a separate app). Opened `http://localhost:3100/login` in the in-app
browser; the user signed in before the internal checks. No application data was submitted.
The browser used its default narrow viewport (547px wide); measurements below identify responsive
font values and call-site overrides rather than treating them as primitive defaults.
Measurements use `getBoundingClientRect()` and `getComputedStyle()` on rendered controls.

| Component / screen | Measured result | Consequence |
|---|---|---|
| `ui/Button`, Sign in | h 40px, radius 10px, font 14px, line-height 20px, horizontal padding 16px, vertical padding 10px | Confirms the height gap against the 32–35px button spec. |
| `ui/Input`, Sign in (email/password) | h 42px, radius 12px, font 14px, line-height 20px, horizontal padding 14px, vertical padding 10px | Additional measured baseline for step 4; these are the composite auth inputs, not `lovable/input`. |
| `lovable/button` default, Upload Media “Choose Files” | h 40px, radius 12px, font 14px, horizontal padding 16px | Height/padding gaps confirmed; default radius already meets the 12px target. |
| `lovable/button sm`, Media Library “Folders” | h 32px, radius 10px, font 12px, horizontal padding 12px | Height/padding meet the target; small-variant radius remains a gap. |
| `lovable/button icon`, Media Library Grid/List View | 36×36px, radius 12px | Confirms icon size; these callers explicitly pass `h-9 w-9`. |
| `lovable/input`, Media Library search | h 36px, radius 10px, font 10px | Height/radius gaps confirmed; font is a caller override. |
| `lovable/input`, Now & Next scope search | h 36px, radius 10px, font 16px | Confirms the primitive at the narrow viewport; `md:text-sm` is not active. |
| `lovable/tabs`, Now & Next → All Channels popover | list h 36px, padding 4px, radius 12px; active/inactive triggers h 28px, radius 10px, horizontal padding 12px, font 14px, line-height 20px | Confirms the 1px list/trigger height gaps against 35/27px. Trigger radius/padding already match. |
| `lovable/tabs`, Media Library → Folders sheet | list and triggers h 40px, radius 0px, font 10px | This caller overrides height/radius/style. It is not evidence of the primitive's 36/28px size; changing defaults alone will not change this surface. Hidden duplicate rail nodes measured 0px and were excluded. |
| `ui/Badge variant="pill"`, Channel Groups → group detail “Active” | h 20px, horizontal padding 8px, vertical padding 2px, font 12px, line-height 16px, pill radius, no child dot | Confirms height/padding/font/dot gaps against the 16px, 6px, 9–10px + dot spec. |
| `ui/SearchInput`, Thunder Care → customer cases | Typed `NO_MATCH_20261113`; field changed, table text remained identical with 8 data rows (9 including header) | Confirms no search propagation on this mock-backed caller. Cleared the field afterward. This does not prove every importer has the same data behavior. |
| `ui/Modal`, Create Channel step 2 → player picker | Dropdown opens; a candidate is inside `dialog`, which matches `:modal` | Confirms this is an in-dialog dropdown, not a body portal. Entered an unsaved name only to reach step 2, then closed without creating a Channel. |

Source inspection corrected two assumptions before migration: default/icon `lovable/button`
already use radius 12px (`rounded-lg`), while small variants use 10px; and Create Channel's
`overflowVisible` supports an in-dialog absolute dropdown, not a Radix portal.
The loaded theme declares `color-scheme: light`; there is no dark-token block in that theme.
Do not claim dark coverage or invent dark tokens to satisfy this check.

### Assessment of the earlier pass

The earlier measurements cannot establish target-worktree height gaps because server provenance
was wrong. Treat target class-derived sizes as hypotheses pending measurements on the verified
server. The source-based default-button radius and Modal caller corrections remain valid.
Add the LibraryShell tabs override to step 3's per-call-site review: it already uses the selected
primitive but renders an underline pattern. Replacing `ui/Tabs` imports alone does not consolidate
that visual pattern. ADR 0107 later resolves this by explicitly preserving underline on the shared foundation.

### Verification limits

- Light theme only. The current theme has no dark-token block; no dark appearance was simulated.
- One representative screen/variant was measured, not every importer or desktop breakpoint.
- The `icon` caller explicitly sets 36×36px; an untouched icon caller was not separately measured.
- Native `<dialog>` with an actual Radix portal: not reproduced; `overflowVisible` is not
  evidence of this clash. Verify a real composition before treating it as an observed defect.
- Variant counts from grep mix components in the same file; per-call-site mapping is part of each step.

## Open questions for the owner

1. Tabs pattern decision resolved locally by ADR 0107: preserve underline and segmented on one Radix foundation.
   Upstream underline specification and segmented sizing remain outside this consolidation slice.
2. Modern Badge text retains primitive `*-700` colours for contrast; legacy tone palettes are preserved.
   OD-03 and broader status/taxonomy/contrast alignment remain separate work; no upstream issue was posted.
3. PO env table already points search at `ui/SearchInput`; its shared input contract is now fixed.
   No table path change is needed. Existing mock callers still require separate filtering work;
   do not describe component consolidation as delivering business search on those pages.

## PO guard alignment — implemented locally (2026-11-13)

The template exists only in the main checkout at docs/prototyping/po-env (untracked there), not
in this task worktree. Update its guard, existing node-assert checks, AGENTS component table and
README in place; preserve unrelated main-checkout changes. Reverse the outdated Input ban so
canonical ui/Input + ui/TextField pass and lovable/input redirects to ui/Input. Keep pending
Button/Tabs/Modal/Badge restrictions, synced-file protection, token/raw-element/copy rules.
Redirect only migrated named core SearchInput/EmptyState/ErrorState imports/re-exports; keep
remaining core helpers available. Canonical UI aliases remain valid only in synced component code.

Run the updated check against the original guard first (must fail), then update the guard and
run the full check. Exercise the actual CLI in a throwaway git directory without a commit,
including canonical pass and legacy/raw/synced-file failure cases. This is template/tooling work,
not a prototype screen or sync. Document that updated Input/TextField/Error exports must be
synced from the consolidated source; the older main checkout is not that source. No sync script,
UI copy, repo creation/push, deployment or production operation is run.

### Result

- Updated all four template files in the main checkout; no product component was copied or changed.
- The updated assert check failed against the original guard on the legacy Input path, then passed
  against the revised guard. `node --check` also passed.
- Actual CLI checks passed in an isolated temporary git directory without commits: canonical paths,
  legacy Input rejection, multiline migrated core re-export rejection, remaining core helpers,
  pending Button restriction, raw/token restrictions, synced-file protection, and the sync-branch exception.
- Independent scrutinize review: ship for this template/guard scope, with no material findings.
- No generated prototype build, component sync or browser check was performed. Before adoption,
  sync the reviewed consolidated source; the older main checkout's Input contract is incompatible.
- No commit, push, deployment, deletion or production operation was performed.

## Tabs — implemented locally (2026-11-13)

Owner chose option A; ADR 0107 records the accepted pattern and rejected blanket segmented conversion.
`ui/Tabs` now exports the four Radix compound components with root variant context; `lovable/tabs`
is only a compatibility re-export. All eight direct feature consumer files use the canonical path.
PlaylistSidePanel, ChannelGroupsPage and AssetWorkspaceListPage no longer use the removed items API.
The first two use real Radix panels; Asset keeps one stable shared body panel linked to every trigger.
Empty tab arrays have no panel semantics; unknown URL tab values retain visible body with a title label.
No URL normalization, backend behavior or existing selection callbacks were changed.

### Verification

- The SSR contract check failed against the original implementations on export identity, then passed
  after consolidation. Persisted check: `node src/components/ui/Tabs.check.mts` (Node 24+).
  Covers shared export identity, both patterns, default/controlled values, inactive-content unmounting,
  disabled and ARIA attributes, and caller class overrides.
- `tsc --noEmit`, targeted ESLint (including the new check), design-system copy check and whitespace
  checks passed. An initial check typing error (TS2775, dynamic assert import) was fixed with a static import.
- Independent scrutinize review: fix-then-ship before implementation (manual activation/shared body),
  then ship after reviewing implementation and fixes for unknown/empty tab ARIA and nowrap preservation.
- Verified browser server PID 96133 at 127.0.0.1:3187 belongs to this task worktree, not port 3100.
  Channel Groups: Right changes focus only; Enter switches table; Home + Space returns.
  Help: Guides switches content with existing overrides. Library rail: Tags switches content, 40px
  trigger / 10px text / zero radius / 2px active underline. Channel scope: Groups switches content;
  picker cancelled without Apply.
- Interactive fixture at localhost:3188/tabs.html bundles actual worktree components with synthetic
  data and a local next/navigation adapter, no backend calls. Asset: Right leaves URL unchanged,
  Enter sets tab=assigned; filter input retains edited value, one table and one panel remain with valid
  trigger/label links. Unknown URL tab uses a valid title fallback. Disabled triggers skipped; manual
  underline panel state resets on return; segmented arrow activation remains automatic.
- Browser measured underline triggers at 38px, segmented track/trigger at 36/28px, Help triggers at 40px.
  Existing segmented trigger height is below DS-13's 32px target; this slice deliberately preserves it.
  Resolve sizing/hit-area separately rather than claiming full design-system compliance.
- PO template guard/table/README aligned in the main checkout; assert/syntax checks and actual CLI
  canonical pass, legacy rejection and pending Button rejection passed. No component sync performed.

### Limits

PlaylistSidePanel and AssetWorkspaceListPage have no source importers in this checkout, so there is
no live page claim for them. Asset browser coverage uses the actual scaffold in a fixture with a
navigation adapter, not a real Next server transition. Playlist-specific fetched content/reset and
all ChangeTargetModal/CompositionContentBrowser states were not exercised in browser. Light desktop
coverage only; no mobile or full-route regression suite, production writes, deletion, commit, push,
deployment, generated prototype build or component sync. Legacy re-export is retained.

## Modal/Dialog — implemented locally (2026-11-13)

Owner selected option A in ADR 0108. `ui/Dialog` holds the existing compound Radix renderer;
`ui/Modal` composes it while retaining all public props and existing inner layout/size names.
All 17 compound consumer files now use ui/Dialog; lovable/dialog is a compatibility re-export.
All 19 Modal consumer files retain their original calls. Compound close/animation/shadow defaults
remain; Modal uses its original opt-in close button, backdrop and no-animation behavior.
No claim is made that a native top-layer/portal clash was reproduced.

### Verification

- `node src/components/ui/Modal.check.mts` (Node 24+) failed against native Modal on foundation,
  then passed. It loads actual TSX/Radix modules with a transparent portal shim for SSR structural
  checks only: export identity, sizes, form ownership, title/close/overflow options and closed state.
  Installed Radix registers title/description via layout effects; live ARIA is checked in browser,
  not asserted in SSR. Portal focus/scroll lifecycle cannot be proven by this check.
- `tsc --noEmit`, targeted ESLint for shared code/check and all 17 migrated consumers, design-system
  copy check and diff whitespace checks passed. No dependencies or generated theme were changed.
- Scrutinize found exit `animate-out` beat the plain closed animate-none override in generated CSS.
  Important closed-state suppression on both Modal Content/Overlay fixes it; generated CSS and
  browser confirm no closed overlay linger. Independent final verdict: ship; checks rerun by reviewer.
- Verified server PID 96133/cwd at localhost:3187. Live Channel Groups: Create Group -> Add More
  Channels -> Escape closes only child and returns focus to Add More Channels. Parent Cancel closes
  all and returns focus to Create Group, with zero closed overlays. No Save/Create action invoked.
- Live Create Channel: step 1 local name -> step 2 -> open/close Player dropdown; overflow visible,
  dropdown remains accessible. Close cancels wizard and returns focus to Create Channel. No channel created.
- Interactive localhost:3188/modal.html fixture bundles actual modules with synthetic local state,
  no backend calls. Native baseline form width448/height231 matched after migration. Modal open computed
  animation none and no visible shadow; compound keeps max-w-lg/default close and its existing shadow.
  ARIA title/description links resolve, hidden title remains accessible, opt-in close works.
- Fixture: native required validation blocks empty footer submit; valid input triggers exactly the
  prevented local form handler through form ID. Portalled Select opens and its option is selectable.
  Nested Escape/outside closes child only, focus returns; Tab/Shift+Tab wrap inside parent. Closed children
  unmount. Tall content fits viewport (16px margins) and wheel-scroll reaches footer (scrollTop886,
  footer bottom946 at viewport983). Inline dropdown extends below dialog and remains clickable.
- PO template guard/table/README aligned in owning main checkout. Assert/syntax and actual CLI checks
  pass: canonical Dialog/Modal accepted, legacy dialog redirected, raw dialog and pending Button/Badge rejected.

### Limits

Browser coverage is representative light desktop, not all 36 importer files or mobile. Profile, People,
Asset forms, all picker sizes and every compound dialog state were not exercised. Fixture submit is
prevented locally; no real save, delete, publish, password change or backend mutation was run. No
production operation, file deletion, component sync, generated prototype build, commit, push or deploy.
Native top-layer behavior is replaced; legacy callable props remain, native dialog DOM selectors do not.

## Badge/Tag — implemented locally (2026-11-13)

Owner chose A; ADR 0109 records current density/API preservation. ui/Badge now owns one native span
renderer for existing dot/pill/color props and unchanged legacy CVA tone classes. lovable/badge is a
thin adapter retaining primary default, while canonical default remains dot. Calendar Now explicitly
uses default tone. StatusBadge lives in ui/Badge; core re-exports it and PlaylistEditorHeader uses the
canonical path. Generic status map and accessible Status prefix are unchanged, with exactly one dot.

22 former legacy feature importer files migrated to the canonical path. Eight verified taxonomy uses
in five files now use ui/Tag: GuideMeta (3), PlaylistsTable (2), Media detail tags (1), Program tags (1),
Playback Proof media kind (1). Tag is neutral outline/pill, default12px/content-sized, no color or variant
prop. Explicit caller font/padding preserved. Native props including lang and event handlers forward.

### Corrected inventory and boundary

Before this slice: 86 ui/Badge importers, 23 legacy importers including core, one external core
StatusBadge caller. Some files import types from one path and Badge from the other; counts overlap.
Legacy AST JSX inventory: 37 uses (20 dynamic, 4 outline, 6 neutral, 3 success, 1 secondary, 2 info,
1 implicit default). The prior outline16/23 claim was wrong because it included Button variants.
After migration: 103 direct ui/Badge importer files, five Tag importer files, no legacy feature imports.
All 20 dynamic tone expressions were traced: declared-domain records are complete or have fallback.
Program Draft's dynamic outline remains a status; File deleted, In Trash and Has broadcast history remain
statuses. Colored taxonomy in original canonical callers is intentionally not reinterpreted here.

### Verification

- `node src/components/ui/Badge.check.mts` (Node24+) failed against original Badge on native lang/id
  forwarding, then passed. Covers defaults, no automatic pill dots, six colors, native props/events,
  adapter renderer identity, tone/null/default compatibility, Tag neutrality/overrides and StatusBadge
  alias/map/accessibility. Typecheck verifies Tag rejects color/variant props via expect-error assertions.
- Initial Tag padding check caught a missing cn merge around the moved CVA branch; fixed before green.
  tsc caught a Tag component/icon naming collision in media detail; icon is now TagIcon. Final tsc,
  ESLint for all affected shared files and consumer inventory, design-system copy and whitespace pass.
- Independent scrutinize final verdict ship after reviewing all dynamic maps, taxonomy sites, native
  props/legacy behavior and ADR/guard alignment; reviewer independently reran unit and guard checks.
- Verified server3187 PID96133/cwd belongs to this worktree. Live Playlists: neutral Mixed/Video type
  Tags and Draft/Active/Inactive status badges render with caller's existing9px. Live Programs: Draft
  remains transparent outline status, Live success and Ended neutral; caller9px retained.
- Browser fixture localhost:3188/badge.html uses 30 actual component cases and emitted worktree CSS:
  dot12px/height16, pill12px/height20 with no dot, legacy tone12px/height22, neutral Tag12px/height22;
  explicit Tag9px remains9; actual GuideMeta tags10px and locale lang=en preserved. StatusBadge has
  one decorative dot and accessible Status prefix. Legacy default primary and null base-only retained.
- PO template updated in owning main checkout. Assert/syntax and five actual CLI cases passed:
  canonical Badge/Tag/StatusBadge allowed; legacy Badge/core.StatusBadge redirected; remaining core
  helpers allowed; pending Button restriction retained. No component sync performed.

### Limits

OD-03 is unresolved; no fixed16/18px density or automatic9–10px reduction approved. Existing colored
canonical taxonomy, workspace status mapping policy and legacy-tone contrast were not redesigned;
this is not full DS-04/typography compliance. Legacy div changes to span; no external ref/div-selector
consumer was found. Browser coverage is representative light desktop/fixture, not every importer,
mobile, state transition or backend action. No production write, deletion, dependency, component sync,
prototype build, commit, push or deployment. Button is covered by the later provisional A preview below.

## Button A — local preview prepared (2026-11-13)

Owner requested "try A first" and agent browser verification. ADR0110 is provisional; default sizing
is not accepted for release yet. ui/Button now holds the existing Slot/ref foundation and normalized
buttonVariants helper. Default32px/radius12px/font14px/px12, small radius12, icon36 and lg44 retained.
buttonClasses preserves its positional secondary-to-outline contract.81 former legacy imports now
canonical;52 old secondary JSX remapped to outline. All149 direct importer files use ui/Button;
no legacy product imports remain. Legacy module re-exports Button/helpers/types. No Triage submit change.

### Verification

- Saved151 pre-Button source snapshots (including earlier uncommitted family work) under
  /tmp/thunder-button-before for accurate comparisons; no stash/reset/revert performed.
- `node src/components/ui/Button.check.mts` failed on the old default-size contract, then passed.
  Covers identity/default32/12/14, primary/default aliases, outline/filled-secondary distinction,
  helper mapping, sizes/null, overrides, native/ref/form types and Slot anchor/no nested button.
- Initial tsc hit temporarily incomplete generated .next/dev route types. After generation settled,
  tsc --noEmit passed without a source change. Full ESLint passed with only two existing img warnings
  (Avatar and CompositionLibraryPreview); design-system copy and whitespace checks passed.
- Scrutinize verified AST remaps against snapshots and all compatibility contracts. Final verdict:
  ship for local preview/source/docs/guard, not release approval. Guard/check/syntax rerun by reviewer.
- Browser comparison at localhost:3188/button.html uses actual old and new components with same CSS.
  Old UI default40px / secondary42px / radius10 -> A32px/radius12. Font14 retained; weight500->600.
  Base40->32, sm32 and icon-sm32 radius10->12; icon36 and lg44 unchanged. Explicit h11/textlg remains44/18.
- Synthetic behavior fixture: default action in form increments actions only; required validation
  blocks empty submit; explicit external submit invokes prevented local handler once; reset clears input.
  Disabled click invokes no action, Tab skips disabled, hover=true/title/pointerauto remain. Forwarded
  ref focuses real target; Slot link navigates local hash with no nested button/type attribute.
- Verified server3187 PID96133/cwd. Live Media Create Channel is32/12/14, opens wizard; Cancel remains
  white outline32px/typebutton and closes without creating a Channel. Auth Sign in is32/12/14 and
  explicit submit/form-owned; no credentials entered or sign-in submitted. Live People disabled Create
  Change remains disabled,32px, hoverable with title Not built yet and pointerauto.
- At390px viewport, People page overflows (page width679). Isolated actual header source comparison
  at278px content width: old scrollWidth300/button200.875, A292/button192.875; both overflow, A does not
  enlarge this existing header constraint. A two-action280px fixture fits. No unrelated shell/header
  layout fix made; this is not a complete mobile regression pass. Viewport override reset afterward.
- PO table/README/guard aligned with canonical paths and clearly marked local preview contract.
  Assert/syntax and actual CLI canonical helpers pass, legacy redirect/raw button/raw palette rejection
  pass. Other guard rules remain. Preview tab retained with before/after image for owner review.

### Limits and owner review

Owner still needs to accept/reject A visually. Existing narrow People header overflow remains; not
all149 importer routes, responsive breakpoints or real form submissions were exercised. Native title
hover state/AX hint verified; browser chrome tooltip bubble was not captured. No full production build,
backend save, login, destructive action, dependency, file deletion, sync, commit, push or deployment.
OD-03, existing colored taxonomy/status policy and previously recorded family verification limits
remain open; completing local renderer consolidation does not close those separate decisions.

## Local closure audit (2026-11-13)

The owner requested continuation after the Button A comparison. Continue with A locally; this does
not authorize Git publication, component sync or deployment, and ADR 0110 retains its local-preview
release gate. All planned renderer families have local implementation; remaining design and runtime
coverage limits are listed in their sections above rather than treated as extra implementation scope.

An independent AST audit resolved imports/re-exports, aliases, namespaces, dynamic imports/require
and import types across 1,308 source/test modules (before adding the final combined check). No product
reference to migrated legacy family paths or migrated core exports remained. Compatibility modules
correctly depend on canonical implementations. No additional source behavior fix was needed.

### Reproducible checks

First-five-family assertions are now retained together in `src/components/ui/shared-ui.check.mts`,
using the same real-module TSX/SSR loader and assertions from the verified temporary checks. The file
requires no /tmp input, fixture, server or secret. Node 24+ is required by registerHooks. Current checks:

- `node src/components/ui/shared-ui.check.mts` — Skeleton, Progress, Input/TextField, SearchInput, Empty/Error.
- `node src/components/ui/Tabs.check.mts`.
- `node src/components/ui/Modal.check.mts` — transparent SSR portal shim; browser lifecycle evidence separate.
- `node src/components/ui/Badge.check.mts`.
- `node src/components/ui/Button.check.mts`.

All five files passed in the closure pass. A temporary counterfactual copy with Progress expected37
changed to36 failed with actual37, expected36; the checked-in assertions were not weakened. Typecheck
and ESLint of the combined check passed. Earlier full lint, design-system and representative browser
results remain as recorded; no new UI behavior was introduced by this closure, so no browser rerun.

Project AGENTS now directs new callers to canonical family modules, while preserving other lovable
primitives. HANDOFF has a current-state entry and marks its original measurement-only request as
superseded history. Existing ADR chronology and verification limitations are retained.
