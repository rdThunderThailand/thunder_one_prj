# 0034 — Feature folders nest under their App; `ai-`/`tc-` prefixes retired

## Context

ADR-0023 solved the `Asset`-vs-`Asset` folder collision (Communication's media file vs. Asset
Intelligence's physical asset) with a flat prefix: every Asset Intelligence feature folder got an
`ai-` prefix (`src/features/ai-assets`, `ai-departments`, ...). ADR-0033's same-day implementation
notes extended that same mechanism to ThunderCare with a `tc-` prefix (`tc-work-orders`,
`tc-service-ops`) for consistency, without re-examining whether prefixing was still the best fit.

Two things changed since ADR-0023 was written that make its own stated costs no longer worth paying:

- **The App concept didn't fully exist yet.** ADR-0023 predates ADR-0033's Thunder One shell — at
  the time, "Asset Intelligence" was just a second app switched via a dropdown, not one of three
  Apps with their own route namespace (`(dashboard)/{communication,asset-intelligence,thunder-care}/**`)
  and their own nav config file (`config/nav/{communication,asset-intelligence,thunder-care}.tsx`).
  Now that App-level grouping is an established pattern everywhere else in this codebase, feature
  folders are the one place still using a different mechanism (prefix) for the same idea.
- **ADR-0023 already named its own prefix's cost as real, not hypothetical**: "`ai-` reads, to
  someone unfamiliar with this decision, as if it stands for 'AI' (artificial intelligence) rather
  than 'Asset Intelligence'" (ADR-0023, Consequences). Folder nesting removes that misreading
  entirely — `src/features/asset-intelligence/assets` cannot be misread as anything else.

## Decision

**Every feature folder owned by exactly one App nests under `src/features/<app-id>/`, matching that
App's `id` in `src/config/apps.tsx`. Features owned by no single App stay top-level, unprefixed.**

```
src/features/
├── auth/                          # pre-App (login/register) — unowned by any App
├── mission-control/                # shell-level (ADR-0033) — unowned by any App
├── communication/
│   ├── assets/ channels/ overview/ playlists/ publications/
├── asset-intelligence/
│   ├── assets/ departments/ issues/ requests/
└── thunder-care/
    ├── work-orders/ service-ops/
```

Import paths follow the nesting directly: `@/features/communication/assets`,
`@/features/asset-intelligence/assets`, `@/features/thunder-care/work-orders`. No prefix survives —
`ai-assets` → `asset-intelligence/assets`, `tc-work-orders` → `thunder-care/work-orders`, and so on
for every folder ADR-0023/0033 had prefixed.

**This supersedes ADR-0023's chosen *mechanism* only.** ADR-0023's actual subject — why the `Asset`
entity itself keeps its name instead of becoming `Equipment` — is untouched and still the reason two
features are both allowed to export a type called `Asset`. Namespacing that collision now happens by
directory nesting instead of a filename prefix, which is a strictly narrower change than it sounds.

## Options rejected

**Keep the `ai-`/`tc-` prefix, extend it to any future App.** What ADR-0023/0033 already did.
Rejected per Context — pays a permanent naming tax and an ongoing misreading risk
(`ai-` = artificial intelligence) for a disambiguation that App-level nesting now gives for free.

**Nest only new folders going forward, leave existing `ai-*`/`tc-*` folders as-is.** Would leave two
conventions live in the same repo with no rule for which one a new contributor should follow.
Rejected — a mechanical, one-time rename of everything that exists today (11 folders) is cheap enough
to just do, versus carrying two competing patterns indefinitely.

## Consequences

Every relative import that crossed a feature folder's own boundary (e.g. `../../types/domain.ts`
reaching `src/types/`) needed one more `../` — nesting added a directory level. Five files in
`communication/playlists`/`communication/publications` hit this (their `.check.mts` scripts and a
couple of `.ts` files use relative imports rather than the `@/` alias, unlike the rest of the
codebase) and were fixed as part of this change. Anyone adding a new file with a relative import that
reaches outside its own feature folder should double-check the path depth against where the file
actually sits now.

`docs/adr/0023-asset-intelligence-feature-namespacing.md` and
`docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md`'s "Implementation notes" section both still
describe the prefix mechanism accurately for the day they were written — left as historical record,
not rewritten. `CONTEXT.md` is updated to point at this ADR instead.

## Extended to routing (2026-08-20, same day)

The same grouping principle was applied one level up, to `src/app/(dashboard)/`: the five
shell-owned routes that had been sitting as flat siblings next to the three App folders —
`page.tsx` (`/`), `work-space/`, `mission-control/`, `my-work/`, `intelligence/`, `governance/` —
now nest under a `(shell)` route group: `src/app/(dashboard)/(shell)/{page.tsx,work-space,
mission-control,my-work,intelligence,governance}`. A route group's parenthesized name is stripped
from the URL (see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`),
so every URL is unchanged — this is purely a file-tree reorganization, verified by an identical
`next build` route manifest before and after.

`communication/`, `asset-intelligence/`, and `thunder-care/` were initially left as plain folders
rather than also grouped, reasoning that each is already uniquely named and doesn't need a
container the way "shell" (not itself a URL segment) did. Revisited same day: for full symmetry with
`(shell)`, they now nest under `(application)` too —
`src/app/(dashboard)/(application)/{communication,asset-intelligence,thunder-care}`. `(dashboard)`'s
top level is now exactly two buckets, `(shell)` and `(application)`, plus `layout.tsx` (which must
stay at the `(dashboard)` root — it wraps both groups, so it can't live inside either one). Same
URL-transparency guarantee, reverified with another identical `next build` route manifest.

This didn't reach the level of its own ADR (easily reversed, and the sibling App folders already
make the pattern self-explanatory) — recorded here as an extension of the same reasoning rather than
a separate decision.
