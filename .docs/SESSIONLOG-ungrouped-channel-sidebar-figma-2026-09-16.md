# Ungrouped Channels sidebar — 2026-09-16

- Added row selection and the established full-height sidebar layout to the Ungrouped Channels tab.
- Reused the live Channel Detail panel for the Figma sidebar data rather than creating duplicate channel detail state.
- Switching tabs clears the selection that does not belong to the newly active tab.
- Static verification: targeted ESLint, `pnpm exec tsc --noEmit`, and `git diff --check` pass.
- Browser verification pending user choice.
