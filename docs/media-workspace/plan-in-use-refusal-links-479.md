# Plan — an in-use refusal links to each blocker (#479)

Decision: `docs/adr/0130-an-in-use-refusal-links-to-each-blocker.md`. Read it first. Read ADR 0126 §4
and ADR 0127 §1–§5 for the modules you extend. Size M, one PR.

- Branch `feat/479-in-use-refusal-links`, base `dev` (squash, ADR 0118).
- **Frontend only.** The Template links need a Core field (draft issue 1), and the Group rule is a
  Core follow-up (draft issue 2). Both are at the end of this plan and are not filed by the executor. The frontend works without it: it shows the current message.

## Ground rules for the executor

- **No commits, no pushes, no database.** Do not commit, push, open a PR or touch any database.
  Leave the work uncommitted and report back.
- **Stay inside Files touched.** Change only the files listed under **Files touched**. If another file
  needs a change (for example `tsc` flags a reader this plan missed), stop and report the file and
  line. Do not widen the scope yourself.
- **Design questions go back to the owner.** If you hit one this plan does not answer, stop and report
  it. Do not decide it.
- **House rules.** Follow `AGENTS.md` and the code around you:
  - JSX one element per line, no `any`, no dead code, no new dependencies, files ≤ 300 lines.
  - Tokens only: no raw palette classes, no hex.
  - Checks are `*.check.mts` files run with `node <file>`. There is no test runner; do not add one.
- **Line numbers may have moved.** They are from `dev` @ cb852bca. Find the code by the quoted text.
- **ESLint and `useEffect`.** ESLint forbids a synchronous `setState` in a `useEffect` body. Set state
  only inside `.then()` / `.catch()` of a promise chain, with an `alive` flag (see
  `DeleteChannelDialog.tsx` for the pattern).

## Target shape

```ts
// src/lib/api/core-refusal-rules.ts
export type RefusalReason = "duplicate-name" | "needs-confirm" | "stale-draft" | "program-refused" | "in-use";

// src/features/media-workspace/in-use/in-use-links.ts (pure, no React, no runtime imports)
export type InUseLink = { href: string; label: string };
export function programLinks(rows: { id: string; name: string }[]): InUseLink[];   // every status → detail page
export function groupDeleteLinks(rows: { id: string; name: string; status: string; effective_status?: string }[]): InUseLink[];
export function playlistTrashLinks(programs: { id: string; name: string; status: string }[]): InUseLink[];
export function templateZoneLinks(
  compositions: { id: string; name: string; zone_ids: string[]; in_trash: boolean }[] | undefined,
  removedZoneIds: string[],
): InUseLink[];
export function removedZoneIds(loaded: string[], current: { id?: string }[]): string[];
export const IN_USE_LEAD: Record<"playlistTrash" | "groupDelete" | "channel" | "templateZone", string>;

// src/features/media-workspace/in-use/InUseRefusal.tsx ("use client")
export function InUseRefusal(props: {
  message: string;                      // ClassifiedError.message (fallback, names included)
  lead: string;                         // IN_USE_LEAD[...]
  load: () => Promise<InUseLink[]>;     // called once on mount
  className?: string;
}): JSX.Element;
```

## Steps

### 1. Classifier rows — `src/lib/api/core-refusal-rules.ts`

1. Add `"in-use"` to `RefusalReason`.
2. Add `reason: "in-use"` to these rows. Leave each `message` unchanged; `rejected(msg, { reason: "in-use" })`:
   - `/^playlist is used by an active or draft publication: (.+)$/`
   - `/^remove this group from these publications first: (.+)$/`
   - `/^these publications still target this channel: (.+)$/`
   - `/^zone is used by composition\(s\) (.+)/`
3. Do **not** tag `/^cannot remove .+ while these publications target this channel/` or
   `/^remove this channel from its groups before deleting: (.+)$/`.
4. In the row `match: /^playlist not found for this tenant/` with `part: "content"`, change `build` to
   `() => ({ kind: "not-found", message: NO_CONTENT_MESSAGE, cause: "no-content" })`.

Fixtures, in `src/lib/api/core-refusal-rules.check.mts`:

