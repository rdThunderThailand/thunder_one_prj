# Channel Management UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Channels placeholder with the approved 14.1 management UI—list, detail panel, create, and edit—matching the supplied mockups while exposing only Physical Device capabilities that have a real frontend contract.

**Architecture:** Keep the feature inside `src/features/channels`: pure domain/view-model logic, one typed API adapter, and client components rendered by thin App Router pages. The UI calls the future `/media/channels` contract and renders a precise unavailable/error state when Thunder_Core does not provide it; it must never substitute `/media/screens` rows for Channels or report a fake successful write. Device candidates continue to come from the existing physical-screen read endpoint and active playlists from the shared media API.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4, existing axios transport, Node assertion checks.

**Spec:** `docs/channels/plan-channels-monitoring.md` plus ADRs `docs/adr/0030-channel-endpoint-membership-and-active-exclusivity.md`, `docs/adr/0033-channel-lifecycle-retirement-and-concurrency.md`, `docs/adr/0034-channel-display-expectation-and-target-snapshot.md`.

## Global Constraints

- Phase 14.1 supports Physical Devices only; do not render Import Channels, Channel Groups, Register New Device, Preview, Capture, Restart, or History.
- Lifecycle and operational health are distinct: lifecycle is `draft | active | inactive`; health is `online | warning | degraded | offline | null`.
- Zero-member Channels have `health = null`, never `online` or `offline`.
- Channel Category is `dooh | in_store | online | social`; launch UI exposes `dooh` and `in_store` only.
- Channel Type is a reference value, not the Category enum.
- Default Playlist is creation/edit prefill only; do not present it as runtime fallback or auto-play.
- Expected orientation mismatch blocks assignment; expected resolution mismatch is a warning contract, not an automatic rejection.
- Channel writes use `revision: integer` and surface `Already modified:` through the existing conflict classifier.
- No new dependency, generated-file edit, lockfile edit, environment edit, Thunder_Core edit, database migration, or production write.
- Preserve existing sidebar/topbar shell and reuse existing `Button`, `Card`, `Badge`, `Input`, `SearchInput`, `Skeleton`, and `PageHeader` components.
- Add `data-testid` only to stable behavior boundaries used by browser verification.

---

### Task 1: Channel domain contract and derived list behavior

**Files:**
- Create: `src/features/channels/types/index.ts`
- Create: `src/features/channels/channel-logic.ts`
- Create: `src/features/channels/channel-logic.check.mts`
- Modify: `src/features/channels/index.ts`
- Modify: `src/types/domain.ts`

**Interfaces:**
- Produces: `ChannelLifecycle`, `ChannelHealth`, `ChannelCategory`, `ChannelListItem`, `ChannelDetail`, `ChannelDraftInput`, `ChannelDevice`, `ChannelTypeOption`, `ChannelFilters`.
- Produces: `deriveChannelHealth`, `summarizeChannels`, `filterChannels`, `formatChannelLastSeen`, `validateChannelDraft`.

- [ ] **Step 1: Write the failing behavior check**

Create a Node assertion check with literal expectations for these mutations:

```ts
assert.equal(deriveChannelHealth([]), null);
assert.equal(deriveChannelHealth(["online", "online"]), "online");
assert.equal(deriveChannelHealth(["online", "warning"]), "warning");
assert.equal(deriveChannelHealth(["online", "offline"]), "degraded");
assert.equal(deriveChannelHealth(["offline", "offline"]), "offline");

assert.deepEqual(summarizeChannels(fixtures), {
  lifecycle: { total: 4, draft: 1, active: 2, inactive: 1 },
  health: { online: 1, warning: 0, degraded: 1, offline: 0, unknown: 2 },
  unassigned: 1,
});

assert.deepEqual(
  filterChannels(fixtures, {
    search: "central world",
    category: "in_store",
    lifecycle: "active",
    health: "all",
  }).map((channel) => channel.id),
  ["channel-active-in-store"],
);

assert.deepEqual(
  validateChannelDraft({ name: "", category: "in_store", channel_type_id: "", device_ids: [] }),
  { name: "กรุณาระบุชื่อ Channel", channel_type_id: "กรุณาเลือก Channel Type" },
);
```

- [ ] **Step 2: Run the check and observe RED**

Run: `node src/features/channels/channel-logic.check.mts`

Expected: FAIL because the module and exports do not exist.

- [ ] **Step 3: Implement the minimal domain and pure functions**

Use these exact core types:

```ts
export type ChannelLifecycle = "draft" | "active" | "inactive";
export type MediaDeviceHealth = "online" | "warning" | "offline";
export type ChannelHealth = MediaDeviceHealth | "degraded" | null;
export type ChannelCategory = "dooh" | "in_store" | "online" | "social";
export type ChannelOrientation = "landscape" | "portrait";

export interface ChannelListItem {
  id: string;
  name: string;
  description: string | null;
  lifecycle: ChannelLifecycle;
  health: ChannelHealth;
  category: ChannelCategory;
  channel_type: { id: string; code: string; name: string } | null;
  location: { id: string; name: string } | null;
  devices: ChannelDevice[];
  expected_orientation: ChannelOrientation | null;
  expected_resolution: string | null;
  default_playlist: { id: string; name: string } | null;
  revision: number;
  updated_at: string;
}
```

