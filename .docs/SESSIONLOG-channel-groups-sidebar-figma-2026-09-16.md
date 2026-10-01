# Channel Groups sidebar Figma reshape — 2026-09-16

- Matched the All Channels full-height selected-row layout: header, summary, table region, and a right inspector spanning the summary/table rows.
- Added Figma-aligned group inspector sections for a preview placeholder, playback-aware health summary, current-program empty state, members, metadata, and the existing Programs actions.
- Kept group membership, edit/delete, and Create Program behavior unchanged.
- Static verification: targeted ESLint, `pnpm exec tsc --noEmit`, and `git diff --check` pass. Browser verification is pending.
