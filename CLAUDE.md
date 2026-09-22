@AGENTS.md

## Agent skills

### Issue tracker

GitHub Issues (`gh` CLI), inferred from this repo's `origin` remote. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical vocabulary — no repo-specific overrides. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Versioning & release

SemVer `0.x` in `package.json`; minor per `dev → main` promotion, annotated tag `vX.Y.Z` on `main`. See `docs/agents/versioning.md`.
