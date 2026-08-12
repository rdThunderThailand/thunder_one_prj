# Playlist Save Draft Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Create Playlist wizard an explicit "Save Draft" button, and make both it and the existing auto-save-on-Next write the complete draft (name + metadata + items) instead of the name alone.

**Architecture:** Extract the duplicated upsert/retry/conflict block out of `CreatePlaylistPage` into a `usePlaylistDraftSave` hook exposing a single `persistDraft({ activate })`. Three callers use it: `goNext` (every step, `activate: false`), the new `saveDraft` (`activate: false`), and `handleSubmit` (`activate: true`). The one branching decision — which `status` to send — becomes a pure function with its own check file.

**Tech Stack:** Next.js (App Router), React client component, zustand + persist, `sonner` for toasts. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-12-playlist-save-draft-button-design.md`

## Global Constraints

- Frontend only. **No migration, no Thunder_Core change, no new dependency.** If a task appears to need any of these, stop and report — it means the plan is wrong.
- Do not bump `STORAGE_KEY` in `usePlaylistDraftStore.ts`. It stays `thunderone.playlists.create-draft.v2`; no new persisted field is introduced.
- Commit messages: `<type>(playlists): <imperative subject>`, subject ≤ 72 chars. **Never** add `Co-Authored-By: Claude` or mention AI anywhere in a commit.
- Never claim a test passed without running it and seeing the output.
- Typecheck: `npx tsc --noEmit` (there is no `typecheck` npm script). Baseline is clean — exit 0, no output.
- Lint: `npx eslint src/features/playlists`.
- Check files: `node <path>.check.mts`. They print `<filename> OK` on success. A `MODULE_TYPELESS_PACKAGE_JSON` warning is expected noise, not a failure.
- ESLint in this repo forbids synchronous `setState` in a `useEffect` body and inside anything it awaits. None of these tasks add a `useEffect`; keep it that way.
- Files should stay ≤ 300 lines. `CreatePlaylistPage.tsx` is 369 today; Task 3 is what brings it back down.
- No `any`. No dead code left behind.

---

### Task 1: `resolveDraftStatus` pure function

The single branching decision behind every save. Extracted so it is testable without mounting the wizard.

**Files:**
- Create: `src/features/playlists/resolve-draft-status.ts`
- Test: `src/features/playlists/resolve-draft-status.check.mts`

**Interfaces:**
- Consumes: `PlaylistStatus` from `src/features/playlists/services/playlists-api.ts` — verify where it is actually exported from before importing; it is referenced there as `PlaylistStatus` on `UpsertPlaylistInput.status`.
- Produces: `resolveDraftStatus(existingId: string | null, activate: boolean): PlaylistStatus | undefined`

**Background the implementer needs:** `upsertPlaylist` only copies `status` into the request body when it is truthy (`playlists-api.ts:37`). An omitted `status` makes `media_playlist_upsert` leave the column alone. That is how an existing row keeps `active`/`inactive` through a draft save, and it is the behaviour commit `d96009d` established — returning `'draft'` for an existing row instead of `undefined` would silently demote published playlists.

- [ ] **Step 1: Write the failing test**

Create `src/features/playlists/resolve-draft-status.check.mts`:

```ts
import assert from "node:assert";
import { resolveDraftStatus } from "./resolve-draft-status.ts";

// New row, plain draft save — must be explicitly created as a draft.
assert.strictEqual(resolveDraftStatus(null, false), "draft");

// New row, create-and-activate in one call.
assert.strictEqual(resolveDraftStatus(null, true), "active");

// Existing row, draft save — status MUST be omitted so the RPC preserves whatever
// the row already is. Returning "draft" here would demote a published playlist.
assert.strictEqual(resolveDraftStatus("11111111-1111-1111-1111-111111111111", false), undefined);

// Existing row, final submit.
assert.strictEqual(resolveDraftStatus("11111111-1111-1111-1111-111111111111", true), "active");

console.log("resolve-draft-status.check.mts OK");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node src/features/playlists/resolve-draft-status.check.mts`
Expected: FAIL — cannot find module `./resolve-draft-status.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/playlists/resolve-draft-status.ts`:

```ts
import type { PlaylistStatus } from "./services/playlists-api";

/** Which `status` a save should send. `undefined` is meaningful, not a gap:
 *  `upsertPlaylist` omits a falsy status from the body and `media_playlist_upsert`
 *  then leaves the column untouched — that is how a draft save on an already
 *  published playlist avoids demoting it back to 'draft'. */
