# 0118 — Squash into `dev`; `main` takes merge commits only

Status: accepted (2026-11-20, owner decisions in a grilling session on repo hygiene after v1.0.0; revised the
same day after review).
**Workspace:** all (repo process)

## Context

- The repo allowed merge commits, squash and rebase-merge, with no rule for which to use. `dev`'s first-parent
  history since 2026-10-01 is 147 "Merge pull request" commits; feature commits sit behind them.
- Head branches were never deleted after merge (`delete_branch_on_merge` off): 229 branches on `origin`.
- Branch names carried agent names (`codex/`, `claude/`, `cursor/`: 15 branches), which says who typed the
  code, not what the branch is for.
- `dev` and `main` share history through release PRs (`dev → main`) and back-merges (`main → dev` after a
  hotfix). Squashing a release would give the two branches different commits for the same change, and the
  next release PR would conflict.
- Protection: `main` has a classic branch protection rule, `dev` has none, a stale `staging` branch (last commit
  2026-07-22) is protected, and there are no rulesets. The everyday account has `push`, not `admin`, so repo
  settings and rulesets need an org admin. There is no CI.

## Decision

1. **Merge method by target.**

   | PR | Method |
   |---|---|
   | feature / fix / docs / chore → `dev` | squash |
   | back-merge `main → dev` | merge commit |
   | hotfix → `main` | merge commit |
   | release `dev → main` | merge commit |

   `main` takes merge commits only, so a release can never be squashed by a mis-click. Rebase-merge is off for
   the repo. The squash commit takes the PR title as its title and an empty body (GitHub appends `(#N)`); the
   PR keeps the detail.
2. **PR titles are conventional commits** (`type(scope): summary`); the types are listed in
   `docs/agents/git-workflow.md`. A hotfix title adds its version (`fix(scope): … (v1.0.1)`). Release PRs keep
   the release title from `docs/agents/versioning.md`.
3. **Branch names** are `<type>/<issue#>-<slug>` (`fix/422-split-menu`), or `<type>/<slug>` when there is no
   issue. Extra types: `hotfix/vX.Y.Z-<slug>`, `release/vX.Y.Z`. No tool or agent name in a branch name.
4. **A branch that falls behind `dev` takes `dev` in by merge** (the PR's *Update branch* button). The extra
   merge commit vanishes in the squash and nothing is force-pushed. Rebasing is allowed only on a branch one
   person owns, pushed with `--force-with-lease --force-if-includes`. `dev` and `main` are never rebased or
   force-pushed.
5. **Head branches are deleted on merge** (repo setting). Branches already merged before this ADR are removed
   once, from a list the owner approves first.
6. **Rulesets** on `main` (PR required, no force-push, no deletion, merge commits only) and `dev` (PR required,
   no force-push, no deletion). No required status check until CI exists (#431). Settings, rulesets, the old
   classic rule on `main` and the `staging` branch are tracked in #432.

## Not chosen

- **Merge commits everywhere (as before).** Keeps every branch commit; the first-parent history on `dev` stays
  a list of PR numbers and every branch's "wip" commits stay forever.
- **Rebase-merge for feature PRs.** Linear, but replays every commit of the branch onto `dev`; the history gets
  longer, not cleaner.
- **Squash everywhere, including `dev → main`.** Cleanest log, but `main` and `dev` diverge after every release
  and each release would need a manual reconciliation.
- **Squash for hotfixes into `main`.** One commit per hotfix, but `main` would need two buttons, and the wrong one
  on a release PR causes the divergence above. A hotfix branch is short; its few commits are acceptable.
- **Rebase as the default way to catch up.** It is the only step in the workflow that can lose work, and under
  squash it buys nothing.
- **Linear-history rule on `dev`.** Would forbid the back-merge commit the hotfix flow needs.

## Consequences

- One PR into `dev` is one commit on `dev`; `git log --first-parent` on `dev` reads as a changelog of PR titles.
- A bad PR title is now a bad commit message. Fix the title before merging.
- `Closes #N` works only on PRs into `dev` (the default branch); a hotfix closes its issue through the
  back-merge PR.
- Until #432 is done the rules are followed by hand; nothing enforces them.
- Procedure for people and agents: `docs/agents/git-workflow.md`.
