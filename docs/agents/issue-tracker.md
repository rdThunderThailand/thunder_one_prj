# Issue tracker: ClickUp for intake, GitHub for delivery

Why: ADR 0119. Labels and milestones: `docs/agents/triage-labels.md`.

## Where a ticket lives

| Kind of work | Starts in | Moves to |
|---|---|---|
| Idea, customer request, product decision | ClickUp space **Product: ThunderOne** (Raw Capture / Customer Requests) | GitHub issue when the task reaches **promoted** |
| Bug or request from a customer, PO, sales | ClickUp **Raw Capture** | GitHub issue after triage, if it needs code |
| Bug found by QA (UAT or regression) | GitHub issue, directly (`.github/ISSUE_TEMPLATE/bug.md`) | — |
| Engineering work with no product question (refactor, CI, docs) | GitHub issue | — |

ClickUp gets no delivery list or delivery statuses; a task is done at *promoted*. Pace holds no
ThunderOne tickets.

## Promoting a ClickUp task

1. Open a GitHub issue with `.github/ISSUE_TEMPLATE/from-clickup.md`; its first line is
   `ClickUp: <task url>`.
2. Paste the issue URL into the ClickUp task (comment or Linked Doc field), then set it to *promoted*.
3. PRs for the issue carry `Ticket: <task url>` and `CU-<task id>` in the body.

## Closing the loop

- A PR closes its issue with `Closes #N` only when it merges into the default branch, `dev`. A hotfix PR
  targets `main`, so it says `Refs #N`, and the back-merge PR (`main → dev`) carries `Closes #N`.
- Use `Refs #N` everywhere when QA must retest on prod before the issue closes; close it by hand with a comment
  naming the retest once it passes.
- At release, the publish step in `docs/agents/versioning.md` comments "ออกใน vX.Y.Z" on every ClickUp task
  linked from the shipped PRs.

## Tools

- GitHub: the `gh` CLI for every operation.
- ClickUp: the ClickUp connector. Creating, updating or commenting on a task is outward-facing; an agent asks
  first unless the step is part of an approved release publish.
- ClickUp's GitHub integration is not connected yet (2026-11-20). Until it is, the `Ticket:` URL is the link;
  `CU-<id>` starts linking automatically once the owner connects it.

<!-- Skill hooks below: read by the engineering skills (/triage, /wayfinder, …). Same text as before ADR 0119. -->

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue. Skills never write to ClickUp; ClickUp changes are a person's step or an approved release step.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