export function resolveDraftStatus(
  existingId: string | null,
  activate: boolean
): PlaylistStatus | undefined {
  if (activate) return "active";
  return existingId ? undefined : "draft";
}
```

If `PlaylistStatus` is not exported from `services/playlists-api`, find its real source (likely `../types`) and import from there — do not redeclare the union.

- [ ] **Step 4: Run test to verify it passes**

Run: `node src/features/playlists/resolve-draft-status.check.mts`
Expected: PASS — prints `resolve-draft-status.check.mts OK`.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 6: Commit**

```bash
git add src/features/playlists/resolve-draft-status.ts src/features/playlists/resolve-draft-status.check.mts
git commit -m "feat(playlists): add resolveDraftStatus for draft-vs-activate saves"
```

---

### Task 2: `usePlaylistDraftSave` hook, wired into `handleSubmit` only

Pure refactor — no behaviour change. `goNext` is deliberately left alone so a reviewer can confirm this task changes nothing observable before Task 3 changes something.

**Files:**
- Create: `src/features/playlists/hooks/usePlaylistDraftSave.ts` (new `hooks/` directory, matching `src/features/publications/hooks/`)
- Modify: `src/features/playlists/components/CreatePlaylistPage.tsx` — replace the body of `handleSubmit` (L202-240), move `isStaleDraftError` (L27-30) and `buildItemPayload` (L194-200) into the hook

**Interfaces:**
- Consumes: `resolveDraftStatus` from Task 1.
- Produces: `usePlaylistDraftSave(): { persistDraft: (opts: { activate: boolean }) => Promise<string> }`
  - Resolves with the playlist id on success.
  - Throws on failure. Callers classify: `isConflict(err.message)` → revision-conflict banner; otherwise `classifyApiError`.

**Background the implementer needs:**

- `isStaleDraftError` matches the message `"playlist not found for this tenant"`, which means the draft row was deleted or moved out of `draft` elsewhere. The recovery is: re-mint the idempotency key **first** (reusing the old key would resolve the retry back to the same dead row), clear `playlistId`/`revision`, clear `editingId`, then retry once as a fresh create. Move this logic verbatim from `goNext` L151-176 — do not redesign it.
- Both `upsertPlaylist` and `setPlaylistItems` return a `revision`. Both must be written back to the store. `setPlaylistItems` bumps `revision` server-side; dropping its response makes the *next* save conflict with itself. Publications shipped this exact bug once (`usePublishDraft.ts` L236-244).
- Read the store through `usePlaylistDraftStore.getState()` inside `persistDraft`, not through the component's `draft` binding — the existing code already does this (L140, L206) to avoid acting on a stale render.
- `setPlaylistItems` is called unconditionally, including with `[]`. Do **not** add a "skip when empty" guard: removing every item and saving must persist that, and an empty array on a brand-new playlist overwrites nothing. The edit-mode concern (writing `[]` before `?id=` hydration fills `items`) is already closed by the component's `if (!hydrated || resuming) return` gate at L106-108, which blocks render — and therefore any button — until the store has rehydrated.

- [ ] **Step 1: Create the hook**

Create `src/features/playlists/hooks/usePlaylistDraftSave.ts`:

```ts
"use client";

import { usePlaylistDraftStore } from "../store/usePlaylistDraftStore";
import { setPlaylistItems, upsertPlaylist } from "../services/playlists-api";
import { encodeMetadata } from "../metadata";
import { resolveDraftStatus } from "../resolve-draft-status";

/** The backend rejection that means "this draft id is no longer usable" — the row
 *  was deleted, or moved out of 'draft' from elsewhere. Matched on message because
 *  the proxy only forwards `{ error: string }`. Same shape as publications'
 *  isStaleDraftError in usePublishDraft.ts. */
export function isStaleDraftError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : "";
  return msg.includes("playlist not found for this tenant");
}

/** Writes the whole draft — name, metadata and items — in one cycle. Used by
 *  Next, by the Save Draft button, and by the final submit; only `activate`
 *  differs between them. Throws on failure so the caller can decide between the
 *  revision-conflict banner and an inline error. */
