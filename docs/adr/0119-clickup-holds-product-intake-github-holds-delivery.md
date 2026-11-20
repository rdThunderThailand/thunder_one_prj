# 0119 — ClickUp holds product intake up to *promoted*; GitHub Issues hold delivery

Status: accepted (2026-11-20, owner decisions in a grilling session on repo hygiene after v1.0.0).
**Workspace:** all (repo process)

## Context

- Work for this app was tracked in three places: GitHub Issues (`docs/agents/issue-tracker.md`, QA's UAT bugs
  #413–#415, #422), ClickUp, and Pace (Asset Workspace stage 0 tickets).
- ClickUp space **Product: ThunderOne** is a product pipeline, not a delivery board: Idea Inbox → By Workspace →
  Prioritized (Now / Next / Later) → Ready for Product. Task statuses run captured → needs clarification →
  prioritized → **promoted** (done) / parked / dropped. There is no QA, UAT or bug list.
- The two systems were not linked: one PR body in 200 mentioned ClickUp, no commit carried a task id, and the PR
  template's `Ticket:` line was never filled. A ClickUp task linked to its GitHub issue only by a pasted URL.
- ClickUp's GitHub integration is not connected. When connected, a task id written as `CU-<id>` (or `#<id>`) in
  a PR title, PR body, branch or commit links that GitHub activity to the task. Moving a task on PR merge needs
  ClickUp Automations (Business plan); this ADR does not rely on it.
- The app now has seven Workspaces, but GitHub had one Workspace label (`media-workspace`) and ClickUp's
  Workspace field lists a different set (Media, Asset, Customer, People, Finance, Platform).

## Decision

1. **ClickUp owns intake and product decisions** — ideas, customer requests, decisions, priority — up to the
   status **promoted**. No delivery list or delivery statuses are added to ClickUp.
2. **GitHub Issues own delivery** — spec, code, PR, release — from *promoted* on. At promotion a developer (or an
   agent) opens the GitHub issue and links both ways: the issue body starts with `ClickUp: <task url>`, and the
   task gets the issue URL.
3. **Where a bug starts.** QA files bugs as GitHub issues directly (they need repro steps next to the code, and a
   PR closes them). Bugs and requests from customers, PO, sales or anyone outside the delivery team go to
   ClickUp **Raw Capture** and are triaged from there.
4. **Pace holds no ThunderOne tickets.** It stays for check-ins and personal tasks. Asset Workspace tickets still
   in Pace move to ClickUp when that work starts.
5. **PR bodies carry the ticket.** A PR that comes from a ClickUp task has `Ticket: <task url>` and `CU-<id>` in
   its body, so it links today by hand and automatically once the integration is connected. Connecting the
   integration is the owner's step (ClickUp workspace admin, #432); no Automations.
6. **One Workspace list everywhere.** The `APPS` registry in `src/config/apps.tsx` is the list. GitHub labels are
   `ws:<short name>` (`ws:media`, `ws:asset`, `ws:asset-intelligence`, `ws:thunder-care`, `ws:people`,
   `ws:customer`, `ws:lead-approval`, plus `ws:shell` for the shell); `docs/agents/triage-labels.md` maps each to
   its `APPS` id. The old `media-workspace` label becomes `ws:media`. ClickUp's Workspace field and release-note
   sections use the same Workspace names; ClickUp "Asset" means Asset Workspace. Labels and the ClickUp field are
   set up once in #432.
7. **No version labels.** The `v1` label is not reused. A GitHub milestone named after a version may group
   *issues* for planning, but PRs are not tagged with one: the version is chosen at release-prep from the diff,
   so a PR cannot know it.

## Not chosen

- **ClickUp only.** Loses PR ↔ issue links and auto-close by `Closes #N` while the integration is off, and puts
  repro steps and root causes away from the code.
- **GitHub only.** PO and management would have to work in GitHub, and the product pipeline (Now / Next / Later)
  has no home there.
- **Every bug through ClickUp first.** One intake, but QA's bugs would need a ClickUp list nobody has built and a
  copy step into GitHub before anyone can fix them; QA already writes good GitHub issues.

## Consequences

- A ClickUp task is "done" at *promoted*; shipping is visible in GitHub (closed issue, release). At release time
  an agent comments "ออกใน vX.Y.Z" on ClickUp tasks linked from the shipped PRs, under the same approval as the
  tag (`docs/agents/versioning.md`).
- Procedure: `docs/agents/issue-tracker.md` (flow, templates) and `docs/agents/triage-labels.md` (labels,
  milestones).
