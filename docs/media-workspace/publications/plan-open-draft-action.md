# Open a Draft through one store action — plan

> Executor: implement task by task in one run. Do not commit, push or open a PR. On any design fork (a choice
> this plan does not settle that would be costly to undo), stop and report instead of choosing.

**Goal:** Every way a Draft enters the create-Program wizard (server load, editor seed) writes the draft store with one
`set()` instead of a hand-ordered chain of setters, and the problem targets (ADR 0122 rule 17 notice) move from a
sidecar zustand store into the draft store.

**Why:** Today `loadPublicationIntoDraft` (`components/CreatePublicationPage.tsx`) calls 12 setters in an order no code
enforces. `setBasicInfo` clears asset items, playlist and composition when the Program type changes, so it has to run
first. `applySeed` (`hooks/useCreateDraftEntry.ts`) repeats the pattern. The problem-target notice reads a separate
store, so every entry path has to remember to fill it. Two bugs came from paths that forgot: 55cad03e (reopen from
localStorage) and PR #449 ("โหลดใหม่" kept the old list).

**Base:** branch `refactor/open-draft-action` from `origin/dev`, **after PR #449 has merged**. #449 adds
`showProblemTargets`, which this plan removes. Branches merge into `dev` by squash, so do not test commit ancestry.
Check both of these first, and stop and report if either fails:
- `gh pr view 449 --json state -q .state` → `MERGED`
- after `git fetch origin dev`, `git grep -q showProblemTargets origin/dev -- src` → exit 0

**Tech:** Next.js client components, zustand 5 with `persist`, and plain-node checks (`node <file>.check.mts`, no test
runner by design).

All paths below are relative to `src/features/media-workspace/publications/`.

## Decisions (settled, do not re-open)

1. Two new store actions, `openDraft(opened)` and `applySeed(seed, ready)`. Each takes data that is already fetched and
   writes it with **exactly one `set()` call**. The store never calls the API.
2. `openDraft` leaves `step` and `furthestStep` alone. The `?id=` load and retry still call `landOnResumeStep()` after it.
   "โหลดใหม่" keeps the operator on their current step.
3. Problem targets become a persisted store field, `problemTargets: ProblemTarget[]`, default `[]`. The persist key stays
   `thunderone.publications.create-draft.v14`, which is a deliberate exception to the "bump the key on any shape change"
   rule. zustand's persist merge is `{ ...currentState, ...persistedState }`, so a v14 draft saved before this change
   rehydrates with `[]` (the same reasoning already used for `furthestStep`). Add one line saying this to the store's
   version-history comment.
4. `problemTargets` is not added to `DraftFields`, and it never enters `serializeDraftFields`. It comes from the server,
   the operator cannot edit it, and it must never make the Draft dirty.
5. Every existing setter stays, `setStep` included (the stepper and `onEditProgram` use it). Only the page's unused
   setter selectors are removed.
6. Problem targets are fetched in exactly two places: by `openDraft` (from the detail its caller fetched) and by the
   refresh hook, once after hydration. Today's hook also refetches whenever `publicationId` changes, i.e. on the first
   save (null → id) and on stale-id recovery in `persistDraft`. That refetch goes away on purpose. On those changes
   the list keeps its current entries. It stays harmless because the notice filters by the selected `channelIds`, and
   the picker only offers Active Channels.
7. Out of scope: stale-id recovery in `persistDraft`, the entry-capture logic of ADR 0086 in `useCreateDraftEntry`,
   `lastAutoName`, and file length.

## Review Focus

These inputs are the most likely to break, and each one is pinned by the task or checklist step named.

- A Playlist-type Draft opened by `?id=` while the store holds an image-type draft keeps its playlist id and items.
  The old setter order existed to protect this. → Task 1 check, checklist 2.
- A problem-target fetch that returns after the Draft was replaced (cancelled on entry, "Start fresh", or a seed applied
  over it) must not write. → Task 4 id guard, checklist 6.