export function usePlaylistDraftSave() {
  const persistDraft = async ({ activate }: { activate: boolean }): Promise<string> => {
    const current = usePlaylistDraftStore.getState();
    const existingId = current.playlistId ?? current.editingId;
    const metadata = encodeMetadata({ info: current.info, playback: current.playback });

    let playlistId: string;
    try {
      const res = await upsertPlaylist({
        name: current.name.trim(),
        status: resolveDraftStatus(existingId, activate),
        metadata,
        playlistId: existingId,
        expectedRevision: current.revision,
        idempotencyKey: current.idempotencyKey,
      });
      playlistId = res.playlist_id;
      current.setPlaylistId(res.playlist_id);
      current.setRevision(res.revision);
    } catch (err) {
      if (!isStaleDraftError(err)) throw err;
      // Re-mint first: reusing the old key would resolve the retry back to the
      // same dead row instead of creating a fresh draft.
      current.resetIdempotencyKey();
      current.setPlaylistId(null);
      current.setRevision(null);
      const res = await upsertPlaylist({
        name: current.name.trim(),
        status: resolveDraftStatus(null, activate),
        metadata,
        idempotencyKey: usePlaylistDraftStore.getState().idempotencyKey,
      });
      playlistId = res.playlist_id;
      usePlaylistDraftStore.setState({ editingId: null });
      current.setPlaylistId(res.playlist_id);
      current.setRevision(res.revision);
    }

    const itemsRes = await setPlaylistItems(
      playlistId,
      usePlaylistDraftStore.getState().items.map((item, index) => ({
        media_asset_id: item.mediaAssetId,
        position: index,
        ...(item.durationSeconds != null ? { duration_seconds: item.durationSeconds } : {}),
        transition: item.transition,
      }))
    );
    // set_items bumps revision server-side; dropping it makes the next save
    // conflict with itself.
    if (typeof itemsRes.revision === "number") current.setRevision(itemsRes.revision);

    return playlistId;
  };

  return { persistDraft };
}
```

- [ ] **Step 2: Rewire `handleSubmit` to use the hook**

In `CreatePlaylistPage.tsx`, add `const { persistDraft } = usePlaylistDraftSave();` alongside the other hook calls near L48, and replace `handleSubmit`'s body (L202-240) with:

```tsx
  const handleSubmit = async () => {
    setSubmitError(null);
    setRevisionConflict(null);
    setSubmitting(true);
    try {
      await persistDraft({ activate: true });
      draft.reset();
      router.push("/playlists");
    } catch (err) {
      if (err instanceof Error && isConflict(err.message)) {
        setRevisionConflict(classifyApiError(err, err.message).message);
      } else {
        setSubmitError(classifyApiError(err, "สร้าง playlist ไม่สำเร็จ"));
      }
    } finally {
      setSubmitting(false);
    }
  };
```

The old `if (!id)` guard at L208-211 goes away: `persistDraft` no longer requires a pre-existing id — it creates the row when there isn't one, which is strictly more forgiving.

- [ ] **Step 3: Delete the now-unused local copies**

Remove `buildItemPayload` (L194-200) and the local `isStaleDraftError` (L27-30) from `CreatePlaylistPage.tsx`. `goNext` still references `isStaleDraftError` at this point, so import it from the hook module instead of deleting the reference:

```ts
import { isStaleDraftError, usePlaylistDraftSave } from "../hooks/usePlaylistDraftSave";
```

Also drop `encodeMetadata` from the imports if nothing else in the component uses it — grep before deleting.

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/features/playlists`
Expected: exit 0, no errors. No unused-import warnings.

- [ ] **Step 5: Commit**

```bash
git add src/features/playlists/hooks/usePlaylistDraftSave.ts src/features/playlists/components/CreatePlaylistPage.tsx
git commit -m "refactor(playlists): extract persistDraft into usePlaylistDraftSave"
```

**No automated test covers this task.** It is a call-sequence against a live backend; correctness is confirmed by the browser checklist in Task 5. Say so in the report — do not describe this task as verified.

---

### Task 3: `goNext` saves the full payload on every step

The behaviour change. Isolated to a small diff so it can be reviewed on its own.

**Files:**
- Modify: `src/features/playlists/components/CreatePlaylistPage.tsx` — `goNext` (L128-184)

**Interfaces:**
- Consumes: `persistDraft` from Task 2.

**Background the implementer needs:** today `goNext` writes only when `step === 1`, and sends only `name`. Everything the operator builds in steps 2 and 3 — media items, playback settings, description — reaches the server only at final submit. Removing the guard is the point of this task.

- [ ] **Step 1: Replace `goNext`**

