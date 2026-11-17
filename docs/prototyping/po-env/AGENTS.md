# ThunderOne prototypes

This repo holds clickable UX/UI prototypes for ThunderOne. A product owner (PO) describes a feature
in chat and you build or change it here. Developers later rebuild the feature in the product repo
(`thunder_one_prj`), so a prototype is an executable spec. It is never merged into the product.

ThunderOne workspace: media

Talk to the PO in **Thai**. Code, identifiers, file names and commit messages stay in English.
The PO is not a developer: explain what changed on screen, not in code terms.

## What a prototype is (and is not)

- Next.js App Router pages under `src/app/<feature>/`, one folder per feature.
- Data comes from `src/mocks/`, held in React state. No backend, no login, no `fetch`, no env vars.
- It covers the normal, empty, loading and error states, plus a confirm step before any destructive
  action.
- It does not need the product's Server Actions, permissions, i18n or real data. Do not add them.

## Before the first screen of a feature: read, then plan

Read these first, every time you start a new feature:

1. `.agents/skills/thunderone-ui/SKILL.md`: the design system's core rules (DS-01 … DS-14).
2. `.agents/skills/thunderone-ui/references/workspaces/media.md`: Media vocabulary, icons, status
   mapping.
3. `.agents/skills/thunderone-ui/references/patterns.md` and `components.md`: page patterns and the
   component list.
4. `src/config/nav/media-workspace.tsx`: the real nav items and names. These win where the profile
   disagrees.
5. `CONTEXT.md`: the product glossary. Use its terms (Program, Playlist, Asset, Composition, Layout
   …) exactly. Never invent a new name for an existing concept.
6. `src/types/domain.ts`: real field names for mock data.

Then reply with a plan and **wait for the PO to approve it** before writing code.

If you run headless (a cloud agent, an assigned issue, any run that cannot pause for an answer):
post the plan as your final message and stop without changing any file. Implement it only after a
follow-up message approves it ("ok", "ได้", "ลุย"). If the brief says the plan is already approved
("ไม่ต้องรอแผน"), skip the wait, but still put the plan at the top of your report.


```
หน้า: <name> · pattern: <list / detail / form / wizard / …>
component ที่ใช้: <Button, Sheet, Tabs …> (มีอยู่แล้วทั้งหมด / ขาด: <name + why>)
ไฟล์ที่จะสร้าง/แก้: <paths>
state ที่ครอบคลุม: ปกติ · ว่าง · loading · error · ยืนยันก่อนลบ
คำถาม: <only what blocks the plan>
```

## Editing: change what exists, never grow a copy

Every change request from the PO follows these rules:

1. **Find it first.** Name the file and component you will change. If you cannot tell which part
   of the screen the PO means, ask. Never guess and build a new one.
2. **Edit in place.** Never create `PageV2`, `NewCard`, `*-copy`, `*-old` or a parallel version of
   a screen.
3. **Reuse primitives.** Use the component the table in "Components follow the Thunder design
   system" names for each spec item, and icons from `src/components/ui/icons.tsx`. Never hand-roll a button, dialog, dropdown, select or tabs. Never
   use raw `<button>`, `<select>`, `<input>`, `<textarea>` or `<dialog>` in feature code.
4. **Smallest diff that works.** Change only what was asked. No extra features, no refactors of
   untouched parts, no new abstractions, no new dependencies.
5. **Keep what the PO approved.** If a change would alter a part the PO did not mention, say so
   and ask first.
6. **Report after every change**, in Thai: which file you changed, what changed on screen, and
   whether you created a file (and why).

When something the PO wants needs a component that does not exist, do not invent one in a new
style. Build the closest thing from existing primitives and list the missing component in the
handoff.

## Design system (same rules as the product)

UI work follows the `thunderone-ui` skill and its `media` profile. Where the skill and this file
disagree, this file wins.

- Tokens come from `src/design-system/t1-tailwind-v4.css`, imported by `src/app/globals.css`.
  Do not install `@rdthunderthailand/thunderone-theme`, even though the skill says to.
- No raw palette classes (`zinc-*`, `indigo-*`, `bg-white` …), hex literals or `dark:` variants.
  Prefer the design system names (`error`, `success-muted`, `accent`) over the temporary aliases
  (`danger`, `*-soft`, `primary-soft`). In CSS use `var(--color-x)`, never `var(--x)`.
