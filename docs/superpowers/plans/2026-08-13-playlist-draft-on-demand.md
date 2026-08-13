# Playlist Draft-On-Demand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a playlist draft something the operator creates deliberately with Save Draft — never a side effect of pressing Next — and make those drafts visible and editable on `/playlists` while staying out of the publication content picker.

**Architecture:** Walking the wizard becomes `localStorage`-only again. `usePlaylistDraftSave.persistDraft` stays, but only `saveDraft` and `handleSubmit` call it. `media_playlists_list` gains an opt-in `p_include_drafts` parameter so one RPC can serve the management page (drafts shown) and the publication picker (drafts hidden).

**Tech Stack:** Next.js App Router, React client components, zustand + persist, Supabase plpgsql RPCs called through a Thunder_Core route proxy.

**Spec:** `thunder_one_prj/docs/superpowers/specs/2026-08-13-playlist-draft-on-demand-design.md`

**Two repositories:**
- `/Users/arty/Desktop/Thunder/project/Thunder_Core` — branch `feat/thunderOne` (Tasks 1-2)
- `/Users/arty/Desktop/Thunder/project/thunder_one_prj` — branch `feat/playlist` (Tasks 3-7)

## Global Constraints

- **Do NOT apply the migration.** Task 1 writes the file only. Applying to production is R0 and needs the repo owner's explicit approval, which happens outside this plan. Any task that appears to require a live schema change must stop and report BLOCKED.
- Migrations are applied through the Supabase MCP `apply_migration` tool only, never `supabase db push` (migration history has drifted in `Thunder_Core`).
- The migration file must match what eventually gets applied, byte for byte.
- Commit messages: `<type>(scope): <imperative subject>`, subject ≤ 72 chars. **Never** add a `Co-Authored-By` trailer and never mention AI anywhere in a commit.
- Never claim a command passed without running it and seeing the output.
- `thunder_one_prj` typecheck: `npx tsc --noEmit` (no npm script). Lint: `npx eslint src/features/playlists`. Both clean at baseline.
- Check files: `node <path>.check.mts`, printing `<filename> OK` or `— all assertions passed`. A `MODULE_TYPELESS_PACKAGE_JSON` warning is expected noise.
- This repo has no test runner by design. Bare `node:assert` `*.check.mts` files cover pure logic only; React and network code has no automated coverage and must not be described as verified beyond typecheck and lint.
- No `any`, no dead code, files ideally ≤ 300 lines, new code reads like its neighbours.
- ESLint forbids synchronous `setState` in a `useEffect` body and inside anything it awaits.
- No new dependencies in either repo.

---

### Task 1: Migration — `media_playlists_list` gains `p_include_drafts`

**Repo:** `Thunder_Core`

**Files:**
- Create: `supabase/migrations/087_playlists_list_include_drafts.sql`

**Interfaces:**
- Produces: `media_playlists_list(p_tenant_id uuid, p_include_drafts boolean DEFAULT false)`

**Background the implementer needs:** the live function was dumped from production before this plan was written; the body below is that dump with one predicate changed. Do not re-derive it or "improve" it — the only intended difference is the WHERE clause and the new parameter.

`CREATE OR REPLACE FUNCTION` does **not** replace a function when a parameter is added. It creates an overload, and every existing one-argument call then resolves ambiguously and fails. The `DROP FUNCTION` line is therefore load-bearing, and its signature must match the live one exactly: `media_playlists_list(p_tenant_id uuid)`.

- [ ] **Step 1: Write the migration**