`deriveChannelHealth` must implement the total formula in Global Constraints. `filterChannels` must trim/lowercase search and match name, location name, device name, and device code. `summarizeChannels` must keep lifecycle and health groups separate. Validation covers only fields the create API requires; activation prerequisites remain backend-owned.

- [ ] **Step 4: Run GREEN checks**

Run: `node src/features/channels/channel-logic.check.mts`

Expected: PASS with one final `channel-logic.check.mts — all assertions passed` line.

- [ ] **Step 5: Run focused lint**

Run: `npm run lint -- src/features/channels src/types/domain.ts`

Expected: exit 0.

---

### Task 2: Typed Channel API boundary

**Files:**
- Create: `src/features/channels/services/channels-api.ts`
- Create: `src/features/channels/services/channels-api-contract.check.mts`
- Modify: `src/features/channels/types/index.ts`

**Interfaces:**
- Consumes: Task 1 Channel types.
- Produces: `fetchChannels`, `fetchChannel`, `fetchChannelReferenceData`, `createChannel`, `updateChannel`, `deleteDraftChannel`, `activateChannel`, `deactivateChannel`.

- [ ] **Step 1: Write a failing contract-shape check**

Test only pure request builders, not axios. Add and test:

```ts
assert.deepEqual(buildChannelListPath({ category: "in_store", lifecycle: "active" }),
  "/media/channels?category=in_store&lifecycle=active");
assert.deepEqual(buildCreateChannelBody(draft), {
  name: "Central World Menu Boards",
  description: "Menu boards for in-store promotions",
  channel_category: "in_store",
  channel_type_id: "type-menu-board",
  location_id: "location-central-world",
  device_ids: ["screen-1", "screen-2"],
  expected_orientation: "landscape",
  expected_resolution: "1920x1080",
  default_playlist_id: "playlist-kfc-wednesday",
});
assert.equal(buildUpdateChannelBody(draft, 7).expected_revision, 7);
```

- [ ] **Step 2: Run RED**

Run: `node src/features/channels/services/channels-api-contract.check.mts`

Expected: FAIL because the builders do not exist.

- [ ] **Step 3: Implement builders and transport calls**

Use `requestApi` and these paths only:

```text
GET    /media/channels
GET    /media/channels/:id
GET    /media/channels/reference-data
POST   /media/channels
PATCH  /media/channels/:id
DELETE /media/channels/:id
POST   /media/channels/:id/activate
POST   /media/channels/:id/deactivate
```

List and reference parsers accept either a bare array/object or `{ channels: [...] }` / `{ data: ... }` only when the existing `requestApi` has not already unwrapped it. Do not fall back to `/media/screens` as Channel data. Update always sends `expected_revision`; create never sends lifecycle `active`.

- [ ] **Step 4: Run GREEN and lint**

Run:

```bash
node src/features/channels/services/channels-api-contract.check.mts
npm run lint -- src/features/channels/services src/features/channels/types
```

Expected: both exit 0.

---

### Task 3: Channels list workspace and detail rail

**Files:**
- Create: `src/features/channels/components/ChannelSummaryTiles.tsx`
- Create: `src/features/channels/components/ChannelFiltersBar.tsx`
- Create: `src/features/channels/components/ChannelTable.tsx`
- Create: `src/features/channels/components/ChannelDetailPanel.tsx`
- Create: `src/features/channels/components/ChannelsListPage.tsx`
- Modify: `src/app/(dashboard)/channels/page.tsx`
- Modify: `src/features/channels/index.ts`

**Interfaces:**
- Consumes: Tasks 1–2 list types/functions/API.
- Produces: production `/channels` view and selected-row detail rail.

- [ ] **Step 1: Build the data states before the success state**

`ChannelsListPage` is a client boundary and must render:

- loading skeleton tiles/table;
- forbidden state through existing `NoAccess` when classified forbidden;
- backend-unavailable/error card with Retry, preserving the header and Add Channel link;
- empty success state with zero counts;
- populated success state without hard-coded mock rows.

The failure branch must not convert an API error into an empty successful list.

- [ ] **Step 2: Build the mockup-aligned success layout**

Implement:

