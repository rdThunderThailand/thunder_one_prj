# Session Log — Create Publication Program flow

Date: 2026-09-16

## Scope

- Remove the Step 3 viewport lock and all nested panel scrolling.
- Restore the full Program Summary preview and expanded Additional Settings.
- Keep the compact channel target rows from the previous density pass.

## Guardrails

- Keep target selection, scheduling, playback, and summary behavior unchanged.

## Verification

- `pnpm exec eslint` on the affected publication components.
- `pnpm exec tsc --noEmit`
- `git diff --check`