```sql
-- 087_playlists_list_include_drafts.sql
--
-- A playlist draft is now something the operator creates deliberately with Save Draft
-- (docs/adr/0014 in thunder_one_prj), so drafts must be listable on the playlists
-- management page. They must still stay out of the publication content picker, which
-- calls this same function — hence an opt-in parameter rather than dropping the filter.
--
-- DROP first: CREATE OR REPLACE does not replace when a parameter is added, it overloads,
-- and the existing single-argument callers then fail as ambiguous.
--
-- Rollback: DROP FUNCTION public.media_playlists_list(uuid, boolean); then re-create the
-- single-argument version from migration 083.

DROP FUNCTION IF EXISTS public.media_playlists_list(p_tenant_id uuid);

CREATE OR REPLACE FUNCTION public.media_playlists_list(
    p_tenant_id uuid,
    p_include_drafts boolean DEFAULT false
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_result jsonb;
BEGIN
    SELECT COALESCE(jsonb_agg(p ORDER BY p->>'name'), '[]'::jsonb) INTO v_result
    FROM (
        SELECT jsonb_build_object(
            'id', pl.id,
            'name', pl.name,
            'status', pl.status,
            'item_count', (SELECT count(*) FROM media_core.playlist_items pi WHERE pi.playlist_id = pl.id),
            'created_at', pl.created_at,
            'metadata', pl.metadata,
            'created_by', CASE WHEN cu.id IS NULL THEN NULL ELSE jsonb_build_object(
                'id', cu.id,
                'display_name', COALESCE(
                    NULLIF(BTRIM(cu.display_name), ''),
                    NULLIF(BTRIM(CONCAT_WS(' ', cu.first_name, cu.last_name)), ''),
                    cu.email
                )
            ) END,
            -- An explicit pick wins; otherwise the first item stands in, resolved on read so
            -- reordering items never writes back. position is unique per playlist today —
            -- id is only a tiebreak in case that ever stops being true.
            'cover_asset_id', COALESCE(
                NULLIF(pl.metadata -> 'info' ->> 'cover_asset_id', '')::uuid,
                (SELECT pi.media_asset_id
                 FROM media_core.playlist_items pi
                 WHERE pi.playlist_id = pl.id
                 ORDER BY pi.position, pi.id
                 LIMIT 1)
            )
        ) AS p
        FROM media_core.playlists pl
        LEFT JOIN public.users cu ON cu.id = pl.created_by
        WHERE pl.tenant_id = p_tenant_id
          AND pl.kind = 'user'
          AND (p_include_drafts OR pl.status <> 'draft')
    ) rows;

    RETURN v_result;
END;
$function$;
```

- [ ] **Step 2: Confirm you did NOT apply it**

Run: `git -C /Users/arty/Desktop/Thunder/project/Thunder_Core status --short`
Expected: the new migration file shows as untracked/modified and nothing else. Do not run `apply_migration`, `supabase db push`, or any psql command against production.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/087_playlists_list_include_drafts.sql
git commit -m "feat(playlists): add p_include_drafts to media_playlists_list"
```

Report explicitly in your report: **the migration is written but NOT applied.**

---

### Task 2: Route passes `include_drafts` through

**Repo:** `Thunder_Core`

**Files:**
- Modify: `src/app/api/core/v1/media/playlists/route.ts` — the `GET` handler

**Interfaces:**
- Consumes: `media_playlists_list(p_tenant_id, p_include_drafts)` from Task 1.
- Produces: `GET /api/core/v1/media/playlists?include_drafts=true`

**Background:** the current handler is five lines and passes only `p_tenant_id`. Absent or any value other than the string `"true"` must mean false — this is the guard that keeps drafts out of the publication picker, so it fails closed by construction rather than by the caller remembering.

- [ ] **Step 1: Read the current handler**

Read `src/app/api/core/v1/media/playlists/route.ts` in full before editing; the file also has a `POST` handler that must not change.

- [ ] **Step 2: Add the parameter**

Replace the `GET` handler body so it reads the query string and forwards the flag:

```ts
export async function GET(request: Request) {
    return apiHandler(async () => {
        const { tenantId, admin } = await requireMediaTenant(request)
        // Opt-in: only the playlists management page asks for drafts. Anything other than
        // an explicit "true" means false, so a caller that forgets cannot leak an
        // unfinished playlist into the publication content picker.
        const includeDrafts =
            new URL(request.url).searchParams.get('include_drafts') === 'true'
        const result = await callMedia(admin, 'media_playlists_list', {
            p_tenant_id: tenantId,
            p_include_drafts: includeDrafts,
        })
        return { success: true, data: result }
    })
}
```

Match the file's existing indentation and quote style rather than the sample's, if they differ.

- [ ] **Step 3: Typecheck**

Run the repo's typecheck (check `package.json` for the right script; if none exists use `npx tsc --noEmit`).
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/core/v1/media/playlists/route.ts
git commit -m "feat(playlists): forward include_drafts to the list RPC"
```

**Note in your report:** this route cannot work until migration 087 is applied to production — calling the two-argument RPC before then fails. That is expected and is why the migration ships first.

---

### Task 3: `fetchPlaylists(includeDrafts)` and its two call sites

**Repo:** `thunder_one_prj`