- **The four in-use rows.** Each has a fixture today. Each now asserts `reason: "in-use"` and keeps
  its `message` assert. Extend the row shape the file uses (it already asserts `cause`) with `reason`.
  If the shape has no `reason` key, add one the same way.
- **The `[content]` line** (`"not found: [content] playlist not found for this tenant"`) changes from
  `cause: undefined` to `cause: "no-content"`.
- **The untagged `not found: playlist not found for this tenant` asserts** (around line 154) must
  stay as they are. They prove the cause applies only to the tagged message.
- **Add one negative assert:** the `cannot remove … while these publications target this channel`
  fixture has no `reason`.
- **Name the shared Core functions.** Over each in-use fixture, add a one-line comment naming the
  Core function both the refusal and the read use: `playlist_program_ids`,
  `channel_blocking_publication_rows`, `publication_targets.group_id`, and `composition_zones` by
  deleted Zone. That keeps ADR 0130's "same set" visible.

### 2. Pure helpers — `src/features/media-workspace/in-use/in-use-links.ts` (new)

- **`programLinks(rows)`.** Maps each row to `{ href: `/media-workspace/program/${row.id}`, label: row.name }`.
  Every status goes to the detail page, Draft included (ADR 0130 §3). The wizard cannot delete a
  Draft, so it is not a link target.
- **`groupDeleteLinks(rows)`.** Same as `programLinks`, with a label suffix:
  - `" (Cancelled)"` when `status === "cancelled"`.
  - Otherwise `" (Ended)"` when `effective_status === "ended"`.
  - No suffix for any other row.
  - Rows come from `PublicationListItem`, which has `status` and `effective_status`.
- **`playlistTrashLinks(programs)`.** Keeps the rows whose **stored** `status` is `"draft"` or
  `"active"`. Do not filter on `effective_status` or `display_status`. Then runs `programLinks`.
  Core's refusal counts `status IN ('draft','active')`.
- **`removedZoneIds(loaded, current)`.** Returns the ids in `loaded` that no zone in `current`
  carries as `id`.
- **`templateZoneLinks(compositions, removed)`.**
  - Returns `[]` when `compositions` is `undefined`, because Core is not deployed yet.
  - Otherwise keeps the compositions whose `zone_ids` include any id in `removed`.
  - Maps each to `{ href: /media-workspace/layouts/${id}, label: in_trash ? `${name} (ในถังขยะ)` : name }`.
- **`IN_USE_LEAD`.** The four short lines, copied word for word from ADR 0130 §3:
  - `playlistTrash`
  - `groupDelete`
  - `channel` (delete and deactivate share it)
  - `templateZone`
- **Imports.** Only `import type` is allowed, so the check runs under plain `node`.

Write `src/features/media-workspace/in-use/in-use-links.check.mts` (new), with `node:assert` only:

- **`programLinks`.** A Draft row gets `/media-workspace/program/<id>`, not the wizard URL.
- **`groupDeleteLinks`.** A cancelled row gets "(Cancelled)". An active row with
  `effective_status: "ended"` gets "(Ended)". A live row gets no suffix.
- **`playlistTrashLinks`.** A cancelled row is dropped. An `active` row whose `effective_status` is
  `ended` is kept, because the filter reads stored status.
- **`removedZoneIds`.** A zone without an `id` (new) is ignored. A kept id is not returned.
- **`templateZoneLinks`.**
  - `undefined` gives `[]`.
  - A composition binding only kept zones is dropped.
  - A trashed one gets the suffix.

### 3. The component — `src/features/media-workspace/in-use/InUseRefusal.tsx` (new)

- **Data flow.** The component is `"use client"`.
  - On mount it calls `load()` once, inside a promise chain with an `alive` flag. On success it stores
    the links. On failure it does nothing, so the fallback stays.
  - Use `useEffect(…, [])` with the repo's `// eslint-disable-next-line react-hooks/exhaustive-deps`
    above the deps line, as `LayoutEditorPage.tsx` does. Callers remount the component per refusal,
    because every caller clears its error before retrying, so `load` never needs to be a dependency.
- **Before the read lands, or when it gave `[]`.** Render `<p role="alert" className={…}>{message}</p>`
  exactly as the caller renders its error today. The caller passes its current classes through
  `className`.
