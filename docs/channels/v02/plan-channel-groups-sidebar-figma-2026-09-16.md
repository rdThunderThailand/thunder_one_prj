# Plan: Channel Groups sidebar Figma reshape — 2026-09-16

## Scope

Align Channel Groups with the established All Channels list-and-sidebar layout.

1. Use the same full-height grid when a group is selected, with header, summary tiles, full-height table region, and right detail panel.
2. Keep existing group selection, tabs, create/edit/delete, membership management, and Create Program behavior unchanged.
3. Add Figma-aligned detail sections using real group data: preview placeholder, status counts, playback mode, members, and metadata. Current Program stays an honest empty state because no group program-read contract exists.

## Verification

- Targeted ESLint, TypeScript, and `git diff --check`.
- Browser verification after the user chooses a verification option.
