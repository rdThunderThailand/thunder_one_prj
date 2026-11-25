# 0126 — One table turns Core refusals into user text

Status: accepted (2026-11-25, owner decisions in chat, including the wording table after review).
**Workspace:** media
**Extends:** ADR 0114 (`cause` on `ClassifiedError`; `publish-cause.ts` stays the owner of publish causes).
**Amends:** ADR 0114 §5 wording of the `zones-unbound` message (§8 below).
**Relates to:** GitHub #460 (this decision), #456 (`UserFacingError`, fallback for unmatched errors),
#464 (architecture review round 2); ADR 0099 (channel activation guards); ADR 0122 (channel delete
refusals); ADR 0003 (`Already modified:` revision conflict).

## Context

Core sends no error code. Every refusal reaches the frontend as `{error: "<message>"}`, and
`requestApi` (`src/lib/api/media-api.ts`) turns it into `ApiError(message, status)`. The status is
a guess Core makes from the text (`api-utils.ts`: any "already" → 409), so the frontend has to read
the text. Core's `callMedia` only forwards a message that starts with one of these prefixes, and
replaces anything else with "Media operation failed":

`Invalid input:` · `not found:` · `Unauthorized` · `Permission denied` · `Already ` (so `Already exists:`,
`Already in use:`, `Already modified:`, `Already active:`)

Core's route handlers (`src/app/api/core/v1/media/**`) also throw their own `Invalid input: …`
(zod) without going through `callMedia`. Those messages reach the frontend the same way.

The rules that read this text live in at least nine places on `dev` @ 5fa687f8:

- `src/lib/api/api-error.ts`: `classifyApiError`, plus the exported predicates `isConflict` and
  `isDuplicateName`.
- `src/lib/api/publish-cause.ts`: `classifyPublishCause` and `inactiveChannelMessage` (ADR 0114, 0099).
- Feature parsers, each with its own patterns:
  - `channel-groups/services/channel-groups-api.ts`: `isSyncConflict`, `groupInUseNames`.
  - `channels/services/channels-api.ts`: `isChannelGroupSyncConflict`.
  - `channels/delete-refusal.ts`.
  - The `describe*Error` functions in `playlists/`, `compositions/` and `layouts/status-display.ts`.
  - `REASONS` in `publish-changes/publish-changes-api.ts`.
  - `isStaleDraftError` in `publications/hooks/usePublishDraft.ts`.
  - `parseUpdatePublishedError` in `publications/program-edit.ts`.
- About twelve components and hooks that branch on the message before calling `classifyApiError`
  (e.g. `CreateChannelModal`, `ChannelEditorPage`, `CreateEditGroupModal`, `LayoutEditorPage`).

What that costs:

- **Matching differs for the same text.**
  - The sync-group conflict has two predicates in two modules, one with three phrases, one with two.
    That is duplication, not a bug: the third phrase comes only from `media_channel_groups_set_members`
    / `_update`, which the Channels picker never calls.
  - `Already exists` and `Already modified` are matched with `startsWith` in one place and
    `includes` in another.
  - `unbound` is a full regex in `publish-cause.ts`, while `publish-changes` uses a bare `/unbound/`.
  - `/synchronized/` matches any message that mentions the word.
- **Where a parser applies differs by screen.** The Layout pages only send `Invalid input:`
  messages to `describeSaveError`; `useCompositionSave` also sends `Already*`.
- **Some matches can never fire.** "Live" here means raised by the latest definition of a function
  on Core `main` (prod) or `develop`, or thrown by a Core media route. A text that appears only in a
  replaced function body, or only in `_archive/`, is not live. By that test (checked on `origin/main`
  and `origin/develop`):
  - `media asset(s) are not approved`: no raise on either branch.
  - `direct-target publication on`: no raise on either branch.
  - `more than 4 zones`: no raise on either branch (the cap was removed).
  - `used by N publication`: no raise on either branch (marked legacy in the code).
  - `quarantin`: no raise on either branch (only in the help seed text).
  - `duplicate key` / `unique constraint`: unreachable, because `callMedia` replaces any message
    without a prefix.
  - The `Already exists` branch of `layouts/status-display.ts`: unreachable, because its callers only
    pass `Invalid input:` messages.
  - The `Already in use:` branch of `playlists/status-display.ts`: no raise on either branch, because
    `media_video_delete` was dropped (`20261104050001_media_asset_tombstone.sql`).
  - The `isDuplicateName` arm in `UngroupedChannelsTable.tsx`: no raise, because
    `media_channel_groups_set_members` never raises `Already exists:`.
