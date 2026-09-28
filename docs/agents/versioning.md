# Versioning & release

How this app gets a version number, when it changes, and who does what. Written for both people and
agents — an agent opening a release PR follows this file literally.

## The number

- **SemVer `0.MINOR.PATCH`**, stored in one place: `package.json` `"version"`. No CHANGELOG file,
  no version in the UI (upgrade path: read `process.env.npm_package_version` into the user menu
  when someone actually asks "which version am I on").
- We stay on `0.x` until the frontend has a stable contract against Thunder_Core. Do not bump to
  `1.0.0` without an ADR.
- **MINOR** (`0.1.0 → 0.2.0`) = every promotion of `dev → main`. One release = one minor, no matter
  how big.
- **PATCH** (`0.2.0 → 0.2.1`) = a hotfix merged into `main` directly, bypassing `dev`. Merge `main`
  back into `dev` right after so the number does not diverge.
- A version is **immutable once tagged**. Wrong tag → new patch release, never move or delete the
  tag.

## Where the number lives

| Place | Form | Set when |
|---|---|---|
| `package.json` | `"version": "0.2.0"` | in the release-prep PR into `dev`, **before** the release PR |
| git tag on `main` | annotated `v0.2.0` on the merge commit | right after the release PR merges |
| release PR title | `release v0.2.0: promote dev → main (#N — …)` | when the release PR is opened |

`main` is deployed to production on merge (Vercel, no staging). The tag therefore marks exactly
what production runs.

## Release sequence

1. **Verify `dev`**: `pnpm install --frozen-lockfile && pnpm exec tsc --noEmit && pnpm exec next build`
   — all three exit 0. Fix on `dev` via a normal PR first if not.
2. **Release-prep PR → `dev`** from branch `release/vX.Y.Z`: bump `package.json` only (plus any
   release-only docs). Draft, Thai or English as the owner picks. Owner merges.
3. **Release PR `dev → main`**, Draft. Title as above; `#N` is the promotion count (see below).
   Body per `thunder-workflow`, with:
   - the previous release PR and tag, and the commit / PR count since;
   - Changes grouped **by module**, one bullet per merged PR (`gh pr list --state merged --base dev --search "merged:>=<last release date>"`);
   - Verification: the three commands from step 1 with exit codes, and which pages were opened in
     a browser (be explicit about what was **not**);
   - the line "merge = deploy to production immediately".
   Owner marks ready and merges — an agent never does.
4. **Tag** on `main` after the merge:
   ```bash
   git fetch origin && git tag -a v0.2.0 <merge-commit> -m "release v0.2.0 (#N)" && git push origin v0.2.0
   ```
   Pushing a tag is irreversible-ish (R0): an agent shows the exact command and waits for a yes.
5. Diff between releases: `git log v0.1.0..v0.2.0 --first-parent --oneline`.

## Counting releases

Count **promotions of `dev → main`**, not merges into `main`. Feature branches merged straight to
`main` before `dev` existed (#6, #14, #15) are not releases.

| # | Version | PR | Date |
|---|---|---|---|
| 1 | `v0.1.0` (tagged retroactively on `bca6937`) | #118 | 2026-09-16 |
| 2 | `v0.2.0` | #139 | 2026-09-22 |

Append a row for every release. This table is the only release log we keep.

## Why this and not the alternatives

- **CalVer** (`2026.09.22`): no numbers to think about, but `package.json` already said `0.1.0`,
  and CalVer cannot express "hotfix on top of the same release".
- **No version, PR numbers as markers**: works until a bug report says "on production" and nobody
  can tell which merge that was. A tag costs one command.
- **Version in the UI now**: three lines of code but another thing to verify on every release for
  a question nobody has asked yet.
