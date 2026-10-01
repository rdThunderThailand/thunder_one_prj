# Edit Channel Group modal alignment — 2026-09-16

- Expanded Edit Channel Group to the same form modal structure as Create Channel Group.
- Replaced the create-only member draft section with the existing Manage Channels workflow.
- Deliberately omitted Tags because the current Channel Group contract does not expose tags.
- Static verification: targeted ESLint, `pnpm exec tsc --noEmit`, and `git diff --check` pass.
- Browser verification pending user choice.