- **The reverse case also exists.** `Already in use: this channel has Program or playback history…` is
  no longer raised on `develop` (`20261125080525_channel_tombstone.sql`), but `main` still raises it.
  It stays live until that Core change reaches prod. The opposite holds for `these channels were
  deleted — remove them from this Program:`, which is live on `develop` only.
- **Channels has no Thai copy.** Its errors are written in English beside the ladders.
- **Callers stay tied to the text.** A caller needs Core's text to decide what to *do* (bind the
  error to the name field, go back to step 1, ask for confirmation, save the draft as new), so it
  cannot stop reading the text until the classifier tells it which case it is.

## Decision

1. **`classifyApiError(err, fallback)` stays the one entry point.** Its signature does not change,
   so none of its ~90 call sites change for this reason. It takes no screen or entity context.
2. **The rules live in one table, keyed by Core refusal, not by entity.** The table goes in
   `src/lib/api/core-refusal-rules.ts`, next to `publish-cause.ts`. One Core message has one row, so
   the sync-group conflict is matched once, however many screens raise it.
3. **Every rule is bound to a Core prefix.** A rule names one of the prefixes `callMedia` forwards,
   then a phrase or regex specific to that refusal. There are no free substrings like
   `/synchronized/` or `/unbound/`. A check asserts that every rule starts with an allowed prefix.
   The prefix rule does not cover `publish-cause.ts`. Its matchers stay as ADR 0114 wrote them, except
   for two edits: the dead `direct-target publication on` branch is deleted (§7), and the unbound-Zone
   line changes (§8). The table only calls it.
4. **The result says what happened, in Thai, and how to tell the cases apart:**

   ```ts
   interface ClassifiedError {
     kind: ApiErrorKind;          // unchanged set
     message: string;             // Thai, ready to show; never Core's text
     reason?: RefusalReason;      // closed union; only where a caller acts differently
     names?: string[];            // only where a caller needs them apart from `message` (today: program-refused)
     part?: ProgramPart;          // the `[details]`/`[content]`/... tag Core puts on Program edit refusals
     cause?: PublishCause;        // ADR 0114, unchanged
   }
   ```

   - **Callers branch on `kind`, `reason`, `cause` and `part` only, and never read `err.message` again.**
   - A `reason` exists only where some caller does something other than showing `message`. The first
     set is `duplicate-name`, `needs-confirm` (Core wants the display mismatch confirmed),
     `stale-draft` and `program-refused` (the bulk Publish changes wrapper). The plan confirms the set
     against each caller.
   - The predicates `isConflict`, `isDuplicateName`, `isSyncConflict` and `isChannelGroupSyncConflict`
     are deleted.
5. **Wrapped refusals are unwrapped and classified again.** Publish changes raises
   `Invalid input: program "<name>" — <inner message>`, where the inner message has its own prefix.
   - The table strips the wrapper and runs the inner message through itself.
   - It returns the inner result with `reason: "program-refused"` and `names: [<name>]`.
   - Program edit's `[part]` tag sets `part`. Core also writes `[schedule]` into some messages itself,
     and `publish-cause.ts` matches on it, so `classifyPublishCause` always sees the raw message. Only
     when that gives no cause is the message classified again with the tag stripped.