- **When links arrived.**
  - Render `<div role="alert" className={className}><p>{lead}</p><ul>…</ul></div>`. Never put the
    `<ul>` inside a `<p>`.
  - Each link is `<Link href target="_blank" rel="noreferrer" className="text-xs font-medium text-primary underline">`,
    the classes `PublishErrorFix.tsx` uses.
  - Use one `<ul>` with `<li>` per link, `mt-1 flex flex-wrap gap-x-3 gap-y-1`.
- **Size.** Keep it under ~50 lines. It has no other states and no retry button.

### 4. Playlist Trash — `src/features/media-workspace/playlists/components/PlaylistsListDialogs.tsx`

- **State.** Add `const [trashError, setTrashError] = useState<ClassifiedError | null>(null)`.
- **In `submit`.**
  - Call `setTrashError(null)` before the request.
  - In `catch`, when `action === "trash"`, classify. If `classified.reason === "in-use"`, call
    `setTrashError(classified)` and **do not** call `onError`, so the dialog stays open. Any other
    trash failure still calls `onError(classified.message)` as today.
  - `move` and `permanent-delete` are unchanged.
- **Rendering.** Under the trash paragraph, when `trashError` is set, render
  `<InUseRefusal key={…} message={trashError.message} lead={IN_USE_LEAD.playlistTrash} load={() => fetchPlaylistPrograms(target.id).then(playlistTrashLinks)} className="mt-3 text-sm text-error" />`.
  - No `key` is needed. `setTrashError(null)` before the request unmounts the component, so a retry
    mounts it again and re-reads.
  - `fetchPlaylistPrograms` is in `../services/playlists-api`.
- **The Move to Trash button stays enabled**, so the operator can retry after fixing in the other tab.

### 5. Channel Group — `src/features/media-workspace/channel-groups/components/ChannelGroupInspector.tsx`

- **State.** Change `error` to `useState<ClassifiedError | null>(null)`. The two `setError(...message)`
  calls become `setError(classifyApiError(...))`.
- **Rendering.** Where `{error && <p role="alert" …>{error}</p>}` renders:
  - When `error.reason === "in-use"`, render `<InUseRefusal … className="mt-3 text-sm text-error" />`
    instead.
  - Pass `lead={IN_USE_LEAD.groupDelete}` and
    `load={() => fetchPublicationsPage({ group_id: group.id }).then((page) => groupDeleteLinks(page.publications))}`.
  - Otherwise render `error.message` as today.
- **The fetch.** `fetchPublicationsPage` is in
  `@/features/media-workspace/publications/services/publications-api`. Omit `limit`, which means
  every row, and add no status filter: Core's refusal ignores status (ADR 0130 Consequences).

### 6. Channel — three files under `src/features/media-workspace/channels/components/`

- **The shared load.**
  `load={() => fetchChannel(channelId).then((d) => programLinks(d.blocking_programs))}`.
  `BlockingProgram` is `{id, name}`, which is all `programLinks` needs.
- **`DeleteChannelDialog.tsx`.**
  - `error` becomes `ClassifiedError | null`. `confirm`'s catch stores the classified error.
  - Render `<InUseRefusal lead={IN_USE_LEAD.channel} … className="mt-3 text-sm text-error" />` when
    `reason === "in-use"`, else `error.message`.
  - Read the Channel again in `load`. Do not reuse `detail`: it was loaded when the dialog opened.
- **`ChannelLifecycleActions.tsx`.**
  - `error` is already a `ClassifiedError`.
  - Where it renders `{error.message}`, render `InUseRefusal` when `error.reason === "in-use"`, with
    `className="mt-2 text-sm text-error"`.
  - Do not call `onChanged` with the re-read detail. It would replace the editor's Channel state.
- **`ChannelRowActionsMenu.tsx`.**
  - Store the `ClassifiedError`, not `.message`.
  - When `reason === "in-use"`, render the message, then one link
    `<Link href={`/media-workspace/channels/${channel.id}/edit`} target="_blank" rel="noreferrer" …>เปิด Channel</Link>`
    under it, inside the popover.
  - Do not use `InUseRefusal` here (ADR 0130 §4).

