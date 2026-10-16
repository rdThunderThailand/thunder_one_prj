# The ThunderOne design system is the UI source

**Status:** accepted · 2026-10-16
**Supersedes:** ADR 0095; the visual parts of ADR 0075 (§1 token values, §2 font binding stays, §9 icons) and ADR 0076 (§1 Lovable as visual source, §5 base layer)
**Source:** owner decision 2026-10-16 after ADR 0095; plan `docs/design-system/plan-thunderone-ds-migration.md` (D1–D10)
**Related:** rdThunderThailand/-thunder-design-system#2, thunder_one_prj#281

## Context

ADR 0095 made the design system a target and kept Lovable as the visual source until the design
system closed OD-01 (colours) and OD-04 (icon maps). The owner decided not to wait: the `thunderone-ui`
skill (vendored at `v0.2.0`) is the UI source now. Open decisions stay with the design system team
(#2); while they are open, the skill's own DS-14 says to use the `tokens.json` values and the proposed
icon maps, so nothing here waits on them. This repo has READ-only access to the design system repo.

The design system's `tailwind/v4.css` uses the same shadcn variable names as the old `globals.css`
but stores colours as HSL triplets, so it can replace that block but not be layered on it.

## Decision

1. **Visual authority** for every surface in this repo is the `thunderone-ui` skill and the `media`
   Workspace profile. Data, behaviour, routes and permissions stay with this repo and its ADRs.
   Lovable is no longer a visual source; `src/components/ui/lovable/` stays as component code (it
   uses shadcn token classes, so it takes the design system's values).
2. **Theme delivery:** `src/design-system/` holds unmodified copies of the skill's `assets/code/`
   files; `design-system.check.mts` fails if a copy differs from the vendored skill. The npm package
   is not installed (GitHub Packages auth on every machine and on Vercel buys nothing the copies lack).
3. **`globals.css`** imports `t1-tailwind-v4.css` and only adds project-only tokens (z-index, small
   text sizes, `radius-2xl..4xl`, `overlay`, `program`, `surface-*`, `border-subtle`, shadows) and
   temporary aliases for the old names (`danger`, `*-soft`, `primary-soft`). The old oklch block and
   the unused `.dark` block are removed. The design system's base layer (`* { border-color }`, body
   colour/background/font) is accepted. `--font-sans` stays on `next/font` Manrope.
4. **`dark:` stays bound to `.dark`** (`@custom-variant`) until the sweep removes those classes;
   otherwise ~390 files would switch on with the OS theme.
5. **Icons** move to `@ant-design/icons` (approved new dependency) through `T1Icon` / `MediaIcon` in
   plan P3: the 74 `icons.tsx` exports are re-implemented on antd, then lucide is replaced and removed.
6. **Navigation and vocabulary** follow this repo's nav config where the `media` profile disagrees
   (reported in #2): Channel groups and Playback proof exist; PA / Audio, Kiosks, Monitoring and
   Analytics render as "Not built yet"; there is no Settings group.
7. **Thai text** keeps the OS fallback until the design system names a Thai face (OD-05).

## Alternatives

- **Wait for OD-01/OD-04 (ADR 0095).** Rejected by the owner; DS-14 already defines what to use
  while they are open.
- **Close the open decisions ourselves in the design system repo.** Not ours to decide, and our
  account cannot push there. An unpushed local draft exists in the clone and is not used.
- **Install `@rdthunderthailand/thunderone-theme`.** Adds registry auth to every dev machine and to
  Vercel for files the skill already ships.
- **Rename every old token user in the same PR.** ~270 files; aliases keep the foundation PR small.
- **Layer `v4.css` on the old block.** Same names, different value formats — whichever loads last
  breaks the other.

## Consequences

- Every surface changes colour, radius (`sm` 8→6px) and border colour at once; screens with raw
  palette classes (419 files) or hex literals (48) look mixed until plan P5 sweeps them per area.
- The copied CSS opens with a Google Fonts `@import url()`, which CSS allows only before every other
  rule (Turbopack dev refuses to compile otherwise). `globals.css` therefore imports the copy first and
  re-applies `border-color` after Tailwind's preflight. The browser now fetches Manrope from Google
  Fonts as well as from `next/font`; `--font-sans` still points at `next/font`. Dropping the duplicate
  is left for the design system team.
- `AGENTS.md` "Media Workspace styling", "Porting from Lovable" and the ADR 0095 section are replaced
  by one design-system section. `docs/media-workspace/plan-lovable-port-workflow.md` is superseded.
- Updating the design system = re-copy the skill and `src/design-system/` from a new tag in one PR.