**Files:**
- Modify: `src/features/playlists/services/playlists-api.ts` — `fetchPlaylists`
- Modify: `src/features/playlists/components/PlaylistsListPage.tsx:95` — opt in
- Verify unchanged: `src/features/publications/components/AssetLibraryStep.tsx:114` — must keep calling it with no argument

**Interfaces:**
- Produces: `fetchPlaylists(includeDrafts?: boolean): Promise<PlaylistListItem[]>`, defaulting to `false`.

- [ ] **Step 1: Add the parameter**

Read `fetchPlaylists` first — it is a four-line wrapper over `requestApi`. Add an optional argument that appends `?include_drafts=true` only when true, so the existing request shape is untouched by default. Keep the default `false`, and add a one-line comment saying why the default is the safe one (a caller that forgets must not leak drafts into the publication picker).

- [ ] **Step 2: Opt the management page in**

In `PlaylistsListPage.tsx` change the call at line 95 to `fetchPlaylists(true)`.

- [ ] **Step 3: Confirm the picker did NOT change**

Run: `grep -n "fetchPlaylists" src/features/publications/components/AssetLibraryStep.tsx`
Expected: still a bare `fetchPlaylists()` with no argument. If you changed it, revert that.

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/features/playlists src/features/publications`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/playlists/services/playlists-api.ts src/features/playlists/components/PlaylistsListPage.tsx
git commit -m "feat(playlists): let the list page opt into drafts"
```

---

### Task 4: Next stops writing to the server

**Repo:** `thunder_one_prj`

**Files:**
- Modify: `src/features/playlists/components/CreatePlaylistPage.tsx` — `goNext`, the `creatingDraft` state, and every `disabled` expression referencing it

**Background the implementer needs:** this reverts a change from the previous sprint. Walking the wizard must not touch the network at all; `localStorage` alone carries work in progress until the operator presses Save Draft or finishes.

Two consequences to handle rather than discover:

1. `creatingDraft` exists only to disable buttons while `goNext` awaited the network. With the await gone it is dead state — remove the `useState` and every reference, including the `disabled` expressions on Back, Save Draft, Next and Create Playlist. Do not leave it wired to `false` forever.
2. `handleSubmit` can now be reached with **no** `playlistId` at all, because nothing created a row on the way through. This already works — `persistDraft` creates the row when none exists, and `resolveDraftStatus(null, true)` returns `'active'` — but that path changes from a rare fallback to the normal way a new playlist is created. Do not add a guard that rejects a missing id.

- [ ] **Step 1: Replace `goNext`**

```tsx
  // Walking the wizard is local-only: a draft row exists only once the operator asks for
  // one with Save Draft (docs/adr/0014). localStorage carries the work until then.
  const goNext = () => {
    if (step >= LAST_STEP) return;
    const result = validateStep(step as WizardStepId, validatableDraft);
    setValidationErrors(result.errors);
    if (!result.valid) return;
    draft.setStep(step + 1);
  };
```

- [ ] **Step 2: Remove `creatingDraft` entirely**

Delete its `useState`, and remove it from the `disabled` expression of every button that references it. Grep to confirm zero remaining references before moving on:

Run: `grep -n "creatingDraft" src/features/playlists/components/CreatePlaylistPage.tsx`
Expected: no output.

- [ ] **Step 3: Remove imports that are now unused**

`goNext` no longer classifies errors. Check whether `isConflict` and `classifyApiError` are still used elsewhere in the file (`saveDraft` and `handleSubmit` both use them, so they almost certainly are) — grep before deleting anything, and delete only what is genuinely unreferenced.

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/features/playlists`
Expected: exit 0, no unused-variable warnings.

- [ ] **Step 5: Commit**

```bash
git add src/features/playlists/components/CreatePlaylistPage.tsx
git commit -m "fix(playlists): keep Next local, drafts come from Save Draft only"
```

**No automated test covers this task.** Report that plainly.

---

### Task 5: The resume prompt reads a snapshot, not live state

**Repo:** `thunder_one_prj`

**Files:**
- Create: `src/features/playlists/resume-prompt.ts`
- Test: `src/features/playlists/resume-prompt.check.mts`
- Modify: `src/features/playlists/components/CreatePlaylistPage.tsx` — `showDraftBanner` (currently lines 103-104)

**Background the implementer needs — this is the reported bug:**

```tsx
const showDraftBanner =
  !idParam && !editingId && !dismissedBanner && hasDraftContent(draft) && step === 1;