### 7. Editor lifecycle — `src/features/media-workspace/editor-lifecycle/`

- **`editor-lifecycle.ts`.**
  - `LifecycleState` gets `saveReason: RefusalReason | null`. Use `import type { RefusalReason } from "@/lib/api/core-refusal-rules"`.
    If the `@/` alias does not resolve under `node`, use the relative path. It is type-only and erased.
  - `save-failure` gets `reason?: RefusalReason`.
  - The reducer sets `saveReason: event.reason ?? null` on the error branch, and `null` on the
    conflict branch, `reset`, `save-start` and `clear-error`.
  - `initialLifecycle` starts it at `null`.
- **`useEditorLifecycle.tsx`.**
  - The `run` catch passes `reason: classified.reason`.
  - The reload catch passes no reason.
  - Expose `saveReason: state.saveReason` on `EditorLifecycle`, documented next to `saveError`.
- **`editor-lifecycle.check.mts`.** Add asserts:
  - A failure with `reason: "in-use"` sets `saveReason`.
  - `save-start` and `clear-error` clear it.
  - A conflict leaves it `null`.

The Playlist and Composition editors do not read `saveReason`. Do not change them.

### 8. Template editor — `src/features/media-workspace/layouts/`

- **`types/index.ts`.** Add to `LayoutListItem`:
  `compositions?: { id: string; name: string; zone_ids: string[]; in_trash: boolean }[];`
  with a comment in the file's own style: "Absent until Core returns it from `media_layout_get`
  (ADR 0130 §5)."
- **`components/LayoutEditorPage.tsx`.**
  - Where `{lifecycle.saveError && (…)}` renders, keep the banner `div`. Inside it:
    - When `lifecycle.saveReason === "in-use" && draft.id`, render
      `<InUseRefusal message={lifecycle.saveError} lead={IN_USE_LEAD.templateZone} load={() => fetchLayout(id).then((d) => templateZoneLinks(d.compositions, removedZoneIds(d.zones.flatMap((z) => (z.id ? [z.id] : [])), draft.zones)))} className="text-sm text-error" />`.
      `id` is `draft.id`, captured in a `const` so TypeScript keeps it narrowed in the closure.
    - The removed Zones come from the Zones the re-read returns, not from what the page loaded. That
      is Core's own condition: Zones stored on the Layout that the payload no longer carries.
    - Otherwise keep the `<p>`.
  - The banner unmounts on the next `save-start`, because the error clears, so a retry re-reads.
  - **Size.** The file is 284 lines. If this pushes it past 300, move the banner into a small
    component in `layouts/components/` and list it in your report. That is the only new file you may
    add beyond **Files touched**.

### 9. Checks (run all, paste the output)

```bash
node src/lib/api/core-refusal-rules.check.mts
```

```bash
node src/lib/api/api-error.check.mts
```

```bash
node src/features/media-workspace/in-use/in-use-links.check.mts
```

```bash
node src/features/media-workspace/editor-lifecycle/editor-lifecycle.check.mts
```

```bash
npx tsc --noEmit
```

```bash
npx eslint src/lib/api src/features/media-workspace/in-use src/features/media-workspace/playlists src/features/media-workspace/channel-groups src/features/media-workspace/channels src/features/media-workspace/editor-lifecycle src/features/media-workspace/layouts
```

```bash
npx next build
```