- `?id=` equal to the persisted `publicationId` skips the server load (`CreatePublicationPage.tsx`, the
  `idParam === …publicationId` early return). The notice must still refresh once. → Task 4, checklist 3.
- "โหลดใหม่" must not change the step. → checklist 4.
- Right after `openDraft` the Draft is not dirty and `explicitlySaved` is `true`, as today's `markSaved()` +
  `setExplicitlySaved(true)` leave it. → checklist 1. The store cannot be loaded by plain node.

---

### Task 1: `detailToDraft` returns everything `openDraft` needs

**Files:** modify `detail-mapping.ts`. Test: `detail-mapping.check.mts`.

**Produces:** three fields added to `ResumedDraft`. The signature `detailToDraft(detail, playlist?, today?)` does not
change.
```ts
publicationId: string;            // detail.id
revision: number | null;          // detail.revision ?? null
problemTargets: ProblemTarget[];  // problemTargets(detail.publication_targets ?? []), from "./problem-targets.ts"
```

- [ ] Add these assertions to `detail-mapping.check.mts`:
  - `publicationId === "publication-1"`. `revision` is `null` without `revision` and `7` with `revision: 7`.
  - A detail with three channel targets gives `problemTargets` holding exactly the first two, with their names and the
    `deleted` flag. The three are: one with `deleted: true`, one with `status: "inactive"`, one active.
  - A `publication_type: "playlist"` detail with a playlist of 2 items (positions out of order) gives `playlistId` and
    both items in position order. This is the input `openDraft` must keep whole. The device-target drop is already
    pinned at `detail-mapping.check.mts:57-61`, so leave that alone.
- [ ] `node detail-mapping.check.mts` → FAIL on the new assertions.
- [ ] Implement.
- [ ] `node detail-mapping.check.mts` → prints its pass line.

### Task 2: seed content as a pure function

**Files:** modify `seed-resolver.ts`. Test: `seed-resolver.check.mts`.

**Produces** (`ReadySeed` moves here from `hooks/useCreateDraftEntry.ts`):
```ts
export type ReadySeed = { name: string; publicationType: PublicationType };
export function seedContent(seed: PublicationSeed, ready: ReadySeed): {
  publicationType: PublicationType;
  assetItems: DraftAssetItem[];
  playlistId: string | null;
  compositionId: string | null;
};
```
The rules are today's `applySeed`:
- composition: `compositionId = seed.id`.
- playlist: `playlistId = seed.id`.
- asset: one item, `{ media_asset_id: seed.id, duration_seconds: image ? DEFAULT_IMAGE_DURATION_SECONDS : null,
  transition: "cut" }`.
- Every other field is empty or `null`.

Value-import `DEFAULT_IMAGE_DURATION_SECONDS` from `./draft-mapping.ts`. Types come from `./types/index.ts` via
`import type`.

- [ ] Add one assertion per seed kind. For asset, cover both an image (10 s) and a video (`null`).
- [ ] `node seed-resolver.check.mts` → FAIL.
- [ ] Implement.
- [ ] `node seed-resolver.check.mts` → passes.

### Task 3: store actions and the `problemTargets` field

**Files:** modify `store/usePublicationDraftStore.ts`.

**Consumes:** `ResumedDraft` (Task 1), and `seedContent` / `ReadySeed` (Task 2).

**Produces on `PublicationDraftStore`:**
- `problemTargets: ProblemTarget[]`, initial `[]`.
- `setProblemTargets(targets: ProblemTarget[]): void`.
- `openDraft(opened: ResumedDraft): void`. One `set()`, which writes:
  - the 8 draft fields from `opened` (`basicInfo`, `assetItems`, `playlistId`, `compositionId`, `channelIds`,
    `groupIds`, `groupNamesById`, `schedule`)
  - `publicationId`, `revision`, `problemTargets`
  - `savedSnapshot: serializeDraftFields(<those 8 fields>)`
  - `explicitlySaved: true`

  It does not write `step`, `furthestStep`, `idempotencyKey` or `lastAutoName`.