```tsx
  // Every Next persists the whole draft — name, metadata and items. Restricting
  // this to step 1 (as it originally was) left a crash mid-wizard with a
  // name-only row and every picked asset lost.
  const goNext = async () => {
    if (step >= LAST_STEP) return;
    const result = validateStep(step as WizardStepId, validatableDraft);
    setValidationErrors(result.errors);
    if (!result.valid) return;

    setCreatingDraft(true);
    setSubmitError(null);
    setRevisionConflict(null);
    try {
      await persistDraft({ activate: false });
    } catch (err) {
      if (err instanceof Error && isConflict(err.message)) {
        setRevisionConflict(classifyApiError(err, err.message).message);
      } else {
        setSubmitError(classifyApiError(err, "บันทึก draft ไม่สำเร็จ"));
      }
      return;
    } finally {
      setCreatingDraft(false);
    }

    draft.setStep(step + 1);
  };
```

Note the `return` inside `catch` — the wizard must not advance when the save failed. This preserves the existing `if (!ok) return` behaviour at L180 without the flag variable.

- [ ] **Step 2: Remove the now-unused import**

`isStaleDraftError` is no longer referenced by the component (the hook owns it). Remove it from the import added in Task 2, leaving `import { usePlaylistDraftSave } from "../hooks/usePlaylistDraftSave";`.

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/features/playlists`
Expected: exit 0, no errors.

- [ ] **Step 4: Confirm the file is back under the line limit**

Run: `wc -l src/features/playlists/components/CreatePlaylistPage.tsx`
Expected: under 300. If it is not, report the number — do not start deleting unrelated code to hit the target.

- [ ] **Step 5: Commit**

```bash
git add src/features/playlists/components/CreatePlaylistPage.tsx
git commit -m "fix(playlists): persist full draft on every Next, not name on step 1"
```

**No automated test covers this task** — same reason as Task 2.

---

### Task 4: The Save Draft button

**Files:**
- Modify: `src/features/playlists/components/CreatePlaylistPage.tsx` — add `savingDraft` state, add `saveDraft`, add the button to `PageHeader.actions` (L270-294)

**Interfaces:**
- Consumes: `persistDraft` from Task 2.

**Background the implementer needs:** `saveDraft` deliberately does **not** call `validateStep`. Storing incomplete work is the entire purpose of the button; running the step gate would defeat it. The only guard is a non-empty name, because the endpoint rejects an empty one — publications guards the same field for the same reason (`usePublishDraft.ts` L255-260).

- [ ] **Step 1: Add the import and state**

`sonner` is already a dependency (used across publications). Add to the imports:

```ts
import { toast } from "sonner";
```

Add alongside the other `useState` calls near L65:

```ts
const [savingDraft, setSavingDraft] = useState(false);
```

- [ ] **Step 2: Add the handler**

Place it next to `goNext`:

```tsx
  // Deliberately skips validateStep — saving work that is not yet complete is the
  // whole point. Only the name is required, because the endpoint refuses an empty one.
  const saveDraft = async () => {
    if (!name.trim()) {
      const message = "กรุณากรอกชื่อ playlist ก่อนบันทึกร่าง";
      setSubmitError({ kind: "rejected", message });
      toast.error(message);
      return;
    }
    setSavingDraft(true);
    setSubmitError(null);
    setRevisionConflict(null);
    try {
      await persistDraft({ activate: false });
      toast.success("บันทึกร่างแล้ว");
    } catch (err) {
      // The revision-conflict banner already shows this — avoid saying it twice.
      if (err instanceof Error && isConflict(err.message)) {
        setRevisionConflict(classifyApiError(err, err.message).message);
      } else {
        const classified = classifyApiError(err, "บันทึกร่างไม่สำเร็จ");
        setSubmitError(classified);
        toast.error(classified.message);
      }
    } finally {
      setSavingDraft(false);
    }
  };
```

Confirm `{ kind: "rejected", message }` is a valid `ClassifiedError` — L209 of the current file constructs one exactly this way, so it is.

- [ ] **Step 3: Add the button**

In `PageHeader.actions`, between the Back button and the Next/Create branch:

```tsx
            {step < LAST_STEP && (
              <Button
                variant="secondary"
                onClick={saveDraft}
                disabled={savingDraft || submitting || creatingDraft}
              >
                {savingDraft ? "กำลังบันทึก..." : "Save Draft"}
              </Button>
            )}