- Icons: import from `src/components/ui/icons.tsx` only. Never import `@ant-design/icons` or SVG
  paths in feature code. If an icon is missing, list it in the handoff.
- Nav and terms follow `src/config/nav/media-workspace.tsx` where the profile disagrees.
- Status colours come only from status tokens through the profile's mapping. Never use status
  colours for categories or tags.

### Components follow the Thunder design system

The design system ([rdThunderThailand/-thunder-design-system](https://github.com/rdThunderThailand/-thunder-design-system))
defines components as a spec, not as code:
`.agents/skills/thunderone-ui/references/components.md`. The synced code has two sets that
overlap: `src/components/ui/lovable/*` and the PascalCase files in `src/components/ui/`. Use the
canonical paths below for consolidated families; other rows keep the existing prototype policy.
Legacy compatibility exports are for older callers, not new feature imports. The guard rejects
the paths marked "never" and migrated named exports from `lovable/core`.

| Spec item | Use | Never |
|---|---|---|
| Primary button (local A preview: h32/radius12/text14) | `ui/Button` `<Button>` / `variant="primary"` | `lovable/button` (compatibility re-export) |
| Secondary / Ghost button (h32) | `ui/Button` `variant="outline"` / `variant="ghost"` | using filled `secondary` when a border/card button is intended |
| Icon button (36×36, icon16, aria-label) | `ui/Button` `<Button size="icon" aria-label="…">` | unlabeled icon button |
| Link button ("View all …" + 12px arrow) | `ui/Button` `<Button size="sm" variant="link">` | custom raw button styling |
| Link styled as a button | `ui/Button` `<Button asChild><Link …/></Button>`; retain existing `buttonClasses`/`buttonVariants` helpers | nested anchor/button |
| Segmented control / filter tabs (track, active segment with surface + shadow) | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `ui/Tabs` (default `variant="segmented"`) | `lovable/tabs` (compatibility alias) |
| Existing underline tabs | `ui/Tabs` with `variant="underline"`; preserve the existing pattern | new custom tab buttons or the removed `items` API |
| In-page input (~42px, radius12px, no shadow by default) | `ui/Input` | `lovable/input` (compatibility alias) |
| Input with label / validation error | `ui/TextField` (`label`, `error`, `name` or `id`) | `label` / `error` props on bare `ui/Input` |
| Search (restored~42px input, decorative icon) | `ui/SearchInput` (`value` / `onChange` for real filtering) | `core.SearchInput`, or an input you build yourself |
| Status pill / dot | `ui/Badge` `variant="pill"` / `"dot"`, colour through the profile's status mapping; existing tone variants retained for compatibility | `lovable/badge` (compatibility adapter), guessing new status mappings |
| Taxonomy tag (category, type, language, user-defined label) | `ui/Tag`, neutral outline pill; 10px default with caller overrides | status `color` or `variant` props on Tag |
| Side panel / drawer (right side, title + close) | `lovable/sheet` `side="right"` | a dialog styled as a drawer |
| Dialog / confirm before destructive action | `ui/Dialog` compound components, or `ui/Modal` for the existing title/body/footer composition; keep `lovable/alert-dialog` for alert confirmations | `lovable/dialog` (compatibility alias), new native `<dialog>` |
| Loading (skeleton in the shape of the content) | `ui/Skeleton` | `lovable/skeleton` (compatibility alias) |
| Empty (icon, title/detail, one next step) | `EmptyState` from `ui/EmptyState` (`detail`, optional `action`) | `core.EmptyState`, text alone |
| Error with Retry | `ErrorState` from `ui/EmptyState` (`description`, `action={<Button onClick={retry}>…</Button>}`) | `core.ErrorState`, raw error output |
| Progress | `ui/ProgressBar` (`value`, optional `animated`) | `lovable/progress` (compatibility alias) |
| Stat card, avatar, pagination, wizard steps, charts | `ui/StatTile`, `ui/Avatar`, `ui/Pagination`, `ui/WizardSteps`, `ui/*Chart` | — |

- Button sizing is the owner-authorized local A preview (ADR0110), pending visual acceptance. Default32px/radius12px/text14px; `sm` has12px text, icon36px. `lg` stays compatible; do not introduce new lg usage for compact controls.
- Button defaults to type="button"; submit/reset must be explicit. Keep native disabled title hints. `secondary` is filled; use `outline` for a bordered button. The positional `buttonClasses("secondary")` adapter keeps its former outline meaning.
- Badge/Tag default to10px (ADR0111); retain explicit caller sizes, content-sized heights and existing dot behavior. Canonical Badge defaults to dot; the legacy tone adapter defaults to primary. Keep explicit existing tone mappings.
- Use `StatusBadge` from `ui/Badge` only when preserving its existing generic mapping; workspace-specific states still use their approved map.
- `Modal` composes `Dialog` and retains `open`/`onClose`, sizes and opt-in close button. Do not use the native dialog API. `DialogContent` retains its default close button; pass `showCloseButton={false}` for a custom close control.
- `Input` is the bare control; use `TextField` for label/error. ADR0113 restores original~42px/no-shadow defaults. Keep explicit caller sizes; h-8/h-9 compact inputs also need py-1.
- `SearchInput` forwards input props and ref. Filtering belongs to the page; an unbound input does not filter data.
- `ErrorState` preserves one alert wrapper; pass Retry as `action`. It has no built-in `onRetry` prop.
- `ProgressBar` retains color keys `indigo/emerald/red/amber`, mapped to semantic tokens; use the profile's status meaning.
- `lovable/core` still has other helpers; import those by their existing names. Use the canonical paths above for SearchInput/EmptyState/ErrorState/StatusBadge.
- Spec items with no component yet: **Action tile**, **List row**, **User block**. Build them from the primitives above, following
  the spec, and list each one under missing components in the handoff.
- Anything not in this table: check `components.md` first, then use the existing component that
  matches it. If two match, ask.

## Code conventions (match the product, so developers can lift the JSX)

- camelCase for variables and functions, PascalCase for components and types, SCREAMING_SNAKE
  for constants. Booleans start with is/has/should/can.
- New files you create are kebab-case (`playlist-card.tsx`), like `src/components/ui/lovable/`.
  The synced PascalCase files in `src/components/ui/*.tsx` (`MediaThumb.tsx`, `EmptyState.tsx` …)
  keep their names: import them as they are, never rename or copy them. Which file to use for each
  component comes from "Components follow the Thunder design system".
- Keep files at or under 300 lines. Split by screen section, not by abstraction layer.
- No `any`. No dead code or commented-out code.
- Write JSX with one element per line, matching the surrounding file.
- New code reads like the code around it: same naming, comment density and idioms.
- Every destructive action has a confirm step (`alert-dialog`).

## Mock data

- Mock files may hold hex values that are data (for example `background_color`); the guard allows
  hex in `src/mocks/` only. Never use a mock hex value as a class or inline style.
- One file per concept in `src/mocks/` (`assets.ts`, `playlists.ts` …), typed with
  `src/types/domain.ts`. Reuse an existing mock before adding one.
- Realistic Thai and English names, sizes and dates; enough rows to show scrolling and empty
  states.
- Fake async (`setTimeout`) only when the PO needs to see a loading state.

## Synced files: read only

These files are copied from the product by `scripts/sync-from-thunder-one.sh`. Never edit them.
If one is wrong or missing something, say so in your reply and in the handoff.

- `src/components/ui/**`, `src/design-system/**`, `src/lib/utils.ts`, `src/lib/media-kind.ts`,
  `src/types/domain.ts`
- `src/config/nav/**`, `src/app/globals.css`, `public/brand/**`
- `.agents/skills/**`, `.claude/skills/**`, `CONTEXT.md`

## Packages

Use **npm** (not pnpm or yarn) and commit `package-lock.json`; CI runs `npm ci`. Never add a
dependency for a feature: the primitives' dependencies are all there is.

## Checks: run before you say "done"

```bash
node scripts/prototype-guard.mjs
```

```bash
npm run build
```

The guard also checks uncommitted and untracked files, so run it before you commit. It fails on raw
palette, hex, `dark:`, raw form elements, direct `@ant-design/icons` imports, edits to synced files
and copy-style file names (`*V2*`, `*-new`, `*copy*`, `*-old` …). CI runs the
same checks on every pull request. When one fails, fix the cause; never weaken or skip the check.

This framework version is newer than you may know. Read the relevant guide in
`node_modules/next/dist/docs/` before writing code that touches routing, layouts or config.

## Handoff

Each feature is one pull request. Fill in `.github/pull_request_template.md` completely. The
"missing components" and "open questions" sections are what developers rely on most. Keep the PR
description in Thai; keep code identifiers in English.