- `applySeed(seed: PublicationSeed, ready: ReadySeed): void`. One `set()` with
  `{ ...getDefaultDraft(), lastAutoName: "", savedSnapshot: serializeDraftFields(getDefaultDraft()), explicitlySaved: false, revision: null, problemTargets: [], basicInfo: { ...defaultBasicInfo, publicationType }, assetItems, playlistId, compositionId, step: 2 }`,
  using the values from `seedContent`.
  - The snapshot is the default draft's, so a seeded Draft starts dirty, as it does today.
  - No `clearStorage()` is needed: `persist` writes the whole new state on `set()`.
- `cancelDraft` also resets `problemTargets: []`.
- Version-history comment: add the decision 3 line.

The store file has no plain-node check, because it imports `@/…` and extensionless paths that node cannot resolve.
Tasks 1 and 2 cover its inputs. Only the browser checklist covers the wiring.

- [ ] Implement.
- [ ] `npx tsc --noEmit -p .` from the repo root → exit 0. This task only adds code, and the local `ReadySeed` in
  `useCreateDraftEntry.ts` does not clash with the newly exported one.

### Task 4: wire the page and hooks, delete the sidecar store

**Files:** modify `components/CreatePublicationPage.tsx`, `hooks/useCreateDraftEntry.ts`,
`hooks/useWizardProblemTargets.ts`.

**`components/CreatePublicationPage.tsx`:**
- Replace the `useCallback` `loadPublicationIntoDraft` with a module-level `async function loadDraft(id: string): Promise<void>`
  placed next to `landOnResumeStep()`. It fetches the publication and, when the detail has a playlist, the playlist
  too, keeping today's try/catch around that. Then it calls
  `usePublicationDraftStore.getState().openDraft(detailToDraft(detail, playlist))`.
- Its three callers keep their own step handling:
  - the `?id=` effect calls `landOnResumeStep()`
  - `handleRetryResume` calls `landOnResumeStep()`
  - `handleReloadFromServer` sets no step
- Remove `loadPublicationIntoDraft` from the `?id=` effect's dependency array.
- Delete these selectors and their uses: `setPublicationId`, `setBasicInfo`, `setAssetItems`, `setChannelIds`,
  `setGroupIds`, `setGroupNamesById`, `setSchedule`. **Keep `setStep`.**

**`hooks/useCreateDraftEntry.ts`:**
- Delete the local `applySeed` function and the `ReadySeed` type.
- Call `usePublicationDraftStore.getState().applySeed(seed, ready)` at its two call sites.
- Import `ReadySeed` from `../seed-resolver`.

**`hooks/useWizardProblemTargets.ts`:**
- Delete `useLoadedTargets`, `showProblemTargets` and `useLoadProblemTargets`.
- Add `useRefreshProblemTargets(input: { hasHydrated: boolean; idParam: string | null }): void`. It is an effect on
  `[input.hasHydrated, input.idParam]`, which is the full dependency list `react-hooks/exhaustive-deps` expects. It
  acts only on the first run where `hasHydrated` is true; a ref set on that run guards every later run.
  1. Read `id = usePublicationDraftStore.getState().publicationId`. Stop if `id` is null, or if
     `input.idParam && input.idParam !== id`. In that case the `?id=` load runs and `openDraft` sets the targets.
  2. `fetchPublication(id).then((detail) => { … })`. Inside, **write only if the Draft is still that Draft**:
     `if (usePublicationDraftStore.getState().publicationId === id) setProblemTargets(problemTargets(detail.publication_targets ?? []))`.
     Comment it in one line: entry may cancel or seed over the Draft before the fetch returns.
  3. `.catch(() => {})`, keeping today's comment: Publish still refuses a bad target by name.
  - Write to the store only inside `.then()`. The repo's React Compiler lint rejects a synchronous setState in an
    effect body.
- `useWizardProblemTargets()` reads `s.problemTargets` from the draft store. Its `channelIds` filter and `remove()` do
  not change.
- In the page, replace `useLoadProblemTargets(publicationId)` with `useRefreshProblemTargets({ hasHydrated, idParam })`.

