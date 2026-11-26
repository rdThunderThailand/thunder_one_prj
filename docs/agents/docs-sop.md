# Docs SOP — what to update, and when

Which document changes at which moment, so docs move with the code instead of after it. The repo's docs are
the source of truth; personal skills and agent settings point here rather than restating rules.

## Where each kind of document lives

| Document | Answers | Path |
|---|---|---|
| ADR | why this way, and what was not chosen | `docs/adr/NNNN-<slug>.md` — one folder, one numbering for every Workspace |
| Glossary | what a term means | `CONTEXT.md` (one file; see below) |
| Plan | what is left to do in multi-phase work | `docs/<workspace>/plan-*.md` |
| UAT checklist | what QA runs and what it found | `docs/<workspace>/uat-*.md` |
| Agent / process rules | how we work | `docs/agents/*.md` |
| Release log | what shipped in which version | GitHub Releases (`gh release list`); the table in `versioning.md` stops at `v1.0.1` |
| Session log | what happened in one working session | `.docs/SESSIONLOG-<topic>-<date>.md`, **local only, not committed** |

- `<workspace>` is the Workspace id from `src/config/apps.tsx` (`media-workspace`, `asset-intelligence`,
  `asset-workspace`, `people`, …), or `shell` for what every Workspace shares (auth, design system). Everything
  about one Workspace lives under its folder, with one sub-folder per area when an area has several files
  (`docs/media-workspace/channels/`, `…/layouts/`, `…/playlists/`). `docs/prototyping/` is the one folder
  outside this scheme: it is the seed for the PO prototype repo.
- Folder names are lowercase kebab-case with no spaces: versions are `v0`, `v1`, `v2`; phases are
  `phase-0`, `phase-1`. A skill's own output folder (`docs/superpowers/` and the like) is never created; its
  plan or spec goes to the Workspace folder as `plan-*.md` / `spec-*.md`.
- Every new ADR has `**Workspace:** <name>` under its Status line (`all (repo process)` when it is not about one
  Workspace).
- `CONTEXT.md` stays one file until a second Workspace becomes stable; then it splits into `CONTEXT-MAP.md` plus
  one `CONTEXT.md` per Workspace (`docs/agents/domain.md`).
- `.docs/` is git-ignored and holds nothing tracked. Its old files (session logs, checklists, handoffs, drafts)
  were removed from git with this SOP; history keeps them. The five that ADRs cite moved to
  `docs/media-workspace/player/` and `docs/adr/legacy/`; older docs that cite one of the others link to it
  at commit `65ea04da` on GitHub. Never `git add -f` a file there. Anything that must outlive the session
  goes into an ADR, a plan or an issue.

## Repo root and agent folders

The root holds config files and four documents only: `README.md`, `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`.
Any other document goes under `docs/`.

| Path | Committed | Holds |
|---|---|---|
| `AGENTS.md` | yes | Rules for every agent and contributor; the one place to add a rule |
| `CLAUDE.md` | yes | `@AGENTS.md` plus Claude-only pointers |
| `.agents/skills/` | yes | Project skills; the real files (Codex and most agents read here) |
| `.claude/skills/<name>` | yes | A symlink to `../../.agents/skills/<name>` (Claude Code reads only here) |
| `.claude/launch.json` | yes | Dev-server definition for the desktop app's preview |
| `.claude/settings.local.json`, `.claude/RESUME.md` | no | Personal settings and checkpoints |
| `.docs/`, `.superpowers/`, `.backups/` | no | Session logs, skill scratch output, local data dumps |

A new project skill goes in `.agents/skills/<name>/` with a symlink in `.claude/skills/`. Personal skills stay
in `~/.claude/skills/` or `~/.agents/skills/`, not in the repo.

## Per PR

In the same PR as the code, not a follow-up:

- [ ] A design fork was decided → new ADR, or an amendment section in the ADR it changes.
- [ ] A domain term was added, renamed or sharpened → `CONTEXT.md`.
- [ ] A plan step finished → mark it done in the plan.
- [ ] A UAT item's expected result changed → the checklist that QA will run next.
- [ ] A process rule changed → the file in `docs/agents/`.

The PR template carries this as one line ("Docs: … or N/A"); the reviewer checks it.

## Per release

Part of the release sequence in `docs/agents/versioning.md`:

- Release-prep PR: `package.json`; a **Stable Workspaces** row if this release makes one stable.
- Publish step: tag, GitHub Release with the Thai release note (grouped by `ws:*`), ClickUp comments.
- No `docs/record-*` PR.

## Per Workspace that becomes stable

- UAT checklist and its results under `docs/<workspace>/`.
- Row in **Stable Workspaces** (`versioning.md`), in the release-prep PR.
- When it is the second stable Workspace: split `CONTEXT.md` (above).

## Per session (agents)

- Write `.docs/SESSIONLOG-<topic>-<date>.md` locally when the session touched code.
- Move anything a teammate needs into an ADR, plan, issue or PR before ending.
