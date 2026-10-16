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
- Icons: `@ant-design/icons` through `T1Icon` / `MediaIcon` once plan P3 lands; until then keep the
  existing `icons.tsx` / `lucide-react` imports and add no new lucide icons.
- Components: reuse `src/components/ui/lovable/` primitives; Lovable is no longer a visual source.
- Nav and terms follow `src/config/nav/media-workspace.tsx` where the profile disagrees (ADR 0096 §6).
- Thai text: no Thai face yet (OD-05); do not add one locally.
- Do not run the design system's setup CLI here. Update by re-copying the skill and
  `src/design-system/` from a newer tag in one PR.