**Imports that become unused** (neither `tsc` nor `eslint` errors on them here, so delete them by hand):
- `useCallback` in `CreatePublicationPage.tsx`. Its only use was `loadPublicationIntoDraft`.
- `create` and `type PublicationDetail` in `useWizardProblemTargets.ts`.
- `DEFAULT_IMAGE_DURATION_SECONDS`, `isImageAsset` if it is now unused, and `PublicationType` in
  `useCreateDraftEntry.ts`. Keep each one if a remaining line still uses it.

- [ ] Implement.
- [ ] `git grep -n "useLoadedTargets\|showProblemTargets\|useLoadProblemTargets\|loadPublicationIntoDraft" -- src`
  → no output.

### Task 5: verify, then report

Run from the repo root:
- [ ] `find src/features/media-workspace/publications -name '*.check.mts' -print0 | xargs -0 -n1 node > /dev/null`
  → exit 0. Every check lives at the top level of the folder. A failing check prints its assertion to stderr.
- [ ] `npx tsc --noEmit -p .` → exit 0.
- [ ] `npx eslint --max-warnings 0` on the 8 changed files → exit 0. If a warning already existed before this change,
  report it rather than fixing it. The 8 files are: `detail-mapping.ts`, `detail-mapping.check.mts`,
  `seed-resolver.ts`, `seed-resolver.check.mts`, `store/usePublicationDraftStore.ts`,
  `components/CreatePublicationPage.tsx`, `hooks/useCreateDraftEntry.ts`, `hooks/useWizardProblemTargets.ts`.
- [ ] Report back with `git diff --stat` and each command's result. **Do not run the browser checklist.** The owner
  decides how it gets run.

**Browser checklist** (localhost:3000, proxy → develop Core). It needs a Draft with a deleted Channel target, for
example `zz-0122b-draft` / `zz-0122b-tomb` on develop.

Steps 1, 3 and 6 need a **full page load**: type the URL into the address bar or reload. Do not reach these pages by
clicking. A client-side navigation keeps the wizard mounted, so hydration and entry do not run again.

The dev server runs React StrictMode. If opening a Draft by `?id=` lands on the wrong step, a pre-existing issue
with the `loadedIdRef` / `alive` pair in the `?id=` effect is the likely cause, not this change. Note it in the
report; it is out of scope.

1. **Open by `?id=`.** Open the Draft with `?id=`.
   - The notice names the deleted Channel.
   - The network log shows **one** GET of that publication.
   - There is no unsaved-changes marker.
2. **Playlist over image.** Start a new image-type draft and pick one image. Then open a Playlist-type Draft by `?id=`.
   - The type is Playlist.
   - The playlist and its items are all there.
   - There is no "pick content" error.
3. **Rehydrate on the same id.** Reload the tab of step 1 (same `?id=`, so the store already holds that id).
   - The notice is still there.
   - Exactly one GET of the publication, from the refresh hook.
4. **"โหลดใหม่" keeps the step.** Save in a second tab, then save in the first to get the revision-conflict banner.
   Note the step, then press "โหลดใหม่".
   - Same step.
   - The other tab's change is visible.
   - The notice is still there.
5. **Seed.** Use "ใช้ content นี้" from a Playlist editor.
   - The wizard lands on step 2.
   - The type is Playlist and that playlist is picked.
6. **Stale fetch cannot write.** Step 5 replaced the Draft, so first reopen the step-1 Draft by `?id=` (full load) and
   change nothing. Then, in the same tab, type `/media-workspace/program/create` with no query (full load). Entry
   finds a saved Draft with nothing unsaved and clears it, while the refresh hook's GET is still in flight. Wait for
   that GET of the publication to finish in the network log, then check localStorage
   `thunderone.publications.create-draft.v14`:
   - PASS if the key does not exist (`cancelDraft` clears storage).
   - PASS if it exists with `state.problemTargets` equal to `[]` and `state.publicationId` equal to `null`.
   - FAIL if `state.problemTargets` holds the deleted Channel.
   - The on-screen notice cannot show this, because it filters by the selected Channels.
