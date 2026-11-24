# Git workflow

How a change gets from a branch into `dev` and `main`. Why: ADR 0118. Releases and hotfixes:
`docs/agents/versioning.md`. Written for people and agents; an agent follows it literally.

## Branches

| Branch | What it is | Who writes to it |
|---|---|---|
| `main` | what production runs (Vercel deploys on merge) | release PRs, hotfix PRs |
| `dev` | default branch, next release | everything else, through PRs |
| `<type>/<issue#>-<slug>` | one change | one person or one agent run |
| `hotfix/vX.Y.Z-<slug>` | a fix for `main`, cut from `origin/main` | one person or one agent run |
| `release/vX.Y.Z` | the version bump before a release | the person or agent preparing the release |

- `<type>` is a conventional-commit type: `feat fix refactor test docs chore build ci perf style`.
- Leave out `<issue#>-` when there is no issue. No tool or agent name in a branch name (`codex/`, `claude/`).
- `staging` (protected, last commit 2026-07-22) has no role in this workflow; its fate is in #432.
- Check the current branch before every commit; the checkout may have moved.

## Opening a PR

1. Branch from `origin/dev` (or `origin/main` for a hotfix).
2. PR title = conventional commit: `fix(media-workspace): open Publish menu on first click`. Into `dev` it
   becomes the squash commit, so write it as one. A hotfix adds its version: `fix(media-workspace): … (v1.0.1)`.
   Release PRs keep their own title (`docs/agents/versioning.md`).
3. Body from `.github/pull_request_template.md`. A PR from a ClickUp task carries `Ticket: <task url>` and
   `CU-<id>`.
4. Issue references: `Closes #N` only works on a PR into `dev` (the default branch). A hotfix PR into `main`
   says `Refs #N`; its back-merge PR says `Closes #N`. Use `Refs #N` when QA must retest before closing.
5. Add the `ws:*` label of each Workspace it touches.
6. Draft until verified on the layer the user uses.

## Keeping a branch current

Default: the **Update branch** button on the PR, or

```bash
git fetch origin && git merge origin/dev && git push
```

The extra merge commit disappears when the PR is squashed, and nothing is force-pushed.

Rebase only on a branch you own alone, and push with both guards:

```bash
git fetch origin && git rebase origin/dev && git push --force-with-lease --force-if-includes
```

(`git fetch` moves `origin/<branch>`, so `--force-with-lease` alone no longer protects commits someone else
pushed.) Never rebase, force-push or delete `dev` or `main`.

## Merging

| PR | Button |
|---|---|
| any branch → `dev` | **Squash and merge** |
| `main → dev` (back-merge) | **Create a merge commit** |
| hotfix → `main` | **Create a merge commit** |
| `dev → main` (release) | **Create a merge commit** |

`main` only ever takes merge commits, so there is one button to press there. The owner merges release, hotfix
and back-merge PRs.

## Repo settings this file assumes

Pending #432 (needs an org admin; until then, follow the table above by hand and delete the head branch after
merging):

- Merge commit and squash on; rebase-merge off.
- Squash commit title = PR title, message = blank.
- Automatically delete head branches on.
- Rulesets: `main` — PR required, no force-push, no deletion, merge commits only. `dev` — PR required, no
  force-push, no deletion.
- No required status check until CI exists (#431: install, `tsc`, `eslint`, `next build`).
