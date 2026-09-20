# Plan — Content library pages on the Lovable design system

Status: **complete** (2026-09-20 run-2 rework; see *Audit* below). Branch `style/lovable` (renamed from `style/media-library-lovable`,
base `style/media-workspace-tokens` → `dev`). Executes ADR 0076.
Reference: Lovable `e8b49026-3bd5-4a8f-b94c-aad813085d2c`; fact-finding in the 2026-09-19 session
(`lovable-vs-repo.md`, not committed). Previous handoff: `/private/tmp/HANDOFF-media-workspace-lovable-2026-09-19.md`.

## Decisions (owner, 2026-09-19, grilling)

| # | Decision |
|---|---|
| Q1 | Scope = content library only: Playlists / Layouts / Templates lists, Media detail, Media trash, New Layout modal + Template picker, Composition editor, Playlist editor (+ media picker), then preview chrome. Channels, Overview, Brand Assets, Publish dialogs: out. |
| Q2 | Treatment only — no new behaviour, no disabled placeholders. Gaps listed below for tickets. |
| Q3/Q10 | Copy primitives/patterns as pages need them; Lovable design system is the source for all future Media Workspace UI (ADR 0076 §1–2). |
| Q4 | App shell (sidebar/header/breadcrumb) untouched; differences are reported, not fixed. |
| Q6/Q12 | `(preview)` routes: chrome only, last, separate commit, every mode browser-verified. |
| Q7 | One commit per page; PR may be split (`lists` / `editors`) at PR time. |
| Q8/Q9 | Verify per page as it lands — owner pre-chose mode 1 (agent compares in the browser) for every step. 1440 primary, 1024 must not break. |
| Q11/Q18 | Tokens additive; base layer per ADR 0076 §5. |
| Q14 | Templates list page stays; styled with the Layouts-list treatment. |
| Q15 | No `/design-system` page. |
| Q16 | New deps: `@radix-ui/react-label`, `react-switch`, `react-alert-dialog` only. |
| Q17 | `Modal` → `Dialog`/`AlertDialog` inside ported surfaces. |
| Q19 | Composition editor: Lovable 3 columns, inspector swaps Layout ↔ Zone properties by selection; repo tools (align/lock/hide/snap, Template guard) move into the new toolbar row. |
| Q20 | Media picker → `Sheet` 400px with list rows + checkbox; keeps filter persistence, hide-already-added, Playlists tab. |
| Q21 | Media detail: Lovable layout; keep the existing placeholders (tab strip, Quick Actions, Usage "Coming soon") — style only. |
| Q22 | 30-day trash copy only if Thunder_Core has an auto-purge; check before writing it. |

## Audit (2026-09-20, owner + reviewer, from `git show --stat`)

The first execution run reported every step done; the diff says otherwise.

| Step | Reported | Actual on `style/lovable` |
|---|---|---|
| 0 | tokens, primitives, core.tsx, deps, AGENTS rule | **not done** — only `ui/lovable/badge.tsx` added; no dialog/alert-dialog/label/switch/textarea/skeleton/core.tsx, no new deps, no new tokens, no reduced-motion, no `text-sm` wrapper, no AGENTS rule |
| 1–3 | re-aligned to the real Lovable lists | **not done** — no new commit; the pre-existing guessed ports (`080de66`, `f311155`, `54672cf`) were re-reported. Playlists still has no list/grid toggle, Layouts grid card does not match |
| 4 | detail + trash | partial — `e599bd9` touches detail only (+79/−21); trash untouched |
| 5 | modal + picker | partial — `f0b693d` +23/−19 (diagram colours) |
| 6 | 3-column editor, toolbar, inspector swap | **mostly not done** — `6130701` +36/−30: inspector swap only; still the old `Card` 340/1fr/300, no toolbar row, no Layout Information card, `Modal` everywhere |
| 7 | editor + picker | partial — `c2edf75` picker only; `PlaylistEditor*`/`Playlist*Pane` untouched |
| 8 | preview chrome | partial — `823e5a6` +18/−16 colours |

