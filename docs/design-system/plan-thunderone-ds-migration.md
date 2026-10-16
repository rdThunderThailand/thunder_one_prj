# Plan — migrate thunder_one_prj to the ThunderOne design system

Status: **D1–D10 confirmed by the owner as recommended (incl. D5 `@ant-design/icons`)** · 2026-10-16
An unpushed local draft of OD fixes exists in the DS clone (branch `feat/close-od-01-04-05-07`,
`0cac786`); it is not part of this plan.
Supersedes the waiting stance of ADR 0095: the owner decided (2026-10-16) that the `thunderone-ui`
skill is the primary UI source from now on, replacing Lovable. Open design decisions (OD-xx) belong to
the design system team, who resolve them through rdThunderThailand/-thunder-design-system#2; this
repo does **not** change the design system repo (our account has READ only).
Tracking: thunder_one_prj#281 · upstream rdThunderThailand/-thunder-design-system#2

## Facts already established — do not re-derive

- Design system repo cloned at `~/Desktop/Thunder/project/thunder-design-system`, tag `v0.2.0` = HEAD.
  Skill vendored unmodified at `.claude/skills/thunderone-ui/` (PR #282, merged).
- DS `tailwind/v4.css` stores colours as HSL triplets in `:root` (`--primary: 219.9 94.6% 56.7%`) and
  maps them in `@theme inline` (`--color-primary: hsl(var(--primary))`). Our `globals.css` stores the
  same names as full oklch values and maps `--color-primary: var(--primary)`. Layering both breaks;
  **replacing** our overlapping block with DS's works, because both follow shadcn naming.
- `v4.css` also brings: Google Fonts `@import` for Manrope, `--font-sans: 'Manrope'…`, a base layer
  (`* { border-color }`, body bg/colour/font), scrollbar styles, `.t1-scroll-quiet`, `.t1-scroll-x`,
  `--color-t1-*` primitive ramps, radius/shadow/spacing/text tokens.
- Name differences (repo → DS): `danger` → `error`, `*-soft` → `*-muted`, `primary-soft` → none
  (closest `accent` #E9F4FF), `destructive` exists in both. Files using each repo name:
  `danger` 96, `danger-soft` 29, `success-soft` 22, `warning-soft` 36, `primary-soft` 73,
  `info-soft` 11, `surface-subtle` 2, `border-subtle` 4, `program` 3, `overlay` 6.
- Repo-only tokens with no DS equivalent: `program`, `overlay`, `surface-subtle/raised`,
  `border-subtle`, `chart-1..5`, `z-index-*`, `text-3xs/2xs/ui`, `radius-2xl..4xl`, `shadow-dialog`,
  `spacing-shell-header/summary-card`, `breakpoint-xs`, `@utility type-label / focus-ring`.
- Debt outside tokens: raw palette classes in **419** files (6 inside media-workspace), `dark:` in
  **394** files, 6-digit hex literals in **48** files. `globals.css` has a `.dark` block (contradicts
  ADR 0075 §1); nothing applies `.dark`.
- Icons: `components/ui/icons.tsx` = 74 hand-made SVG components, imported by **406** files;
  `lucide-react` = 88 distinct icons across **62** files. `@ant-design/icons` is not installed.
- `components/ui/lovable/` (17 files, shadcn/Radix primitives) is imported by 109 files and uses
  shadcn token classes, so it re-themes automatically when the tokens change.
- Shell: sidebar is `w-56` = 224px ✅; header is 68px (DS 69px); logo is `/brand/t1-mark.svg`.
  Fonts: Manrope + Geist Mono via `next/font` in `src/app/layout.tsx`.
- **Thai text appears in 453 files.** Manrope has no Thai glyphs (DS OD-05), so Thai currently
  renders in the OS fallback.
- Theme package lives on GitHub Packages: every dev machine and Vercel need a `read:packages` token.
  The skill ships identical copies in `assets/code/` for projects that cannot install it.

## Decisions — pending owner confirmation

Each has a recommendation; execution starts after the owner confirms or overrides.

| # | Decision | Options | Recommended |
|---|---|---|---|
| D1 | **OD-01** colour values | owned by the DS team | Use `tokens.json` values — that is already what DS-14 prescribes while OD-01 is open. |
| D2 | **OD-04** icon maps | owned by the DS team | Use the proposed `T1Icon` / `MediaIcon` maps (DS-14). Concepts with no entry are listed for #2, not invented locally. |
| D3 | **OD-05** Thai typeface | owned by the DS team | Keep the OS fallback until the DS ships a Thai face; then add it via `next/font`. |
| D4 | How the theme reaches the app | (a) copy `assets/code/` files into `src/design-system/` + a check that they match the vendored skill · (b) install `@rdthunderthailand/thunderone-theme` from GitHub Packages | **(a)** — no auth on Vercel/dev machines; files update in the same PR as the skill |
| D5 | New dependency `@ant-design/icons` | required by DS-09 | **yes** (needs explicit approval per CLAUDE.md §8) |
| D6 | Icon migration method | (a) re-point the 74 `icons.tsx` exports to antd icons internally (406 importers untouched), then replace the 62 lucide files · (b) rewrite every importer to `T1Icon` now | **(a)**; importers move to `T1Icon` / `MediaIcon` when next touched |
| D7 | Repo token names | (a) aliases first (`--color-danger: var(--color-error)` …), rename usages during the sweep, drop aliases at the end · (b) rename all usages in the foundation PR | **(a)** — foundation PR stays small and reviewable |
| D8 | Repo-only tokens | (a) keep in `globals.css` as project extensions, re-expressed with `--color-t1-*` primitives · (b) upstream them into `tokens.json` | **(a)**; upstream only if a second Workspace needs one |
| D9 | `media` profile mismatches (#2) | reported in #2 for the DS team; meanwhile (a) `AGENTS.md` says the repo nav wins. Upstream fix would match this product's nav (Channel groups, Playback proof; PA/Audio, Kiosks, Monitoring, Analytics "not built"; no Settings group) and note UI Layout = code `composition`, UI Template = code `layout` · (b) build what the profile lists | **(a)** — the UI term "Layouts" was already right; only the nav was wrong |
| D10 | Lovable's role | (a) retired as a visual source; `ui/lovable/` stays as component code; port-workflow doc and AGENTS.md section marked superseded · (b) keep Lovable for prototypes with the skill uploaded | **(a)**; (b) can be added later without changing this plan |

Accepted side effects of adopting `v4.css` as-is (reverses ADR 0076 §5): global `* { border-color }`
and body font/colour. The Google Fonts `@import` duplicates `next/font`; we override `--font-sans` to
keep `next/font`; the duplicate fetch is left for the DS team.

## Phases

Every phase ends with `tsc --noEmit`, `eslint`, `next build` and — where pixels change — a browser
check (owner chooses run / checklist / skip before each, CLAUDE.md §3). One PR per phase into `dev`,
Draft until verified.

### P1 — No upstream work (owner decision 2026-10-16)
The design system repo is the company's shared source: this repo never changes it and does not wait
on it. Gaps are handled locally and recorded as deviations in ADR 0096 / `AGENTS.md`; when the design
system ships a new tag, re-vendor in one PR. #2 stays open for the DS team to act on if they choose.

### P2 — Foundation in this repo (tokens, font, docs)
**Status 2026-10-16:** done on branch `style/thunderone-ds-foundation` (not committed). tsc, eslint,
`next build` (no warnings) and `design-system.check.mts` pass; browser-checked Overview, Playlists list,
Playlist editor and the Add Item drawer: every measured colour and border matches `tokens.json`.
1. ADR 0096: DS is the UI source; supersedes ADR 0095 and the visual parts of 0075/0076; records D1–D10.
2. Keep the skill at `v0.2.0`; copy theme files to `src/design-system/` (D4) with a
   `design-system.check.mts` that diffs them against `.claude/skills/thunderone-ui/assets/code/`.
3. `globals.css`: import `src/design-system/t1-tailwind-v4.css`; delete our overlapping `:root`
   colours, the `.dark` block and the overlapping `@theme` colour mappings; add aliases (D7) and
   re-express repo-only tokens (D8); set `--font-sans` to `var(--font-manrope), …` (no Thai face yet, D3).
4. `AGENTS.md`: replace the ADR 0095 section, "Media Workspace styling" and "Porting from Lovable"
   with the DS rules; mark `docs/media-workspace/plan-lovable-port-workflow.md` superseded.
5. Verify: every main route renders with the new palette; no unstyled surface (missing token).

### P3 — Icons
**Status 2026-10-16:** done on branch `style/thunderone-ds-icons` (not committed). `@ant-design/icons` 6.3.4
added, `lucide-react` removed (62 files rewritten, 0 left). `icons.tsx` is a client module (antd creates a
React context) whose exports wrap the antd glyph in a Tailwind-controlled span, because antd injects an
unlayered `.anticon { display: inline-flex }` that would beat `hidden` / `sm:block`. `MediaIcon`
(`workspaces/media.tsx`) is not copied: it imports the antd theme, and antd is not installed; the profile
map is applied in `icons.tsx` and the Media nav instead. Browser-checked shell, Overview, Playlists list,
editor and the Edit tags dialog: every icon box matches its class and the svg fills it.
1. Add `@ant-design/icons` (D5). Copy `t1-icons.tsx` + `workspaces/media.tsx` (from P2).
2. Re-implement the 74 `icons.tsx` exports on antd icons, keeping names and the `className` API
   (antd renders a `span.anticon` with a `1em` svg → size via the wrapper class).
3. Replace lucide in the 62 files with `T1Icon` / `MediaIcon` / antd; add concepts the maps lack
   (feed back upstream). Remove `lucide-react` from `package.json`.
4. Verify: icon size/alignment on shell, Overview, one list page, one editor, dialogs.

### P4 — Shell conformance
**Status 2026-10-16:** done on branch `style/thunderone-ds-shell`. Header 69px, sidebar 224px and nav order
already matched. Added Noto Sans Thai (ADR 0096 §7); legacy `Badge` now uses status tokens (DS-04);
sidebars use the design system logos (horizontal colour, T1 mark tile when collapsed) copied to
`public/brand/` and covered by `design-system.check.mts`. Old logo files stay (not deleted). Not done:
auth (`t1-logo-stacked`) and Help header still use the old logos; shell-level DS-11 states unchecked.
Header 69px, nav groups/order from the profile within the routes that exist, logos from
`assets/brand/`, status chips through the profile's status mapping (DS-04), DS-11 states on the
shell-level surfaces. Verify against the skill's shell table.

### P5 — Colour sweep, one PR per area
Order: `media-workspace` (6 files) → shared `components/ui` → publications → channels → people →
auth → the rest. Per area: delete `dark:` variants, raw palette → tokens (mapping table below), hex
literals → tokens, alias names → DS names. Delegation candidate (CLAUDE.md §7): mechanical once the
mapping table is fixed; review every diff.

Starting mapping (extend as found): `zinc/gray/slate-900|800` → `foreground`; `-700|600|500` →
`muted-foreground`; `-400` → `t1-gray-400`; `-200|300` → `border` / `input`; `-50|100` → `muted` /
`secondary`; `bg-white` → `card`; `indigo|blue-600` → `primary`; `-50` → `accent`;
`red-*` → `error` / `error-muted`; `emerald|green-*` → `success`; `amber|yellow-*` → `warning`.
Categorical hues (content kinds, zones) stay until a DS rule covers them (DS-04 forbids status colours).

### P6 — Cleanup
Drop the D7 aliases; `grep` proves zero `dark:`, raw palette and hex in `src`; run the skill's
`review-checklist.md` over the shell and Overview; close #281 and upstream #2; owner updates
`~/.claude/CLAUDE.md` §8 (the "globals.css only, ADR 0075" line).

## Risks
- P2 changes every surface at once (that is the point); screens with literals look mixed until P5.
- antd icons have different optical weight/size from lucide; P3 needs a visual pass, not just `tsc`.
- P5 is ~420 files; it must be split by area or review quality collapses.
