# Versioning & release

How this app gets a version number, when it changes, and who does what. Written for both people and
agents — an agent opening a release PR follows this file literally.

## The number

- **SemVer `MAJOR.MINOR.PATCH`**, stored in one place: `package.json` `"version"`. No CHANGELOG file,
  no version in the UI (upgrade path: read `process.env.npm_package_version` into the user menu
  when someone actually asks "which version am I on").
- **One number for the whole app.** Every Workspace ships in this one app and one deploy, so there is
  no per-Workspace version; release notes group changes by Workspace instead (ADR 0115 amendment).
- `1.0.0` is the first release for every tenant (ADR 0115). **MAJOR** = removes or renames a nav route
  of a **Stable Workspace** (below), removes a workflow step its operators rely on, or needs a Core
  change the previous release cannot run against. A Workspace that is not stable may change in a
  MINOR. Thunder_Core keeps its own `0.x` numbering.
- **MINOR** (`0.1.0 → 0.2.0`) = a release that adds backward-compatible functionality. A minor
  release may include bug fixes.
- **PATCH** (`0.2.0 → 0.2.1`) = a release containing only backward-compatible bug fixes (plus
  release-only docs or metadata), whether it promotes `dev → main` or hotfixes `main` directly.
  After a direct-to-`main` hotfix, merge `main` back into `dev` so the number does not diverge.
- Classify the **whole diff since the current `main` release**, not the branch route or the last PR.
  If that diff includes a feature, use MINOR; if it contains only bug fixes, use PATCH.
- A version is **immutable once tagged**. Wrong tag → new patch release, never move or delete the
  tag.

## Stable Workspaces

A Workspace whose routes and workflows are a promise to operators. This list is the only place that
says so; the launcher's `dataStatus` is a different fact (`live` = reads Thunder_Core).

| Workspace | Stable since | UAT |
|---|---|---|
| Media Workspace | `v1.0.0` | `docs/media-workspace/uat-v1-checklist.md` + retests |

To add one: the Workspace passes a UAT on prod in `thunder_qa`, the owner accepts it, the release-prep
PR adds its row here, and the release is a MINOR whose release note announces it. Which tenants see a
Workspace is a Core setting (`enabled_workspaces`), not this list.

## Where the number lives

| Place | Form | Set when |
|---|---|---|
| `package.json` | `"version": "0.2.0"` | in the release-prep PR into `dev`, **before** the release PR |
| git tag on `main` | annotated `v0.2.0` on the merge commit | right after the release PR merges |
| release PR title | `release v0.2.0: promote dev → main (#N — …)` | when the release PR is opened |
| GitHub Release | `v0.2.0`, title `v0.2.0 (#N)`, Thai release note | with the tag, same approval |

`main` is deployed to production on merge (Vercel, no staging). The tag therefore marks exactly
what production runs.

## Release sequence (`dev → main`)

Two PRs per release. Merge methods follow ADR 0118.

1. **Verify `dev`**: `pnpm install --frozen-lockfile && pnpm exec tsc --noEmit && pnpm exec eslint . && pnpm exec next build`
   — all exit 0. Fix on `dev` via a normal PR first if not. (`next build` no longer runs ESLint in
   Next 16, so `eslint` is its own step.)
2. **Release-prep PR → `dev`** from branch `release/vX.Y.Z`: choose MINOR or PATCH from the diff
   since the current `main` release, bump `package.json`, and add a row to **Stable Workspaces** if
   this release makes one stable. Draft, Thai or English as the owner picks. Squash. Owner merges.
3. **Release PR `dev → main`**, Draft. Title as above; `#N` is the promotion count (see below).
   Body per `.github/pull_request_template.md`, with:
   - the previous release and tag, and the commit / PR count since;
   - Changes grouped **by Workspace** (`ws:*` label), one bullet per merged PR
     (`gh pr list --state merged --base dev --search "merged:>=<last release date>"`);
   - Verification: the commands from step 1 with exit codes, and which pages were opened in
     a browser (be explicit about what was **not**);
   - the line "merge = deploy to production immediately".
   Owner marks ready and merges with a **merge commit** — an agent never merges.
4. **Publish** once Vercel reports the production deploy of the merge commit as `success`
   (`gh api repos/<owner>/<repo>/commits/<sha>/status`). One approval covers all three; an agent shows
   the exact commands and the release-note text, then waits for a yes (R0):
   ```bash
   git fetch origin && git tag -a vX.Y.Z <merge-commit> -m "release vX.Y.Z (#N)" && git push origin vX.Y.Z
   gh release create vX.Y.Z --verify-tag --title "vX.Y.Z (#N)" --notes-file <release-note.md>
   ```
   then a comment "ออกใน vX.Y.Z" on each ClickUp task linked (`Ticket:` / `CU-<id>`) from the shipped
   PRs (ADR 0119). Close the version's milestone if one was used for planning.
5. Diff between releases: `git log vA..vB --first-parent --oneline`.

## Hotfix sequence (straight to `main`)

Two PRs per hotfix.

