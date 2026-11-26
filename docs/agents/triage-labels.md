# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| --------------------------- | --------------------- | ----------------------------------------- |
| `needs-triage`              | `needs-triage`        | Maintainer needs to evaluate this issue   |
| `needs-info`                | `needs-info`          | Waiting on reporter for more information  |
| `ready-for-agent`           | `ready-for-agent`     | Fully specified, ready for an AFK agent   |
| `ready-for-human`           | `ready-for-human`     | Requires human implementation             |
| `wontfix`                   | `wontfix`              | Will not be actioned                      |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## Workspace labels

One label per Workspace in the `APPS` registry (`src/config/apps.tsx`), plus the shell. Same names as
ClickUp's Workspace field and the release-note sections (ADR 0119).

| Label | Workspace | `APPS` id / docs folder |
|---|---|---|
| `ws:media` | Media Workspace | `media-workspace` |
| `ws:asset` | Asset Workspace | `asset-workspace` |
| `ws:asset-intelligence` | Asset Intelligence | `asset-intelligence` |
| `ws:thunder-care` | ThunderCare | `thunder-care` |
| `ws:people` | People | `people` |
| `ws:customer` | Customer | `customer-workspace` |
| `ws:lead-approval` | Lead Approval | `lead-approval` |
| `ws:shell` | Thunder One shell (launcher, Mission Control, My Work, auth, settings) | `shell` |

`repo:core` marks work that needs a Thunder_Core change. When a PR adds a Workspace to `APPS`, create its
label with `gh label create ws:<short name>` and add a row here in the same PR. First-time setup: #432.

## Release targets

No version labels; the old `v1` label is not reused. A milestone named after a version (`v1.1.0`) may group
issues for planning. PRs don't get one: the version is chosen at release-prep (`docs/agents/versioning.md`).