CI (#483) runs install, tsc, eslint and `next build` on the PR.

### 10. Browser checklist (owner chooses who runs it, CLAUDE.md §3)

Run on local dev against develop data, as a company_admin. Make the fixtures yourself (`zz-479-*`
names) and list them in the report for cleanup. Each line is a step and the expected result.

1. **Playlist Trash.** Use a Playlist that an Active Program and a Draft Program both use, one of them
   through a Layout Zone.
   - Move to Trash. The dialog stays open, with the Playlist short line and two links.
   - Both links open the Program detail page in a new tab, the Draft one included.
   - End the Active Program and delete the Draft from those tabs, then retry. The Playlist moves to
     Trash.
2. **Channel Group delete.** Use a Group that a live Program and an Ended (or Cancelled) Program both
   target. Delete it.
   - The inspector shows the Group short line and two links.
   - The Ended one is labelled "(Ended)" or "(Cancelled)"; the live one has no suffix.
3. **Channel delete.** Use a Channel that an Active Program targets.
   - Its Delete dialog shows the short line and the link.
   - The Channel editor's Deactivate shows the same. For this, make the Program after opening the
     editor, because the button is disabled when the editor already knows of a blocker.
   - The row menu's Disable shows the message plus "เปิด Channel", which opens `/channels/<id>/edit`
     in a new tab.
4. **Template Zone delete.** Delete a Zone that a Layout binds, then Save.
   - The banner shows the current message with names, because develop Core has no `compositions`
     yet.
   - After the Core field is deployed: the short line and one link per Layout that binds that Zone.
     A Layout using the Template without binding that Zone is not listed.
5. **Program edit.** On an Active Program, change content to a Playlist that nothing else uses. In
   another tab, move that Playlist to Trash, then permanently delete it from Trash. Then Save the
   Program.
   - The page alert shows the no-content line with "เลือกเนื้อหา".
   - Clicking it scrolls to the content card.
   - If you cannot produce the refusal, mark this item unverified and say why.
6. **Regression.** A Trash refusal that is not in-use, such as a Playlist created by a Program, still
   closes the dialog and shows the line on the list page.

### 11. Report back

- `git status` and `git diff --stat`.
- The output of every check in step 9.
- Each fixture assert you changed in step 1 and why.
- Any file outside **Files touched** that you had to stop for, or the one banner component of step 8.

## Not in this plan

- **Batch Trash** (`use-trash-batch.ts`), which reports a count only.
- **The Player-change refusal and the "remove this channel from its groups" refusals.**
- **The Layout (Composition) editor's own Template Zone refusal** (`save-composition.ts`). It keeps
  the message with names.
- **The Core changes below.** When Core issue 2 ships, a follow-up adds
  `display_status: "not_ended"` to the Group read in step 5 (ADR 0130 Consequences).

## Files touched

New:

- `src/features/media-workspace/in-use/in-use-links.ts`
- `src/features/media-workspace/in-use/in-use-links.check.mts`
- `src/features/media-workspace/in-use/InUseRefusal.tsx`

Changed:

- `src/lib/api/core-refusal-rules.ts`
- `src/lib/api/core-refusal-rules.check.mts`
- `src/features/media-workspace/playlists/components/PlaylistsListDialogs.tsx`
- `src/features/media-workspace/channel-groups/components/ChannelGroupInspector.tsx`
- `src/features/media-workspace/channels/components/DeleteChannelDialog.tsx`
- `src/features/media-workspace/channels/components/ChannelLifecycleActions.tsx`
- `src/features/media-workspace/channels/components/ChannelRowActionsMenu.tsx`
- `src/features/media-workspace/editor-lifecycle/editor-lifecycle.ts`
- `src/features/media-workspace/editor-lifecycle/editor-lifecycle.check.mts`
- `src/features/media-workspace/editor-lifecycle/useEditorLifecycle.tsx`
- `src/features/media-workspace/layouts/types/index.ts`
- `src/features/media-workspace/layouts/components/LayoutEditorPage.tsx`

Docs, already written with this plan (ship them in the same PR, do not edit):

- `docs/adr/0130-an-in-use-refusal-links-to-each-blocker.md`
- `docs/adr/0127-one-editor-lifecycle-module-for-the-three-editors.md` (the `**Amended by:**` line)
- `docs/media-workspace/plan-in-use-refusal-links-479.md`

Read, not changed: `src/lib/api/api-error.ts`, `src/lib/api/publish-cause.ts`,
`publications/publish-cause-fix.ts`, `publications/components/PublicationEditPage.tsx` (the `no-content`
button already exists there), `publications/components/PublishErrorFix.tsx`.

## Overlap

- **#426 option B (Create wizard).** It touches `CreatePublicationPage.tsx`, `CreateCancelButton.tsx`,
  `usePublishDraft.ts` and `useCreateDraftEntry.ts`. This plan touches none of them, and none of its
  files appear in that list.
  - Shared risk: if #426B adds a `RefusalReason` member, both PRs edit the same union line in
    `core-refusal-rules.ts`. The merge conflict is one line; keep both members.
- **ADR 0127 / #459 (merged).** Step 7 extends its module. No open PR touches
  `editor-lifecycle/`, as checked 2026-11-26 against `dev` @ cb852bca.
- **ADR 0129 / #463 (merged).** It changed Channel lifecycle readers. Step 6 edits the error rendering
  of the same three Channel files, not their lifecycle logic.

## Core draft issues (for the owner to file in Thunder_Core; the executor does nothing here)

### Core draft issue 1 — `media_layout_get` lists the Layouts of a Template

**Title:** `media_layout_get` returns the Compositions of a Layout with their bound Zones (One ADR 0130)

**Why.** ThunderOne's Template editor links the zone-delete refusal
(`Invalid input: zone is used by composition(s) …`, `media_layout_upsert`) to each Layout that blocks
it. No read returns which Compositions bind which Zones of a Layout. `media_layout_get` has only
`usage_count`.

**Change.**

- **One function.** `public.media_layout_get(p_tenant_id uuid, p_layout_id uuid)` adds one key to its
  `jsonb_build_object`:

  ```sql
  'compositions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
          'id', c.id, 'name', c.name, 'in_trash', c.deleted_at IS NOT NULL,
          'zone_ids', COALESCE((SELECT jsonb_agg(cz.layout_zone_id) FROM media_core.composition_zones cz
                                WHERE cz.composition_id = c.id), '[]'::jsonb)
      ) ORDER BY c.name, c.id)
      FROM media_core.compositions c
      WHERE c.layout_id = la.id AND c.tenant_id = p_tenant_id), '[]'::jsonb)
  ```

  Both columns exist: the baseline's `compositions_tenant_live_name_key` is `UNIQUE (tenant_id, name)
  WHERE deleted_at IS NULL`.
- **Where it is defined.** It lives in `20261026235959_baseline_from_prod.sql` only, on both `main`
  and `develop`. The signature is unchanged, so `CREATE OR REPLACE` in a new migration is enough, with
  no `DROP`. Still restate the grants after it, as neighbouring migrations do:
  `REVOKE ALL ON FUNCTION public.media_layout_get(uuid, uuid) FROM PUBLIC, anon, authenticated;` and
  `GRANT EXECUTE ON FUNCTION public.media_layout_get(uuid, uuid) TO service_role;`.
- **Do not change `usage_count`.** It counts the same rows, and the frontend reads it for the
  Change-all banner.
- **Release.** Additive. ThunderOne ships first and shows the old message until this is on prod.

### Core draft issue 2 — a Group whose Programs have all ended can be deleted

**Title:** `media_channel_groups_delete` counts only Programs that have not ended (One ADR 0130)

**Why.**

- **The refusal counts every status.** `Already in use: remove this group from these publications
  first: …` (baseline, `media_channel_groups_delete`) counts Programs of every status, Ended and
  Cancelled included.
- **Nothing can be done to those Programs.**
  - `media_publication_cancel` takes only `active`.
  - `media_publication_delete` takes only `draft`.
  - `media_publication_update_published` refuses an ended Program.
- **So the Group can never be deleted** once any Program has used it and ended.
- **Channels already do this.** `channel_blocking_publication_rows` counts only Active and Scheduled
  Programs.

**Proposed rule** (owner-approved direction, 2026-11-26; Core decides the exact status set):

- **Block on live Programs only.** A Group is blocked only by Programs that have not ended: Draft,
  Active, and Scheduled. Use the same status helper the Programs list uses for `not_ended`.
- **Leave history alone.** The publication targets of ended Programs keep their `group_id`. Decide
  whether the FK needs `ON DELETE SET NULL` or a tombstone like Channels (ADR 0122 / Core
  `20261125080525_channel_tombstone.sql`). That is the real design question in this issue.
- **Add a tenant filter.** The same query joins `publication_targets` → `publications` without
  `tenant_id`. The Group is tenant-checked earlier, so this is probably not a leak, but add the
  filter while there (unverified).

**ThunderOne follow-up when this ships:** the Group read in plan step 5 adds
`display_status: "not_ended"`, so the links match the new refusal.
