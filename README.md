# ThunderOne

The ThunderOne web app: one shell with several Workspaces (Media, Asset Intelligence, People, Thunder Care,
…), backed by the Thunder_Core API. Next.js (App Router) + TypeScript + Tailwind CSS, managed with **pnpm**.
Released versions and their notes are on GitHub Releases; the versioning rules are in
`docs/agents/versioning.md`.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The browser talks to Thunder_Core through
`/api/proxy`; `CORE_API_URL` decides which Core deployment that is (`/api/proxy/__config` shows it).

## Checks

```bash
pnpm lint                      # eslint (next build does not run it)
pnpm build                     # type-check + production build
node path/to/file.check.mts    # one logic check; there is no test runner by design
```

## Where things are

| Path | What it holds |
|---|---|
| `AGENTS.md` | Rules for every coding agent and contributor. `CLAUDE.md` imports it and adds Claude-only pointers. |
| `CONTEXT.md` | Glossary: what each domain term means. |
| `docs/adr/` | Decisions (one numbering for the whole repo). |
| `docs/agents/` | How we work: git workflow, versioning, issues and labels, docs SOP. |
| `docs/<workspace>/` | Plans, specs, UAT checklists for one Workspace (`media-workspace`, `asset-intelligence`, `people`, …). |
| `docs/shell/` | The shell shared by every Workspace: auth, design system. |
| `.agents/skills/` | Project skills for coding agents. `.claude/skills/` holds symlinks to them for Claude Code. |
| `.github/` | PR and issue templates. |
| `src/app/` | Routes only; they compose features. |
| `src/features/<workspace>/<area>/` | The code for one Workspace area; shell features (`auth`, `profile`, `governance`, …) sit at `src/features/<feature>/`. Most have a README. |
| `src/components/` | Shared UI (`ui/`) and the app shell (`layout/`). |
| `src/config/` | App registry (`apps.tsx`), navigation, RBAC, env access. |
| `src/lib/api/` | Browser-side HTTP clients (`client.ts`, `media-api.ts`) used by features' `services/`. |
| `src/lib/core/` | Server-only calls straight to Core (`core-get.ts`; needs `CORE_API_KEY`). |
| `src/design-system/` | Copies of the ThunderOne theme; never edit them by hand (`AGENTS.md`). |

Local only, never committed: `.env.local`, `.docs/` (session logs), `.backups/`. The full list and the rules
for adding documents are in `docs/agents/docs-sop.md`.
