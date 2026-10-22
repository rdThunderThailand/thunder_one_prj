# The ThunderOne design system is the target; the Lovable treatment stays until OD-01 and OD-04 close

**Status:** superseded by ADR 0096 (2026-10-16)
**Amends:** ADR 0075 (tokens, icons), ADR 0076 (component source) — both stay in force for visuals until the trigger below
**Source:** grilling with the owner, 2026-10-16
**Related:** design system repo `rdThunderThailand/-thunder-design-system` tag `v0.2.0`, vendored skill `.claude/skills/thunderone-ui/`

## Context

The company design system (`thunderone-ui` skill + `@rdthunderthailand/thunderone-theme`, v0.2.0)
is meant to govern every ThunderOne Workspace. Several of its core rules contradict what this repo
decided in ADR 0075/0076:

| Rule | Design system | This repo |
|---|---|---|
| DS-01/02 tokens, theme | values from `tokens.json` via the theme package | Lovable oklch tokens in `src/app/globals.css` |
| DS-07 font | Manrope via a Google Fonts `@import` | Manrope via `next/font` (`--font-manrope`) |
| DS-09 icons | `@ant-design/icons` only, no lucide | `components/ui/icons.tsx` (406 files) + `lucide-react` (62 files) |
| DS-10 brand | logos from the skill's `assets/brand/` | `/icon.svg` in the sidebar brand block (ADR 0075 §6) |

Facts that shaped the decision:

- The design system has not settled these itself. **OD-01** records that the approved Media screen
  — imported from the same Lovable build this repo follows — does not use the semantic tokens.
  **OD-04** records that no icon map is signed off by design.
- `tailwind/v4.css` cannot be layered on `globals.css`: it defines the same variable names
  (`--primary`, `--border`, …) as HSL triplets where this repo stores full oklch values, and it has
  none of this repo's own tokens (`program`, `overlay`, `info`, `surface-subtle`, `sidebar-*`).
- The `media` Workspace profile does not match this repo's data: it lists a **PA / Audio** channel
  type and an "Audio" filter (none exists, ADR 0075 §7), uses **Layout** for what this repo calls a
  Composition (ADR 0076 §7), and lists a Settings group (Brand Assets, Design System) that does not
  exist.

## Decision

1. **The design system is the target, not the current source of visuals.** Migration to the theme
   package, its token values and its icon set starts only when design closes **OD-01 and OD-04**.
   Until then ADR 0075/0076 keep deciding layout, spacing, colour, typography and icons.
2. **Scope: all of `thunder_one_prj`**, not only `src/features/media-workspace/`. ADR 0075 already
   made the token layer app-wide. New Thunder projects with no prior design adopt the design system
   in full.
3. **Design-system rules that apply now:** DS-03 (shell structure; measurements stay Lovable's,
   e.g. header 68px), DS-04 (status through semantic tokens, never for taxonomy), DS-05 (4px scale,
   12px card gap), DS-06, DS-08, DS-11 (loading / empty / error with retry), DS-12 (copy), DS-13
   (accessibility), DS-14, and the `media` profile's status mapping and vocabulary where it names
   something this repo has.
4. **Known deviations (not defects in review):** DS-01/02 (values and theme from `globals.css`),
   DS-07 (font loading), DS-09 (icons), DS-10 (brand assets). A design-system review that fails one
   of these reports it as "known deviation (ADR 0095)".
5. **Data, routes and vocabulary follow this repo** (the ADR 0076 split): Composition / Layout as in
   ADR 0076 §7, no Audio channel type, no Settings group. Profile items with no counterpart here are
   not built from the profile.
6. **The skill is vendored per project** at `.claude/skills/thunderone-ui/`, copied unmodified from
   tag `v0.2.0`. It is updated only by re-copying a newer tag in a PR. The design system's setup CLI
   is not run here: its managed `AGENTS.md` block says to install the theme package, which point 1
   forbids, and it would rewrite that block on every run.

## Alternatives

- **Lovable stays, design system advisory only, no target.** Keeps two company standards
  indefinitely and every design-system review fails DS-01/02/09 forever.
- **Design system wins now; supersede 0075/0076 and migrate.** Re-themes the whole app, replaces
  icons in ~468 files and the Lovable primitives while OD-01/OD-04 are still open, so it risks a
  second migration when design decides.
- **Scope limited to `src/features/media-workspace/`.** Splits the rules by folder inside one token
  layer; agents cannot tell which applies to a shared component.
- **Global (user-level) skill install.** The skill would follow the design system's `main` silently
  and apply its rules in every repo with no record of which version this repo was checked against.
- **Run the setup CLI and edit its block afterwards.** The next run overwrites the edit.

## Consequences

- `AGENTS.md` gains a "ThunderOne design system" section with `ThunderOne workspace: media` (so the
  skill's Step 0 finds the profile) and explicit prohibitions: no theme package, no
  `@ant-design/icons`, no removal of `lucide-react` / `icons.tsx`, no import of the design system's
  CSS. It deliberately does not use the setup CLI's `thunder-design-system:start` marker.
- Trigger to revisit: OD-01 and OD-04 closed in the design system repo. Tracking issue
  thunder_one_prj#281 links to the upstream issue rdThunderThailand/-thunder-design-system#2, which
  asks for an OD covering the v4/oklch layering problem, lucide in Lovable-sourced projects, and the
  `media` profile mismatches above.
