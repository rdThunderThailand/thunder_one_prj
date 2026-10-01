# Layouts navigation badge — 2026-09-16

## Changed

- Removed the `NEW` badge from the Layouts navigation item.

## Verification

- Passed: `git diff --check`.
- Passed with existing warning: `pnpm exec eslint src/config/nav/media-workspace.tsx` reports the pre-existing `@next/next/no-img-element` warning at line 11; no errors.
- Pending: browser verification.
