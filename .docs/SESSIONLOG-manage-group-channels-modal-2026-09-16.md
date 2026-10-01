# Manage Channel Group members modal — 2026-09-16

- Reused the two-column channel-selection modal from Create Group's Add More Channels flow for existing groups.
- The existing group path retains member persistence and synchronized-group conflict feedback.
- Static verification: targeted ESLint, `pnpm exec tsc --noEmit`, and `git diff --check` pass.
- Browser verification pending user choice.