```

`hasDraftContent(draft)` reads the **live** store, and `draft.name` changes on every keystroke. So starting a brand-new playlist and typing one character raises a banner announcing leftover work — which is in fact the character just typed. The banner must instead reflect whether content existed **when the store finished rehydrating**, which is a one-time fact.

The `step === 1` clause also goes: an operator who left off on step 3 is currently dropped straight back into step 3 with no prompt at all. The prompt is what distinguishes "start fresh" from "carry on", so it must appear wherever the rehydrated wizard lands.

**Interfaces:**
- Produces: `shouldShowResumePrompt(input: { hadContentAtHydration: boolean; isEditMode: boolean; dismissed: boolean }): boolean`

The extraction is the point: this function **cannot see** the current name or items, so the bug becomes unrepresentable rather than merely fixed. Do not add a "current content" argument.

- [ ] **Step 1: Write the failing test**

Create `src/features/playlists/resume-prompt.check.mts`:

```ts
import assert from "node:assert";
import { shouldShowResumePrompt } from "./resume-prompt.ts";

// Nothing was in storage — a fresh wizard must stay quiet, and typing cannot change that
// because current content is not an input to this decision at all. This is the reported bug.
assert.strictEqual(
  shouldShowResumePrompt({ hadContentAtHydration: false, isEditMode: false, dismissed: false }),
  false
);

// Leftover work from a previous visit — ask before overwriting or resuming it.
assert.strictEqual(
  shouldShowResumePrompt({ hadContentAtHydration: true, isEditMode: false, dismissed: false }),
  true
);

// Opened as ?id=<uuid>: the wizard is deliberately loading a specific playlist, so there is
// nothing to ask about.
assert.strictEqual(
  shouldShowResumePrompt({ hadContentAtHydration: true, isEditMode: true, dismissed: false }),
  false
);

// Already answered once — do not nag for the rest of the session.
assert.strictEqual(
  shouldShowResumePrompt({ hadContentAtHydration: true, isEditMode: false, dismissed: true }),
  false
);

console.log("resume-prompt.check.mts OK");
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node src/features/playlists/resume-prompt.check.mts`
Expected: FAIL — cannot find module `./resume-prompt.ts`.

- [ ] **Step 3: Implement**

Create `src/features/playlists/resume-prompt.ts`:

```ts
/** Whether to ask "carry on or start fresh?" when the wizard opens.
 *
 *  Deliberately blind to the draft's *current* contents: it takes only what was true when
 *  the store rehydrated. Reading live state is what made the prompt fire on the first
 *  keystroke of a brand-new playlist (docs/adr/0014). */