1. Branch `hotfix/vX.Y.Z-<slug>` from **`origin/main`**, never from `dev` (a `dev` branch carries
   unreleased commits into `main`).
2. The fix and the PATCH bump of `package.json` go in **one** PR → `main`, titled
   `fix(scope): … (vX.Y.Z)` and saying `Refs #N` (a PR into `main` does not close issues). Draft until
   verified on the layer the user uses. Owner merges with a **merge commit** (ADR 0118: `main` takes merge
   commits only).
3. Publish exactly as step 4 above (tag, GitHub Release, ClickUp comments). A hotfix is not a
   promotion: its Release title has no `#N`.
4. **Back-merge PR `main → dev`** right away, **merge commit**, carrying `Closes #N` for the hotfix's
   issues. If `dev` already has a release-prep bump, `package.json` conflicts: keep `dev`'s version.

## Counting releases

Count **promotions of `dev → main`**, not merges into `main`. From `v1.0.0` on the count lives in the
release PR title and the GitHub Release title (`v1.1.0 (#28)`): the next `#N` is the last promoted
Release's `#N` plus one. Feature branches merged straight to
`main` before `dev` existed (#6, #14, #15) are not releases.
The promotion count is independent of the version component: a bugfix-only promotion increments
the count while bumping PATCH, not MINOR.

| # | Version | PR | Date |
|---|---|---|---|
| 1 | `v0.1.0` (tagged retroactively on `bca6937`) | #118 | 2026-09-16 |
| 2 | `v0.2.0` | #139 | 2026-09-22 |
| 3 | `v0.3.0` | #161 | 2026-09-28 |
| 4 | `v0.4.0` | #177 | 2026-09-29 |
| 5 | `v0.5.0` | #185 | 2026-10-01 |
| 6 | `v0.5.1` | #188 | 2026-10-01 |
| 7 | `v0.5.2` | #192 | 2026-10-01 |
| 8 | `v0.6.0` | #206 | 2026-10-01 |
| 9 | `v0.6.1` | #211 | 2026-10-05 |
| 10 | `v0.7.0` | #218 | 2026-10-05 |
| 11 | `v0.8.0` | #234 | 2026-10-07 |
| 12 | `v0.8.1` | #240 | 2026-10-07 |
| 13 | `v0.9.0` | #252 | 2026-10-08 |
| 14 | `v0.10.0` | #258 | 2026-10-08 |
| 15 | `v0.11.0` | #266 | 2026-10-09 |
| 16 | `v0.12.0` | #271 | 2026-10-09 |
| 17 | `v0.12.1` | #279 | 2026-10-14 |
| — | `v0.12.2` (hotfix straight to `main`, not a promotion) | #311 | 2026-10-21 |
| 18 | `v0.13.0` | #314 | 2026-10-22 |
| — | `v0.14.0` (hotfix straight to `main`, not a promotion) | #316 | 2026-10-22 |
| — | `v0.15.0` (hotfix straight to `main`, not a promotion) | #321, #322, #323 | 2026-10-27 |
| — | `v0.15.1` (hotfix straight to `main`, not a promotion; never tagged — its code shipped inside `v0.16.0`) | #327 | 2026-10-27 |
| 19 | `v0.16.0` (tagged retroactively on `3172a88d`; `package.json` was not bumped for it because the release-prep PR #332 was closed) | #333 | 2026-10-29 |
| 20 | `v0.17.0` | #349 | 2026-11-05 |
| 23 | `v0.20.0` | #361 | 2026-11-09 |
| — | `v0.20.1` (hotfix straight to `main`, not a promotion) | #373 | 2026-11-11 |
| — | `v0.20.2` (hotfix straight to `main`, not a promotion) | #376 | 2026-11-11 |
| 24 | `v0.21.0` | #391 | 2026-11-17 |
| 25 | `v0.22.0` | #398 | 2026-11-17 |
| 26 | `v0.23.0` (release candidate for `1.0.0`, ADR 0115) | #408 | 2026-11-18 |
| — | `v0.23.1` (hotfix straight to `main`, not a promotion) | #410 | 2026-11-18 |
| — | `v0.23.2` (hotfix straight to `main`, not a promotion) | #416 | 2026-11-19 |
| — | `v0.23.3` (hotfix straight to `main`, not a promotion) | #419 | 2026-11-19 |
| — | `v0.23.4` (hotfix straight to `main`, not a promotion) | #423 | 2026-11-19 |
| 27 | `v1.0.0` (v1.0, first release for every tenant, ADR 0115) | #429 | 2026-11-19 |
| 28 | `v1.0.1` | #436 | 2026-11-20 |

This table stops at `v1.0.1` (ADR 0115 amendment). Later releases are GitHub Releases:
`gh release list`.

## Why this and not the alternatives

- **CalVer** (`2026.09.22`): no numbers to think about, but `package.json` already said `0.1.0`,
  and CalVer cannot express "hotfix on top of the same release".
- **No version, PR numbers as markers**: works until a bug report says "on production" and nobody
  can tell which merge that was. A tag costs one command.
- **Version in the UI now**: three lines of code but another thing to verify on every release for
  a question nobody has asked yet.
