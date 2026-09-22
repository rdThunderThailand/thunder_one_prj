# Plan: Create Channel Group member selection — 2026-09-16

## Scope

1. Expand Create Channel Group with a visible `Channels to Add` section that reflects the current draft selection.
2. Open a two-column Manage Channels dialog from `Add More Channels`; this only updates the local draft selection.
3. Create the group first, then persist the selected members through the existing members endpoint.

## Constraints

- Reuse existing Channel list data and APIs; no new contract, dependency, or server mutation path.
- Keep the server-side synchronized-group membership guard and present its existing error.

## Verification

- Targeted ESLint, TypeScript, and `git diff --check`.
- Browser verification after the user chooses a verification option.
