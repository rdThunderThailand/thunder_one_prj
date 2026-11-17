# Plan — v1.0 Media P0 blockers

Source: issue-checker brief of 2026-11-17 (read-only code analysis, nothing reproduced). Decisions grilled
2026-11-17, owner: "as recommended" on every question.

**Scope of v1.0:** full production release of ThunderOne / Media Workspace to every tenant. Player updates
stay on the `pilot` ring with devices chosen by hand (ADR 0028 amendment 5); the `production` ring stays
shut. Core manifest signing (Thunder_Core#363) is out of v1.0.

Rules for every step: one branch from `dev` per item, Draft PR, no merge, no issue close or comment without
the owner's OK. Repro runs on deployed develop (`thundercoredev.vercel.app`, tenant Thunder Enterprise
Master), never prod. Ask before every browser verification that closes an item. Ask Thai or English for
each PR.

## Order

| # | Item | Change | Where |
|---|---|---|---|
| 1 | Edit Program can't publish (layout programs) | Root cause confirmed (repro below). Keep the rule "Layout must be Active". (a) Errors: `useProgramEdit.run()` passes the message through `classifyApiError` (keep the `[part]` / `isStale` parsing); add cases to `api-error.ts`, before the generic `Invalid input:` bucket, for "composition is not active", "zone(s) … are unbound" and "produced zero resolvable snapshot items" — Thai, says what to fix. The wizard gets them too. (b) Pre-check: one pure function `status !== "active"` → Publish disabled with a reason and a link to the Layout; status comes from `use-content-summary.ts` (`kind: "layout"`, add `status`), which already follows the current `state.content.compositionId`, so a Layout changed on the Edit page is covered. (c) Same function in `CompositionEditorHeader.tsx:128-134` (today it blocks only `draft`, so Inactive passes and fails at Core) and the `CompositionPickerModal` filter. One `.check.mts` including the Inactive case. The pre-check covers only "Layout not Active"; every other Core refusal (targets, assets, past end) relies on the mapped error. | `publications/hooks/useProgramEdit.ts:88-101`, `src/lib/api/api-error.ts:225-234`, `publications/hooks/use-content-summary.ts`, `publications/components/PublicationEditPage.tsx`, `compositions/components/CompositionEditorHeader.tsx`, `CompositionPickerModal.tsx` |
| 2 | New playlist from Create can't be saved | Repro first. If it is the empty name: show the reason on the disabled Save (`PlaylistEditorHeader.tsx:173`) and focus the name field (no default name). No change to the save sequence: the retained `idempotencyKey` already makes a second Save update the same playlist (`usePlaylistEditorRow.ts:31,88`, `media_playlist_upsert`). No rollback, no new Core RPC. | `playlists/components/PlaylistEditorHeader.tsx:173` |
| 3 | Overlapping zones (#334) | Option A: overlap is banned. The Layout editor already marks overlapping zones and disables Save (`LayoutCanvas.tsx:105-107`, `LayoutEditorPage.tsx:172-179`); Core refuses the same geometry. Repro #334's steps on develop (Chrome zoom 125% + canvas zoom 125%, then 100% / 75%) to find how QA reached Save on prod (old build, or rounding that slips past the check). If Save stays disabled: spec / TC-P018 only, no code. Core unchanged. No new ADR (ADR 0044 §3). | `layouts/geometry.ts`, `layouts/components/LayoutEditorPage.tsx` |
| 4 | Equal-priority programs (#336) | Keep ADR 0068 (`merged_loop` for flat same-tier overlaps). No code. Spec text changes only. | — |
| 5 | Player manifest signing (Core#363) | Out of v1.0, backlog. Release note line. | — |

## Item 1 repro (2026-11-17, deployed develop, tenant Thunder Enterprise Master)

- Program `zz-mw003-zones` (`af4990f3…`, Draft, 1 Channel, from 27/11/2026) bound to Layout `zz-mw003-zones`,
  which is **Draft** (2/2 zones have content). Edit page → Publish → confirm.
- `POST /media/publications/af4990f3…/activate` → **400** `{"error":"Invalid input: composition is not active —
  activate it before publishing"}`. The Program stays Draft (nothing published).
- The UI: the confirm dialog stays up with no feedback until the response, then closes and a raw English
  banner shows Core's message (`PublicationEditPage.tsx:71-75,172-178`). Nothing before the click says the
  Layout is not Active, and there is no link to the Layout.
- **Root cause confirmed:** the brief's hypothesis. Core's rule works as designed; the Edit page has no
  pre-check and shows Core's text raw.
- The pre-check needs no new fetch for the stored Layout: `detail.composition.status` is already loaded
  (`types/index.ts:194`). An Active Layout is already complete (Core refuses to activate one with unbound
  zones), so `status === "active"` covers both conditions. A Layout picked on the Edit page via Change
  Layout needs its status from the picker.
- Seen in passing (not item 1, not changed): on a published Layout Program, "Publish changes" stays
  disabled until a Program field changes (`PublicationEditPage.tsx:155`), so Layout drift cannot be
  pushed from the Edit page; the detail page's "เผยแพร่ซ้ำ" button does it (ADR 0049 §7).

## Owner-approved drafts (prepared by Claude, sent only after OK)

- Product Spec amendments in English (spec lives in Google Docs, not in a repo): §4.3 / TC-P018 (overlap
  banned, cite ADR 0044 §3) and §4.13 item 14 / TC-P031 (equal priority, flat content merges into one loop,
  a Layout program takes the screen by latest `activated_at`, cite ADR 0068). File: `.docs/`.
- Comments: #334 (decision A, closes after the FE PR merges and the spec is updated), #336 (spec follows
  ADR 0068, closes once the spec is updated), Core#363 (out of v1.0, its gate was removed by amendment 5).
- New issues for items 1 and 2 once the root cause is confirmed; PRs use `Closes #N`.
- Release note: "Player updates are checksum-only (unsigned) in v1.0."

## Out of v1.0

- A Zone bound to an empty Playlist publishes silently and airs blank: Core checks only that every Zone is
  bound, and refuses a composition publish only when all Zones resolve to zero items
  (`20261113075848_native_canvas_size.sql:305-310`). Enforcing "every zone has content" in Core is a
  separate design decision.

Plan reviewed by /scrutinize 2026-11-17 (verdict fix-then-ship); items 1–3 above carry its corrections,
accepted by the owner.

## Done when

- Item 1: publishing an edited Layout program succeeds or says exactly what to fix (verified in the browser).
- Item 2: a playlist created from the global Create flow saves with items; failures show a specific message.
- Item 3: preview, save and Core agree; spec and TC-P018 updated.
- Item 4: spec and TC-P031 updated.
- Item 5: #363 re-scoped; release note written.