Run 2 reworked every audited gap from the full Lovable page sources and re-ran mode-1 browser
comparison at 1440px and 1024px. The original run remains in history; the correcting commits are:

| Step | Run-2 evidence (`git show --stat`) |
|---|---|
| 0 | `9ef6ccc` — tokens, primitives, dependencies, wrapper and repository rule |
| 1 | `a494a65` — Playlists list/table/grid/dialog treatment |
| 2 | `dc6561b` — Layouts list/table/grid/dialog treatment |
| 3 | `0bf02ec` — Templates list treatment |
| 4 | `945f3f4` — Media trash and detail flows |
| 5 | `0108e6a` — New Layout and Template picker dialogs |
| 6 | `ae17cad` — Composition editor structure and inspector |
| 7 | `20655c6` — Playlist editor; `2816c16` — 1024px follow-up found by mode-1 verification |
| 8 | `2739dc2` — Layout modal and full playlist preview chrome |

Run-2 verification and the remaining intentional product-contract deltas are recorded in
`.docs/SESSIONLOG-lovable-content-library-run2-2026-09-20.md`.

## Sequence

0. **Foundation** — tokens (ADR 0076 §5), `prefers-reduced-motion`, deps (§6), copy `dialog`,
   `alert-dialog`, `label`, `switch`, `textarea`, `badge` (5 tones), `skeleton`, `core.tsx`
   (SearchInput/StatusBadge/IconButton/EmptyState/ErrorState/LoadingState), Button `icon-sm`;
   `text-sm` on the Media Workspace layout wrapper. Rule into `AGENTS.md`. `tsc`/`eslint` clean.
1. Playlists list — re-align `LibraryShell`/`LibraryChrome` against the real design (toolbar order,
   selection bar, rail 200px, table columns, row actions layout, trash view). Verify → fix shell first.
2. Layouts (compositions) list — same shell; grid card with zone-outline overlay; trash view.
3. Templates list — Layouts treatment.
4. Media trash + Media detail.
5. New Layout modal + Template picker (`Dialog`, two-step stays; card diagram on `bg-program`).
6. Composition editor (Q19) — largest; keep `useZoneHistory`, guards, Save split button.
7. Playlist editor + media picker (Q20).
8. Preview chrome (Q12) — `PlaybackPreviewModal`, `FullPreviewPage` header/aside/filmstrip only.
9. Docs: SESSIONLOG, update `plan-media-workspace-tokens.md` Status, this plan's Status.

Each step: commit → browser side-by-side (mode 1, pre-decided) → fix within the touched surface only.

## Feature gaps — Lovable has, repo lacks (tickets, not this branch)

Worth doing (A): toast + Undo via `sonner` (mount `<Toaster>`, small ADR) · Rename from list + dialog ·
Move-to-Folder dialog with search + bulk move in Playlists · `AlertDialog` for every remaining
`window.confirm` · Media detail Usage panel + More▾ (needs a usage RPC) · Playlists grid view ·
playlist-level Default Fit + Default Image Duration · Split Zone V/H + zone presets in the composition
editor · trash "30 days / n days left" (only with a real purge).

Not doing (B): in-page Publish dialogs (ver02 wizard owns publishing) · preview as in-page Dialog ·
Widgets / Zones (BETA) / Import Layout / Upload-New tab / Audio+Documents types · Storage Usage ·
extra summary cards needing new RPC fields · autosave label (ADR 0063 §2) · disabled Lock/Filters/
Apply-to-all placeholders · Safe Margin / Used Area / per-zone Loop+Transition (schema) ·
"Don't show this again".

## Repo behaviour that must survive every port

URL-synced list state + sortable headers · Mark as ready · Edit tags dialog · folder CRUD guards ·
shared-Template guard + fork (ADR 0052 §3) · undo history + ⌘Z · align/lock/hide/snap · 8-handle
resize · percent geometry · Save & Activate + disabled reasons · unsaved-leave confirm ·
revision-conflict card · BroadcastChannel preview handoff · picker filter persistence.
