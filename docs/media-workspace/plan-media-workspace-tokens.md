# Plan — Media Workspace on Lovable tokens

Status: **Tier B done, Tier A complete** (2026-09-20 run-2; see plan-lovable-content-library.md Audit). Branch `style/media-workspace-tokens` → `dev`.
Executes ADR 0075 across the rest of Media Workspace; no new ADR.
Reference: Lovable project `e8b49026-3bd5-4a8f-b94c-aad813085d2c` (Overview + Media Library only).

## Decisions (owner, 2026-09-18, grilling)

1. **Scope**: the 23 list/detail/wizard routes under `media-workspace/` plus the chrome around the
   layout/composition canvases. `(preview)/` routes are untouched.
2. **Two tiers.** Tier B (this PR): mechanical token mapping on every file. Tier A (next PR): full
   R1–R6 port of Media Library → Playlists → Layouts, using the Lovable Media Library design as the
   file-system pattern; it needs the `ui/lovable/` primitives + R5 dependency proposal first.
3. **Colors**: raw `indigo-*` and `zinc-*` are replaced by tokens; `red/emerald/amber` map to
   `danger/success/warning` where a token exists. Text collapses to two levels
   (`foreground` / `muted-foreground`).
4. **`dark:` variants are deleted** in every touched file — the app is light-only (globals.css).
5. **Page frame** from Overview: root `space-y-4`, card grids `gap-3`, cards
   `rounded-lg border-border bg-card`, header `flex flex-wrap items-center justify-between gap-3`.
   Full-height wizard/editor keep `min-h`/`flex-1`, only gaps change. Component-internal spacing
   stays until Tier A.
6. **Method**: throwaway codemod for the unambiguous pairs, then a manual pass over whatever the
   script prints as unknown. Commits per area × (color | frame) so either half can be reverted.
7. **Rule**: recorded in ADR 0075 Consequences + CLAUDE.md §8 — inside
   `src/features/media-workspace/` raw palette classes and `dark:` are not allowed. No lint rule yet.
8. **Lovable `styles.css` is not copied wholesale.** Tokens/utilities are already in globals.css
   (additive, safe). `@layer base` (`body 14px`, `* border-color`) and `.dark` are app-wide and
   stay out; `--program` is added in Tier A. `--chart-*` waits for a chart port.

## Mapping

| from | to |
|---|---|
| `text-indigo-{300..900}`, `hover:text-indigo-*` | `text-primary` |
| `bg-indigo-{500,600}`, `hover:bg-indigo-500` | `bg-primary` |
| `bg-indigo-{50,100,200}` (any opacity), `hover:bg-indigo-50*` | `bg-primary-soft` |
| `border-indigo-{500,600}`, `ring-indigo-{400,500}` | `border-primary` / `ring-primary` |
| `border-indigo-{100..400}`, `ring-indigo-{100..300}` | `border-primary/30` / `ring-primary/30` |
| `focus:border-indigo-*`, `focus:ring-indigo-*` | `focus:border-ring`, `focus:ring-ring/30` |
| `text-zinc-{800,900,950}` | `text-foreground` |
| `text-zinc-{300..700}` | `text-muted-foreground` |
| `border-zinc-{100,200,300}`, `divide-zinc-200` | `border-border`, `divide-border` |
| `bg-zinc-{50,100}`, `hover:bg-zinc-{50,100,200}` | `bg-muted`, `hover:bg-muted` |
| `bg-zinc-{900,950}` | `bg-foreground` |
| `text-emerald-*` / `bg-emerald-50` / `bg-emerald-500` | `text-success` / `bg-success-soft` / `bg-success` |
| `text-amber-*` / `bg-amber-50` / `bg-amber-500` | `text-warning` / `bg-warning-soft` / `bg-warning` |
| `text-red-*` / `bg-red-50` / `bg-red-{500,600}` | `text-danger` / `bg-danger-soft` / `bg-danger` |
| `dark:*` | removed |

Anything else the script meets is listed and decided by hand.

## Sequence

1. Codemod + unknown list → hand pass → `tsc`, `lint`.
2. Frame pass on list/detail pages.
3. ADR 0075 + CLAUDE.md lines.
4. Browser verification (owner chooses the mode, CLAUDE.md §3) → SESSIONLOG.
5. Tier A PR: primitives → deps (R5) → Media Library → Playlists → Layouts, side-by-side each.