```

It is hidden on the last step on purpose: once Task 3 makes Next persist everything, reaching Review means the draft is already saved, so the button would have nothing to do there. This matches publications, which also omits it on its final step.

Add `savingDraft` to the `disabled` expression of the existing Back button and of both the Next and Create Playlist buttons, so nothing can be clicked mid-save. (Line numbers from the original file no longer apply — Tasks 2 and 3 have shifted them. Find the buttons by their labels.)

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/features/playlists`
Expected: exit 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/playlists/components/CreatePlaylistPage.tsx
git commit -m "feat(playlists): add Save Draft button to the wizard"
```

---

### Task 5: ADR 0013, stale comments, and the verification handoff

**Files:**
- Create: `docs/adr/0013-playlist-save-draft-button.md`
- Modify: `src/features/playlists/store/usePlaylistDraftStore.ts` — header comment L3-5, and the `playlistId` comment L38-39

- [ ] **Step 1: Write ADR 0013**

Create `docs/adr/0013-playlist-save-draft-button.md`. Follow the house style of `0012-playlist-draft-save.md`: `## Context`, `## Decision`, `## Consequences`, prose not bullets, and record what was rejected and why. It must state:

- ADR 0012 rejected a Save Draft button on the grounds that publications does not have one. That is factually wrong: `CreatePublicationPage.tsx:325` renders `Save as Draft` → `usePublishDraft.saveDraft()`, *in addition to* `persistDraft` on every Next. The rejection rested on an incomplete comparison, so it is superseded here rather than reaffirmed.
- ADR 0012's auto-save also turned out to be name-only and step-1-only, so the "data loss on refresh/crash during a long edit" motivation was barely served. Both the button and the widened Next payload land together for that reason.
- Rejected: gating the button behind `validateStep`. It would refuse to save exactly the incomplete work the button exists to protect.
- Rejected: showing the button on the Review step. With Next persisting everything, there is nothing left unsaved by then.
- Deferred, with reasoning: the Cancel button, publications' `explicitlySaved` flag, and `media_playlist_delete`. Confirmed absent from prod (`media_publication_delete` exists; `/media/playlists/[id]/route.ts` has GET and PATCH only). Deferred because it needs a new RPC, a new route and a production migration — a separate R0 cycle, not a rider on this frontend change. Consequence: abandoned draft rows keep accumulating invisibly, unchanged from ADR 0012 L111-115.

- [ ] **Step 2: Fix the two stale comments in the store**

L3-5 currently claims "nothing here is persisted server-side until the final submit — the whole wizard is local". That stopped being true when ADR 0012 shipped and is now doubly wrong. Replace with an accurate description: the store is the local mirror of a draft that is also persisted server-side on every Next and on Save Draft, and `playlistId`/`revision`/`idempotencyKey` are what tie it to that row.

L38-39's comment justifies `playlistId` with "which would hit UNIQUE (tenant_id, name) anyway" — that constraint was dropped by migration 086. Rewrite without the dead justification; the real reason is that a failed `setItems` can retry without re-creating the playlist.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add docs/adr/0013-playlist-save-draft-button.md src/features/playlists/store/usePlaylistDraftStore.ts
git commit -m "docs(playlists): record ADR 0013 and correct stale draft-store comments"
```

- [ ] **Step 5: Run the full check suite and report honestly**

```bash
npx tsc --noEmit
npx eslint src/features/playlists
node src/features/playlists/resolve-draft-status.check.mts
node src/features/playlists/step-validation.check.mts
node src/features/playlists/metadata.check.mts
node src/features/playlists/duration.check.mts
```

Report the actual output. State explicitly that **no layer above the type system has been exercised** — Tasks 2, 3 and 4 are network call sequences with no automated coverage.

- [ ] **Step 6: Hand off the browser checklist — do not run it unprompted**

The browser pass **cannot run yet**: the frontend calls the deployed backend (`thundercore.vercel.app`), and Thunder_Core PR #29 is not deployed. Report this as a blocker rather than working around it.

When it is unblocked, ask the user before running it. The checklist:

1. New playlist → fill name → Next → a row exists with `status='draft'`.
2. Step 2, pick media → Save Draft → toast appears → reload the page → items are still there.
3. Step 3, change playback settings → Next → refresh → settings survive.
4. Save Draft with an empty name → blocked with a message, no network call fires.
5. Finish the wizard → row flips to `status='active'` and appears in `/playlists`.
6. Two tabs editing the same draft → the second save shows the revision-conflict banner, not a silent overwrite.

---

## Notes for the reviewer

- Tasks 2 and 3 are split so that Task 2 is provably behaviour-neutral and Task 3 carries the entire behaviour change in a diff small enough to read at a glance.
- The one thing most likely to be got wrong is `resolveDraftStatus` returning `'draft'` instead of `undefined` for an existing row. That would demote published playlists on every Next. Task 1's check file exists specifically to pin this.
- Second most likely: dropping `itemsRes.revision`. The failure is delayed — the *next* save conflicts with itself — so it will not show up in the task that causes it.