- breadcrumb `Media Workspace / Channels`;
- title/subtitle and one `Add Channel` action (no Import/dropdown);
- two labeled stat groups: Lifecycle (`Total`, `Draft`, `Active`, `Inactive`) and Health (`Online`, `Warning`, `Degraded`, `Offline`, `Unassigned`);
- category tabs `All`, `DOOH`, `In-store` only;
- search/category/lifecycle/health filters;
- columns `Channel`, `Category`, `Type`, `Location`, `Devices`, `Expected output`, `Lifecycle`, `Health`, `Last seen`, `Actions`;
- row click/keyboard selection opening the right rail;
- detail rail with lifecycle, health, category/type/location, expected output, assigned devices, heartbeat/last seen, and Edit link.

Use horizontal scrolling below 1280px rather than dropping columns. Add `data-testid="channels-list"`, `channel-row-<id>`, and `channel-detail-panel`.

- [ ] **Step 3: Verify focused static checks**

Run:

```bash
npm run lint -- 'src/app/(dashboard)/channels/page.tsx' src/features/channels
npx tsc --noEmit
```

Expected: exit 0.

---

### Task 4: Create and edit Channel editor

**Files:**
- Create: `src/features/channels/components/ChannelEditorPage.tsx`
- Create: `src/features/channels/components/ChannelBasicInfoSection.tsx`
- Create: `src/features/channels/components/ChannelDeviceAssignmentSection.tsx`
- Create: `src/features/channels/components/ChannelDisplayExpectationSection.tsx`
- Create: `src/features/channels/components/ChannelEditorSummary.tsx`
- Create: `src/app/(dashboard)/channels/create/page.tsx`
- Create: `src/app/(dashboard)/channels/[channelId]/edit/page.tsx`
- Modify: `src/features/channels/index.ts`

**Interfaces:**
- Consumes: Task 1 validation/types and Task 2 fetch/create/update calls.
- Produces: `/channels/create` and `/channels/:channelId/edit`.

- [ ] **Step 1: Implement route shells using Next.js 16 conventions**

The dynamic edit route receives `params: Promise<{ channelId: string }>` and awaits it in the server page before passing the id to the client editor. Keep page files thin.

- [ ] **Step 2: Implement create/edit data states**

Create loads reference data. Edit loads detail and reference data concurrently. Render skeleton, forbidden, unavailable/error with Retry, then the form. No fake local save if the endpoint is absent.

- [ ] **Step 3: Implement only approved sections**

Match the supplied create/edit mockups but render exactly:

1. `Basic Info`: name, Category (`DOOH`, `In-store`), Type, location, description.
2. `Device / Endpoint Assignment`: existing Physical Devices only, multi-select table, health and last seen; no Register New Device and no primary/backup role.
3. `Display Expectation & Defaults`: orientation, resolution, optional Default Playlist labeled “Prefill for new Publications; not fallback playback”.
4. Right `Channel Summary`: lifecycle, selected device count, category/type/location, expected output, default playlist, health/last seen for edit.

Do not render schedule/default behavior, audio, fallback content, monitoring thresholds, alert recipients, Capture Now, Preview, History, uptime, storage, or player version.

- [ ] **Step 4: Implement validation and save behavior**

On create call `createChannel` and route to `/channels`; on edit call `updateChannel` with the fetched revision. Classify errors with existing `classifyApiError`. `Already modified:` shows Reload and deliberate Overwrite controls; Overwrite must refetch before a second save and may not silently omit the revision. Disable save while pending and keep entered values after errors.

- [ ] **Step 5: Run focused checks**

Run:

```bash
node src/features/channels/channel-logic.check.mts
node src/features/channels/services/channels-api-contract.check.mts
npm run lint -- 'src/app/(dashboard)/channels' src/features/channels src/types/domain.ts
npx tsc --noEmit
```

Expected: all exit 0.

---

### Task 5: Integrated verification and visual correction

**Files:**
- Modify only files from Tasks 1–4 if verification finds a defect.

**Interfaces:**
- Consumes: complete frontend slice.
- Produces: evidence-backed ready-to-connect UI.

- [ ] **Step 1: Run the complete narrow verification**

Run:

```bash
node src/features/channels/channel-logic.check.mts
node src/features/channels/services/channels-api-contract.check.mts
npm run lint -- 'src/app/(dashboard)/channels' src/features/channels src/types/domain.ts
npx tsc --noEmit
npm run build
git diff --check
```

- [ ] **Step 2: Start the app and inspect all three routes**

Run `npm run dev`, then inspect `/channels`, `/channels/create`, and one `/channels/<id>/edit` route in the browser at 1440×900. Confirm shell alignment, horizontal overflow, keyboard row selection, visible focus, form labels, error states, and that forbidden/deferred controls are absent.

- [ ] **Step 3: Compare against the mockups and correct only material differences**

Keep the mockup's dense operational layout, indigo action hierarchy, white cards, table + right rail, and numbered editor sections. Do not reproduce mockup elements excluded by Global Constraints.

- [ ] **Step 4: Record the backend gate in the feature README**

Update `src/features/channels/README.md` with the implemented routes, future endpoint list, and the statement that Thunder_Core Channel RPC/capability enforcement is required before writes can succeed.
