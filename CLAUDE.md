@AGENTS.md

## Agent skills

### Issue tracker

ClickUp (space *Product: ThunderOne*) for intake up to *promoted*; GitHub Issues (`gh` CLI) for delivery (ADR 0119). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical vocabulary, plus `ws:*` Workspace labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Versioning & release

One SemVer for the whole app in `package.json` (`1.0.0` onward per ADR 0115); MAJOR only for Stable Workspaces; annotated tag + GitHub Release per release. See `docs/agents/versioning.md`.

### Git workflow

Squash into `dev`; `main` (release, hotfix) and back-merges take merge commits only; branch `<type>/<issue#>-<slug>` (ADR 0118). See `docs/agents/git-workflow.md`.

### Docs SOP

Which doc to update per PR, per release, per session. See `docs/agents/docs-sop.md`.