export function shouldShowResumePrompt(input: {
  hadContentAtHydration: boolean;
  isEditMode: boolean;
  dismissed: boolean;
}): boolean {
  return input.hadContentAtHydration && !input.isEditMode && !input.dismissed;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `node src/features/playlists/resume-prompt.check.mts`
Expected: prints `resume-prompt.check.mts OK`.

- [ ] **Step 5: Capture the snapshot in the component**

The snapshot must be taken on the first render **after** hydration completes — a `useState` initialiser runs too early, on the first render, when the store still holds defaults. Capture it into a ref during render instead, which also avoids the `setState`-in-effect lint rule:

```tsx
  // Captured once, the first time we render with a rehydrated store. Anything the operator
  // types afterwards must not change this answer.
  const hadContentAtHydrationRef = useRef<boolean | null>(null);
  if (hydrated && hadContentAtHydrationRef.current === null) {
    hadContentAtHydrationRef.current = hasDraftContent(draft);
  }
```

Then replace the banner condition:

```tsx
  const showDraftBanner = shouldShowResumePrompt({
    hadContentAtHydration: hadContentAtHydrationRef.current ?? false,
    isEditMode: !!idParam || !!editingId,
    dismissed: dismissedBanner,
  });
```

Leave the banner's existing markup, Thai copy, and its two button handlers exactly as they are.

- [ ] **Step 6: Typecheck, lint, and re-run the check**

Run: `npx tsc --noEmit && npx eslint src/features/playlists && node src/features/playlists/resume-prompt.check.mts`
Expected: all clean.

- [ ] **Step 7: Commit**

```bash
git add src/features/playlists/resume-prompt.ts src/features/playlists/resume-prompt.check.mts src/features/playlists/components/CreatePlaylistPage.tsx
git commit -m "fix(playlists): stop the resume prompt firing on the first keystroke"
```

---

### Task 6: Drafts on the playlists page

**Repo:** `thunder_one_prj`

**Files:**
- Create: `src/features/playlists/status-display.ts`
- Modify: `src/features/playlists/components/PlaylistsListPage.tsx` — `STATUS_FILTERS` (L19-23), the row badge (L75-77), `stats` (L113-118)
- Modify: `src/features/playlists/components/PlaylistDetailPanel.tsx` — the badge (L75-77) and the Archive/Activate button (L123-126)

**Background the implementer needs:** three places assume `status` has exactly two values, and one of them is a hazard rather than a cosmetic bug.

**The hazard.** `PlaylistDetailPanel.tsx:123-126` renders its button from `status === "active" ? "Archive" : "Activate"`. A draft is not `active`, so the panel would offer **Activate**, and `PlaylistsListPage.handleStatusChange` (L122-133) would send `upsertPlaylist({ status: "active" })` — publishing to real screens a playlist that never passed `validateStep`, with no items and no playback settings. `media_playlist_upsert`'s status guard does not help: it blocks `active → draft`, not `draft → active`.

A draft must therefore offer **no** status toggle at all. Its only action is to carry on editing, which the existing "Edit Playlist" link already provides.

- [ ] **Step 1: Add a Draft badge in both components**

`Badge` accepts `color` of `"green" | "yellow" | "red" | "blue" | "indigo" | "zinc"`. Both files
currently render the same two-way ternary. Replace it in each with one shared mapping so the two
screens cannot drift apart — put it next to the other pure helpers at the feature root, in
`src/features/playlists/status-display.ts`:

```ts
import type { BadgeColor } from "@/components/ui/Badge";
import type { PlaylistStatus } from "./types";

/** Draft is yellow rather than zinc so it reads as in-progress, not switched off. */
export function statusBadge(status: PlaylistStatus): { color: BadgeColor; label: string } {
  if (status === "active") return { color: "green", label: "Active" };
  if (status === "draft") return { color: "yellow", label: "Draft" };
  return { color: "zinc", label: "Inactive" };
}
```

Then in both `PlaylistsListPage.tsx` (L75-77) and `PlaylistDetailPanel.tsx` (L75-77):

```tsx
        <Badge color={statusBadge(playlist.status).color} variant="pill">
          {statusBadge(playlist.status).label}
        </Badge>
```

Verify `BadgeColor` is exported from `@/components/ui/Badge` before importing it — it is declared
there on line 3. If the import path alias differs in this repo, match what the surrounding files use.

- [ ] **Step 2: Hide the status toggle for drafts**

In `PlaylistDetailPanel.tsx`, wrap the existing Archive/Activate button (L123-126) so it renders
only for a non-draft playlist. Leave the Edit Playlist link visible for every status.

```tsx
          {playlist.status !== "draft" && (
            <Button
              variant="secondary"
              onClick={() =>
                onStatusChange(playlist.id, playlist.status === "active" ? "inactive" : "active")
              }
            >
              {playlist.status === "active" ? "Archive" : "Activate"}
            </Button>
          )}
```

Copy the button's real existing props and class names from the file rather than the sample above —
only the surrounding condition is new.

Add this comment directly above it, so nobody "fixes" the missing button back into existence:

```tsx
          {/* A draft has no status toggle on purpose: it would read as "Activate" and publish a
              playlist that never passed validateStep — no items, no playback settings — straight
              to the screens. Finishing it goes through the wizard (docs/adr/0014). */}
```

- [ ] **Step 3: Count drafts separately**

`stats` currently computes `inactive = total - active`, which silently files drafts under Inactive. Count each status explicitly and surface a Draft figure alongside Active and Inactive. Follow the existing `StatCard` usage rather than inventing a new layout.

- [ ] **Step 4: Add the filter option**

`STATUS_FILTERS` (L19-23) lists All / Active / Inactive. Add `{ value: "draft", label: "Draft" }`. The filter logic at L107 compares `p.status !== status` and needs no change.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/features/playlists`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/playlists/components/PlaylistsListPage.tsx src/features/playlists/components/PlaylistDetailPanel.tsx
git commit -m "feat(playlists): show drafts in the list without a status toggle"
```

**No automated test covers this task.** Report that plainly.

---

### Task 7: ADR 0014

**Repo:** `thunder_one_prj`

**Files:**
- Create: `docs/adr/0014-playlist-draft-on-demand.md`

- [ ] **Step 1: Read the two ADRs being superseded**

Read `docs/adr/0012-playlist-draft-save.md` and `docs/adr/0013-playlist-save-draft-button.md` in full first, and match their house style: prose paragraphs rather than bullet lists, `## Context` / `## Decision` / `## Consequences`, bold lead-ins per decision, explicit records of rejected alternatives. English throughout.

- [ ] **Step 2: Write it**

ADR 0014 must record:

- **What is superseded.** ADR 0012's "draft row created on first Next from the info step" and its `media_playlists_list` filter that hid drafts from every screen. ADR 0013 framed the auto-save as the mechanism that made Save Draft meaningful; that framing is replaced — a draft now exists only because the operator asked for one.
- **The distinction being drawn.** Auto-save preserves work in progress so leaving the page and returning does not lose it, and lives in `localStorage`. A draft is a deliberate act with a server row and a place in the list. Conflating them made every abandoned wizard write an invisible row to production and left Save Draft with no observable effect of its own.
- **Rejected: an `explicitly_saved` column** (publications' pattern) to keep the row while marking which ones are real drafts. It survives a browser change or another device, which the localStorage model does not; declined because it needs a new column and keeps every abandoned wizard writing to production — paying the cost this change removes, for cross-device recovery nobody asked for.
- **Accepted consequence.** Work not yet saved with Save Draft lives only in that browser; clearing site data loses it. Same guarantee the wizard had before the draft-save sprint, with Save Draft as the escape hatch.
- **Why the list RPC takes an opt-in parameter** rather than dropping the draft filter outright: one function serves both the management page and the publication content picker, and an unfinished playlist must never be schedulable. The default is `false` so a caller that forgets fails safe.
- **The resume-prompt bug** and why the fix is structural: the decision function is blind to current content, so the prompt cannot fire on a keystroke again.
- **What stays deferred:** `media_playlist_delete` and a Cancel button. Note that this change shrinks that problem — rows now exist only when deliberately saved, and those are visible on `/playlists`.

- [ ] **Step 3: Commit**

```bash
git add docs/adr/0014-playlist-draft-on-demand.md
git commit -m "docs(playlists): record ADR 0014 draft-on-demand model"
```

- [ ] **Step 4: Run the whole check suite and report honestly**

```bash
npx tsc --noEmit
npx eslint src/features/playlists src/features/publications
for f in src/features/playlists/*.check.mts; do node "$f"; done
```

Report the real output. State explicitly that **nothing above the type system has been exercised**: Tasks 3, 4, 6 are UI and network wiring with no automated coverage, and Tasks 1-2 are unrunnable until the migration is applied.

- [ ] **Step 5: Hand off what cannot be done here — do NOT attempt any of it**

Do not apply the migration, do not deploy, do not start a dev server, do not open a browser. Write this into your report as the handoff:

**Blocked on the repo owner (R0 approval):** apply `087_playlists_list_include_drafts.sql` to production. After applying, dump `prosrc` for `media_playlists_list` and diff it against the migration file, then confirm the function returns the draft row only with `p_include_drafts => true`.

**Blocked on deployment:** `Thunder_Core` must ship before the frontend behaves correctly — until then the list page's `include_drafts=true` hits the old one-argument RPC.

**Browser checklist, once unblocked** (ask before running):
1. Create Playlist with empty storage → no prompt; type a name → still no prompt.
2. Fill in a name, reach step 3, navigate away, come back → prompt appears; "ทำต่อ" restores, "เริ่มใหม่" clears.
3. Walk the entire wizard without pressing Save Draft → confirm **in the database** that no row was created.
4. Press Save Draft → row appears as `status='draft'` and shows on `/playlists` with a Draft badge.
5. Open that draft via Edit Playlist → name, items, description and playback all load → finish it → becomes `active`.
6. Confirm the draft shows no Archive/Activate control.
7. Open the publication content picker → confirm the draft is absent.

---

## Notes for the reviewer

- Task order is a deployment order, not a preference: the RPC must gain its parameter before any route passes one.
- The likeliest silent failure is Task 1's `DROP FUNCTION` signature not matching the live one. It was dumped from production as `media_playlists_list(p_tenant_id uuid)`; if the DROP misses, `CREATE OR REPLACE` leaves two overloads and every existing caller breaks at once.
- The likeliest missed requirement is Task 6 step 2. A draft that still offers "Activate" publishes an unfinished playlist to live screens in one click, and nothing in the backend prevents it.
- Task 4 removes state (`creatingDraft`) rather than adding any. Check for leftovers in `disabled` expressions rather than only for compile errors — a stale `false` reference still compiles.
