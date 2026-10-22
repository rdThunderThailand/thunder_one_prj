<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## JSX formatting

Write JSX with one element per line, matching the surrounding file. A `return` statement that renders more than a couple of elements gets multi-line JSX with normal indentation, not a single collapsed line.

## ThunderOne design system

ThunderOne workspace: media

UI work follows the `thunderone-ui` skill (`.claude/skills/thunderone-ui/`, vendored unmodified at
`v0.2.0`) and its `media` profile, as decided in ADR 0096. Read both before creating, editing or
reviewing a screen. Where the skill and this file disagree, this file wins.

- Tokens come from `src/design-system/t1-tailwind-v4.css` (a copy of the skill's generated theme,
  imported by `src/app/globals.css`). Never edit the copy; `node src/design-system/design-system.check.mts`
  fails if it drifts. Do not install `@rdthunderthailand/thunderone-theme`.
- No raw palette classes (`zinc-*`, `indigo-*`, `bg-white` …), hex literals or new `dark:` variants.
  Prefer the design system names (`error`, `success-muted`, `accent`) over the temporary aliases
  (`danger`, `*-soft`, `primary-soft`). In CSS use `var(--color-x)`, never `var(--x)` (HSL triplets).
- Icons: import from `src/components/ui/icons.tsx` (antd glyphs; platform concepts via `T1Icon`,
  Media concepts per the `media` profile map). Add a missing concept there; never import
  `@ant-design/icons` or SVG paths in feature code.
- Components: reuse `src/components/ui/lovable/` primitives; Lovable is no longer a visual source.
- Nav and terms follow `src/config/nav/media-workspace.tsx` where the profile disagrees (ADR 0096 §6).
- Thai text: Noto Sans Thai via `next/font` after Manrope (ADR 0096 §7, local until OD-05 closes).
- Do not run the design system's setup CLI here. Update by re-copying the skill and
  `src/design-system/` from a newer tag in one PR.

### Asset Workspace styling

Screens under `src/features/asset-workspace/` and `/asset-workspace` use the skill's core rules and
the local profile in ADR 0098 (status and condition colours, icon map), not the `media` profile.
Status colours come from the one map next to `domain/`; never pick a colour per screen.
