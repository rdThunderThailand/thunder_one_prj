# PO prototype environment: template

These are the files to copy into the root of a new repo, `thunderone-prototypes`. They give any coding agent
(Grok Bot driving a Cursor cloud agent, ChatGPT Codex, GitHub Copilot, Claude Code) the same design-system and editing rules
used in `thunder_one_prj`. Proposal and rationale: `../proposal-po-ai-prototype.md`.

| File | Read by | Purpose |
|---|---|---|
| `AGENTS.md` | Codex, Copilot, Claude (via `CLAUDE.md`) | the only shared rulebook: read-then-plan, edit-don't-copy, design system, conventions, checks, handoff |
| `CLAUDE.md` | Claude Code | `@AGENTS.md`, nothing else, so rules live in one place |
| `.github/pull_request_template.md` | PO + agent → dev | handoff note: flow, states, missing components, open questions |
| `docs/po-guide.md` | PO | the loop in Thai, plus brief and edit templates |
| `scripts/sync-from-thunder-one.sh` | dev | copies DS, primitives, nav, `CONTEXT.md`, `domain.ts`, skills from the product |
| `scripts/prototype-guard.mjs` (+ `.check.mts`) | CI + agent | fails on raw palette/hex/`dark:`, raw form elements, direct antd icons, synced-file edits, copy-style names |
| `.github/workflows/prototype-checks.yml` | CI | guard + self-test + design-system drift + build |
| `.cursor/environment.json` | Cursor cloud agent | runs `npm ci` before the agent starts, so it can run the guard and build |

Deliberately left out of the agent's context: risk tags, migrations, prod traps, git/PR rules,
model switching, SESSIONLOG, delegation, and `MEMORY.md`. That memory holds prod details and test
credentials and must never be copied.

## Setup (dev, once)

Creating the repo and the Vercel project and pushing are R0: get approval first.

1. Create the `rdThunderThailand/thunderone-prototypes` repo. (R0)
2. Scaffold Next.js on the product's versions (`next@16.2.11`, `react@19.2.4`, Tailwind v4 via
   `@tailwindcss/postcss`, TypeScript) with the `@/*` → `src/*` path alias. Use **npm** and commit
   `package-lock.json`: CI runs `npm ci` with the npm cache.
3. Install the primitives' runtime deps: `@radix-ui/react-{alert-dialog,checkbox,dialog,dropdown-menu,label,popover,select,slot,switch,tabs}`,
   `class-variance-authority`, `clsx`, `tailwind-merge`, `@ant-design/icons`, `tw-animate-css`,
   `recharts@^3.10.1` (the synced chart primitives import it, and `next build` type-checks them).
4. Copy every file in this folder except this README into the repo root (including `.github/` and
   `.cursor/`).
5. On a `sync/<date>` branch run `scripts/sync-from-thunder-one.sh ../thunder_one_prj` (needs
   `rsync`). It takes the skill from `.agents/skills/thunderone-ui`, falls back to
   `.claude/skills/thunderone-ui` with a warning, and writes it to both paths. Commit and open a PR.
6. Add `src/app/layout.tsx`: import `./globals.css` and bind the fonts with `next/font/google` like
   the product: `Manrope` → `--font-manrope`, `Noto_Sans_Thai` → `--font-noto-sans-thai`,
   `Geist_Mono` → `--font-geist-mono`, all three variables on `<html>`. Add a home page listing the
   prototypes.
7. Connect Vercel (needs the rdThunderThailand account; R0): framework preset **Next.js**, build
   `npm run build`, install `npm ci`, no env vars. Previews are behind Vercel Authentication by
   default, so the PO must get in one of two ways: a seat on the Vercel team, or Deployment
   Protection → **Protection Bypass for Automation** / a shareable link for this project only.
   Without one, the PO (and Grok Bot's browser) stops at a Vercel login page.
8. Branch protection on `main`: require the `prototype-checks` status check and one review; only
   devs merge.
9. Give the PO access, one of:
   - **Grok Bot (Option 1c):** the PO's own Grok Bot connects GitHub with access to this repo only;
     it hands each brief to a Cursor cloud agent, which reads `AGENTS.md`, runs
     `.cursor/environment.json`, and opens or updates the PR.
   - Codex: connect the GitHub repo.
   - Copilot coding agent: assign issues.

## Component source requirement

This template now targets the consolidated shared UI: `ui/Input` is the bare input and
`ui/TextField` is the label/error composite (product ADR 0106); `ui/EmptyState` also exports
`ErrorState`. SearchInput, Skeleton and ProgressBar use canonical `ui/` paths. Compatibility
aliases remain in the product, but the guard directs new prototypes to the canonical paths.

Input appearance follows owner-approved ADR0113: original~42px field, radius12px, no shadow; TextField/SearchInput share it. Keep explicit compact sizes with py-1.

`ui/Tabs` exports compound Radix components with segmented/underline presentation (product ADR 0107);
the former data-driven `items` API is removed. Sync a source containing this contract as well.

`ui/Dialog` is the shared Radix foundation and `ui/Modal` composes it with the existing controlled
Modal API (product ADR 0108). `lovable/dialog` remains a product compatibility re-export.

`ui/Badge` also contains the legacy tone variants and StatusBadge; canonical Badge defaults to dot,
while the legacy adapter defaults to primary. `ui/Tag` is the neutral taxonomy composite (ADR 0109).
Badge/Tag defaults are owner-approved10px (ADR0111); explicit caller sizes remain. The upstream full typography scale is separate.

`ui/Button` now owns the Slot/ref renderer and helper APIs; the legacy path re-exports it. ADR0110
is an owner-authorized local option A preview:32px/radius12px/text14px, pending visual acceptance.
It is not a released source contract until the corresponding product changes are accepted/merged.

Sync the reviewed product source containing these changes before using this template. An older
checkout where `ui/Input` still requires `label`, or without `ui/TextField`, is incompatible.
During local development pass the consolidation worktree explicitly to the sync command; after
merge use the corresponding updated product checkout. Uncommitted local changes are not a
published source revision, and `SYNCED_FROM` records HEAD only. This guard update does not sync
components, create a prototype repo or establish a deployed prototype/build result.

## Keeping it in step with the product

- Re-run the sync on a `sync/*` branch whenever the design system, primitives, nav or glossary
  change. The guard rejects synced-file edits on any other branch.
- When `AGENTS.md` in `thunder_one_prj` changes its design-system section, update the matching
  section here by hand. It is adapted, not copied.
