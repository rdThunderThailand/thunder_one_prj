# Create Channel Group member selection — 2026-09-16

- Added the Figma-style `Channels to Add` section to the create-group form, seeded from the Ungrouped Channels selection.
- Added an in-memory two-column Manage Channels dialog for `Add More Channels`; it only updates the group draft until Create Group is pressed.
- Reused the existing create and membership endpoints, retaining synchronized-group conflict handling.
- Static verification: targeted ESLint, `pnpm exec tsc --noEmit`, and `git diff --check` pass.
- Browser verification pending user choice.
