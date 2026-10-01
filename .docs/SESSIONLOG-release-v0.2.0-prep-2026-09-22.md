# SESSIONLOG — release v0.2.0 prep + versioning convention (2026-09-22)

Grilled (Q1–Q8) → all recommendations accepted. Decisions: cherry-pick the stranded docs commit as
its own PR; count releases as `dev → main` promotions (this is #2); SemVer 0.x in `package.json` +
annotated tags, no CHANGELOG, no version in the UI; Thai PRs; Draft; bump + docs go to `dev` via a
prep PR before the release PR.

## Done

- `dev` @ `725d9a8`: `pnpm install --frozen-lockfile` / `tsc --noEmit` / `next build` all exit 0 —
  the "dev is broken" note in `HANDOFF-lovable-editors-round5` is closed (fixed by #133).
- **PR #135** (Draft → dev) `docs/lovable-port-workflow-rev3`: cherry-pick of `cd10709`; AGENTS.md
  conflict resolved by keeping the ADR 0075/0076 section **and** appending "Porting from Lovable".
  Old branch `docs/lovable-port-plan-rev3` can be deleted after merge (remote delete = R0, ask).
- **PR #136** (Draft → dev) `release/v0.2.0`: `package.json` 0.1.0 → 0.2.0, `docs/agents/versioning.md`,
  CLAUDE.md pointer under "Agent skills".
- Skill `~/.claude/skills/thunder-workflow/SKILL.md`: new "Release — promote dev → main" section +
  description updated.
- Release PR body drafted at `<scratchpad>/pr-release-v0.2.0.md` (placeholders `__COMMITS__`,
  `__REVERIFY__`) — **not opened yet**, waits for #135 + #136 to merge.

## Blocker found — `48df5e2` on `origin/dev` (Nie-ent, 13:56, pushed directly)

`src/app/globals.css`: `@import "tailwindcss" source(none); @source "../src";` — the path is
relative to `src/app/`, so it points at `src/src/` which does not exist → Tailwind scans nothing.
Also `--font-sans: "Manrope"` literal (next/font binds `--font-manrope`, so the literal never
resolves) and `--font-mono` removed.

Proof: `next build` still exits 0, but the emitted CSS drops from **144,980 B → 16,775 B**;
`.flex{` and `.bg-primary` occur 1/10 times before and **0/0** after. Every Tailwind utility on
`dev` is a no-op. Must not go to `main`.

Options for the owner (not acted on — shared branch):
1. Revert PR of `48df5e2` → dev (recommended: restores the verified state; ask Nie-ent what
   "as requested" meant before re-applying).
2. Fix-forward PR: `@source "../";` (or drop `source(none)`), `--font-sans: var(--font-manrope), …`,
   restore `--font-mono`.

## Next (owner)

1. Decide on the `48df5e2` blocker → PR → merge → re-run the three build commands.
2. Merge #135, #136.
3. Then Claude opens the release PR `dev → main` from the drafted body (fill in commit count,
   re-verification line).
4. After merge: `git tag -a v0.1.0 bca6937 -m "release v0.1.0 (#1, PR #118)"`,
   `git tag -a v0.2.0 <merge> -m "release v0.2.0 (#2)"`, push both — R0, ask first.

## Not verified

- No browser check this session (release PR states this; #133's unverified list stands).
- Thunder_Core prod parity for #66 guard / #75 bucket / probe+rendition columns not checked.

## Update — owner chose option 1

- **PR #138** (Draft → dev) `fix/revert-globals-css-source-none`: `git revert 48df5e2`. Build exit 0;
  emitted CSS back to 144,980 B, `.flex{` 1 / `.bg-primary` 10 — identical to `725d9a8`.
- Merge order now: #138 → #135 → #136 → re-verify → release PR.

## Update 2 — team fix chosen over revert

- Team pushed `ff1af619` on `fix/dev-broken-styles-and-deps` (PR #137, not Draft): plain
  `@import "tailwindcss"`, restores `.no-scrollbar`/`.progress-stripes`/`.stage-flow`, deletes
  `fix-conflicts.js`/`fix-sidebar.js`. Missing vs `725d9a8`: `--font-sans` var, `--font-mono`,
  `animate-grow-bar` (used by StatCardsRow), `.flash-outline` (unused, left out).
- Added `f884d1c` on that branch restoring the three. tsc 0 / build 0 / main CSS 143,124 B,
  `.flex{` 1, `.bg-primary` 10, `.animate-grow-bar` 1. Commented on #137; closed #138 (branch
  `fix/revert-globals-css-source-none` still on origin — delete is R0, ask).
- Waiting on owner: merge #137 → #135 → #136, then re-verify dev and open the release PR.

## Update 3 — release PR opened

- #137, #135, #136 merged into `dev` (HEAD `21b8968`). Re-verified: install/tsc/build exit 0,
  main CSS 143,124 B, `.flex{` 1 / `.bg-primary` 10 / `.animate-grow-bar` 1.
- **PR #139** (Draft, `dev → main`): `release v0.2.0: promote dev → main (#2 — …)`, 115 commits /
  13 PRs, Thai body per template.
- `1553c1b` the owner quoted is the revert commit on the closed #138 branch, not on dev — harmless.
- Remaining after owner merges #139: tag `v0.1.0` @ `bca6937`, `v0.2.0` @ merge commit, push (R0);
  fill row 2 of the table in `docs/agents/versioning.md`; optionally delete branches
  `fix/revert-globals-css-source-none`, `docs/lovable-port-plan-rev3` (R0).

## Update 4 — released

- #139 merged → `main` `66bea83`, deployed. Prod parity checked on ThunderCore
  (`sfiefevtxalqjizdkcsw`): activate guard, probe_verdict, rendition/transcode RPCs, media bucket
  without image/webp — all present.
- Tags on origin: `v0.1.0` → `bca6937`, `v0.2.0` → `66bea83` (owner approved; push came back
  "Everything up-to-date", owner had pushed them already).
- PR #140 (Draft → dev): release table row 2.
- Pending owner: merge #140; delete stale remote branches (list in chat, R0).
- Deleted remote: fix/revert-globals-css-source-none, release/v0.2.0, style/lovable; local stale branches removed. Team branch fix/dev-broken-styles-and-deps left for its owner.
