# SESSIONLOG — shell 9px → text-2xs — 2026-10-20

Worktree `../thunder_one_prj-wt-fontsize`, branch `style/shell-font-size-token` from `origin/dev` @ e109cb2 (#300 merged). Not committed.

## Decision (owner, 2026-10-20)
DS-01 gap from the P6 checklist: arbitrary px font sizes in the shell. Owner compared 8 / 9 / 10px on the live app and chose **9px → 10px**. 8px stays (`NavBadge` in `media-workspace-sidebar.tsx`).

## Done
- `GlobalSearch.tsx:170` kbd and `media-workspace-sidebar.tsx:100` section label: `text-[9px]` → `text-2xs` (project token, 0.625rem / 14px line-height, defined in `globals.css`).

## Proof
- `tsc --noEmit` clean; eslint clean on both files (worktree, node_modules symlinked).
- Computed on the running dev server (class-level, not a render of this branch): kbd 9px→`text-2xs` = 30×19.5 → 32×20 px, font-size 10px, line-height 13.5→14px. kbd is absolutely centred, label in normal flow: +0.5px.
- NOT verified: a full-page render of this branch; `next build`; the remaining ~80 `text-[9px]` sites.

## Open
- Remaining arbitrary px sizes repo-wide (~500): 11px→`text-ui`, 10px→`text-2xs`, 8px→`text-3xs` are mechanical; 9px elsewhere needs a per-area look; 13/15/32px have no token. No issue filed yet.
- Commit/PR waits for the owner.