6. **What moves into the table, and what stays:**
   - **Moves in:**
     - `isConflict`, `isDuplicateName`
     - Both sync-group predicates
     - `groupInUseNames`
     - `delete-refusal.ts`
     - The `describe*Error` functions of the three `status-display.ts` files. The files stay, because
       they also hold the badge maps of ADR 0125.
     - `REASONS` and `describePublishChangesError`
     - `isStaleDraftError`
     - `parseUpdatePublishedError`
     - The caller ladders' own matches, such as `isPlayerChangeBlocked` and `confirm to continue`.
   - **Stays:**
     - `publish-cause.ts` (ADR 0114). The table calls it for publish causes and channel guards, as
       `classifyApiError` does today.
     - `UserFacingError` (#456) still passes through unchanged.
     - `Already active:` is still treated as success, for both `media_publication_activate` and
       `media_channel_activate`. A repeated activate has already happened.
7. **A rule with no live Core source is deleted, not kept "just in case".**
   - Each rule's check needs a real Core message (decision 9). Live means the test defined in Context:
     `main` or `develop`.
   - The branches listed there as never firing are deleted.
   - A text that is live on only one branch keeps its rule, and its fixture names that branch.
   - If Core adds a text later, its rule comes back with a fixture.
8. **What the user sees changes in these ways, and no others:**
   - **The Channels ladders' English messages become Thai,** matching what #456 did for Channel Groups.
     That covers duplicate name, display mismatch, the blocked Player change, and the three
     delete-refusal lines. Sentences are Thai; labels and headings stay English.
   - **A non-`ApiError` that is not a transport failure becomes `rejected`, not `retryable`.** That is
     a bug in the frontend, which retrying cannot fix. This fixes the contradiction #456 left between
     the comment and the code.
     - Transport failures stay `retryable`: axios `ERR_NETWORK`/`ECONNABORTED`.
     - `tus-upload.ts` uses `fetch`, so it marks its own network failure with `ERR_NETWORK`. A bare
       `TypeError` is not treated as transport, because the repo throws `TypeError` for malformed
       payloads, and bugs throw it too.
     - The only Media consumer of `retryable` is the resume retry button on `CreatePublicationPage`.
       It keeps working for transport failures.
   - **Convergence.** One Core message gets one Thai line on every screen, so the screens that word it
     differently today change. Each before → after is in the plan's signed-off wording table.
     - **The sync-group conflict** shows one line on all four screens.
     - **`zone(s) … are unbound`** comes from both publish and Layout activate, so its line is neutral,
       with no "before publishing". The line is "Layout ยังไม่ได้ผูก Content ให้ Zone: X กรุณาผูก Content ให้ครบทุก Zone". This amends ADR 0114's wording. The publish pages keep the
       `zones-unbound` fix button from `cause`.
     - **`these publications still target this channel`** comes from both delete and deactivate, so its
       line names no verb.
   - **Channels becomes Thai.** That covers its refusal lines and the English `fallback` strings its
     callers pass, as #456 did for Channel Groups. A Channel `Already active:` gets a
     Thai line as well; today `ChannelLifecycleActions` shows it raw. It stays `already-active`.
   - **The generic `Invalid input:` line runs before a caller's `fallback`.** Parser fallbacks such as
     "บันทึก Layout ไม่สำเร็จ…" therefore no longer show for `Invalid input:` errors. The generic line
     drops "แต่ละขั้นตอน", because Template and Layout pages have no steps. It becomes
     "ข้อมูลที่กรอกยังไม่ครบหรือไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่" on every screen.
   - **Playlist trash and Publish changes** show the specific 403, 404 and connection lines, instead
     of the one fixed line they show for every error today.
   - **Program edit** refusals tagged `[part]` show Core's raw English today; they become Thai.
     - Some newly carry a `cause` and its fix button: `composition not found` → `no-content`,
       `channel not found` → `targets`.
     - `use End program` stays its own rule and is not `schedule-ended`.
9. **One check file, real Core text.**
   - `src/lib/api/api-error.check.mts` absorbs the error asserts of the three `status-display.check.mts`
     files, of `delete-refusal.check.mts` and of `program-edit.check.mts`. Each file keeps its other
     asserts.
   - Every rule gets a fixture copied from a live definition on Core `origin/main` or `origin/develop`.
     Its comment names the RPC and the branch.
   - The check is run with `node <file>.check.mts`. No test runner is added.

## Not chosen

- **B: a translator per entity behind one shared interface** (`channels/errors.ts`, …). This puts
  each rule near its domain, but it is the scattering this ADR removes, with a type on top. A Core
  message raised from two entities (the sync-group conflict) would still be matched twice.
- **C: ask Core for error codes first.** Codes are the right end state, but they mean work in nearly
  every RPC and a Core release before the frontend can start. They are the upgrade path instead (see
  Consequences).
- **A `context` (screen or entity) argument on `classifyApiError`.** No Core message needs different
  meaning per screen today, because Core's text already names the entity. Wording that differs per
  screen is the caller's, chosen by `reason`.
- **Exporting predicates instead of `reason`.** That leaves two ways to ask the same question and lets
  callers keep matching text.
- **A fix path (link to the blocking Program, etc.) in this ADR.** It is new behaviour with its own UI,
  so it gets its own issue. ADR 0114 already rejected routes inside the classifier, because the
  classifier does not know the page.
- **Pages outside Media Workspace** are out of scope. Any site the inventory finds there is listed in
  the plan, not moved.

## Consequences

- **Adding a refusal is one place.** A new Core refusal is one row plus one fixture. A caller that
  needs a new behaviour adds a `reason` member, and the compiler finds every `switch` that must
  handle it.
- **The table depends on Core's text.** A reworded Core message falls through to the generic
  `Invalid input:` line or the caller's fallback. It never shows the raw text, but the specific line
  is lost until the rule is updated. The fixtures make the dependency visible; they do not prevent it.
- **Upgrade path.** If Core starts sending a code, each row's matcher becomes "code X", and no caller
  changes.
- **`api-error.ts` stays small.** The rules live in `core-refusal-rules.ts`, which may grow past 300
  lines. If it does, it splits by Core prefix, never by entity.
