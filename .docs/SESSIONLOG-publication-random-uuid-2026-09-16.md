# Publication random UUID fallback — 2026-09-16

## Change

- Added a Web Crypto `getRandomValues` UUID v4 fallback for publication draft idempotency keys when `crypto.randomUUID` is unavailable.

## Verification

- `node src/lib/random-uuid.check.mts`
- `pnpm exec tsc --noEmit`

## Not verified

- Browser verification was not run.
