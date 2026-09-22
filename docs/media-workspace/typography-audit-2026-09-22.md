# Media Workspace Typography Audit — 2026-09-22

Scope: `src/features/media-workspace/**`, `src/components/layout/media-workspace-sidebar.tsx`, `src/components/layout/PageHeader.tsx`, `src/components/ui/lovable/button.tsx`.
Reference: Lovable project `e8b49026-3bd5-4a8f-b94c-aad813085d2c` (`src/components/media-dashboard.tsx` for sidebar/dashboard chrome, `src/components/layout-editor.tsx` for editor chrome, `src/components/ui/button.tsx` / `src/components/ui/sidebar.tsx` for primitives).

Scale key: `text-[8px]`=8, `text-[9px]`=9, `text-[10px]`=10, `text-[11px]`=11, `text-xs`=12, `text-sm`=14, `text-base`=16, `text-lg`=18, `text-xl`=20, `text-2xl`=24, `text-3xl`=30px. `font-normal`=400, `font-medium`=500, `font-semibold`=600, `font-bold`=700, `font-extrabold`=800.

## Summary

- **Sidebar**: 4 combos, near-identical to Lovable — only the top-level "Overview" link differs (app: 12px/500, Lovable: 14px/600 — **+2px / +100 weight**). Section labels, nav items, badges are byte-for-byte matches.
- **Buttons**: single canonical source (`buttonVariants`), **byte-for-byte identical** to the Lovable `button.tsx` — no drift, no audit debt.
- **Headers**: ~11 distinct combos in the app vs **5** in the Lovable reference. Biggest gaps: top-level page `<h1>` runs 18–30px/600–700 across pages (no single canonical size) vs Lovable's one fixed `text-xl font-extrabold` (20px/800) — **up to +10px and −200 weight** depending on which page; the dashboard-style section header (`text-[11px] font-extrabold uppercase tracking-[0.08em]`) is an exact match wherever it's used (Overview cards only).
- **Cards/labels/tables**: app leans on a micro type scale (8–11px) consistent with Lovable's own card body scale, but field-label styling is heavier — app uppercase labels are 12px/600 vs Lovable's 9px/~500 (**+3px / +100 weight**).

---

## 1. Sidebar

| Element | Class combo | px/weight | Where (Thunder One) | Lovable equivalent | Diff |
|---|---|---|---|---|---|
| Section label | `text-[9px] font-bold uppercase` | 9/700 | `media-workspace-sidebar.tsx:97` | `media-dashboard.tsx` nav group label — `text-[9px] font-bold uppercase` | **0 / 0** (exact match) |
| Nav item label | `text-xs font-medium` | 12/500 | `media-workspace-sidebar.tsx:37` (all `NavLink`s) | `media-dashboard.tsx` nav item link — `text-xs font-medium` | **0 / 0** (exact match) |
| Overview / top link | `text-xs font-medium` | 12/500 | `media-workspace-sidebar.tsx:86` | Lovable "Overview" link — `text-sm font-semibold` | **+2px / +100** |
| Badge (count/new) | `text-[8px] font-bold uppercase` | 8/700 | `media-workspace-sidebar.tsx:17` `NavBadge` | `media-dashboard.tsx` item badge — `text-[8px] font-bold uppercase` | **0 / 0** (exact match) |

The app's sidebar is a near-direct port of Lovable's `WorkspaceSidebar`; only the top "Overview" entry was demoted to the same weight/size as ordinary nav items instead of keeping Lovable's heavier treatment.

## 2. Buttons

Single source of truth: `src/components/ui/lovable/button.tsx` (`buttonVariants`). Compared directly against Lovable's `src/components/ui/button.tsx` — **the two files are identical** (same variants, same sizes, same base `font-semibold`).

| Size | Height | Text | px/weight |
|---|---|---|---|
| `default` | h-10 | text-sm | 14/600 |
| `sm` | h-8 | text-xs | 12/600 |
| `lg` | h-11 | text-sm | 14/600 |
| `icon` / `icon-sm` | h-9 / h-8 | (icon only) | — |

No per-file audit needed; no drift possible while this stays the only button source.

## 3. Page / section headers

| Class combo | px/weight | Where (examples) | Rough count | Lovable equivalent | Diff |
|---|---|---|---|---|---|
| `text-2xl font-semibold` | 24/600 | `PageHeader.tsx:31`, `FullPreviewPage.tsx:149` | 2 | Lovable `WorkspaceHeader` h1 — `text-xl font-extrabold tracking-tight` (20/800) | **+4px / −200** |
| `text-3xl font-semibold tracking-tight` | 30/600 | `UploadQueuePage.tsx:96` | 1 | same as above | **+10px / −200** |
| `text-xl font-bold` | 20/700 | `media-detail-page.tsx:158` | 1 | same as above | **0px / −100** |
| `text-xl font-semibold` | 20/600 | publications wizard steps (`AssetLibraryStep`, `ProgramStep`, `ReviewStep`, `PublishStep`) | 5 | same as above | **0px / −200** |
| `text-lg font-semibold` | 18/600 | `ChannelDetailPanel.tsx:152`, `ChannelEditorForm.tsx:37`, dialogs, `PlaylistEditorHeader.tsx:90` | 6+ | no direct match (Lovable has no mid-size h2 tier) | — |
| `text-base font-semibold` | 16/600 | `ContentInfoRail`, `ProgramSummaryRail`, `PrepareContentStep`, `PublicationDetailPage` (×4) | 10+ | no direct match | — |
| `text-sm font-bold` | 14/700 | `CompositionEditorHeader.tsx:141`, `LayoutEditorChrome.tsx:45`, `LibraryShell.tsx:71`, `LibraryChrome.tsx:93`, `PreviewModalChrome.tsx:43` | 5+ | Lovable `layout-editor.tsx` page title h1 — `text-sm font-bold` | **0 / 0** (exact match) |
| `text-sm font-semibold` | 14/600 | most common panel `<h2>` across compositions/playlists/publications (20+ spots) | 20+ | Lovable `ContentBrowser`/`LayoutProperties`/`ZoneProperties` h2 — `text-[11px] font-bold` (11/700) | **+3px / −100** |
| `text-xs font-bold` | 12/700 | `CompositionContentBrowser.tsx:41` | 1 | Lovable's own "Insert to Zone" h2 — `text-[11px] font-bold` | **+1px / 0** |
| `text-xs font-semibold uppercase tracking-wide` | 12/600 | `ChannelDetailPanel.tsx` (×4), `ChannelGroupInspectorSections.tsx` (×3) | 7 | Lovable sub-panel h3 — `text-[10px] font-bold uppercase` (10/700) | **+2px / −100** |
| `text-[11px] font-extrabold uppercase tracking-[0.08em]` | 11/800 | Overview dashboard cards only (`LowerOverview.tsx` ×4, `ProgramStatusCards.tsx`, `QuickActionsCard.tsx`, `RecentAlertsCard.tsx`) | 6+ | Lovable `SectionHeader` — `text-[11px] font-extrabold uppercase tracking-[0.08em]` | **0 / 0** (exact match) |

**~11 distinct header combos** in the app vs **5** in Lovable (page h1, dashboard `SectionHeader`, editor page title, panel h2, sub-panel h3). The dashboard/Overview area is the only place the app matches Lovable exactly; everything built since (channels, playlists, publications, compositions) drifted to a wider, more ad-hoc set of sizes.

## 4. Cards / panel labels / body / tables

| Class combo | px/weight | Where | Rough count | Lovable equivalent | Diff |
|---|---|---|---|---|---|
| `text-xs font-semibold uppercase tracking-wide` (field label) | 12/600 | `LayoutPropertiesPanel.tsx:20` (`labelClasses`), `ZonePropertiesPanel.tsx:56` | 2 | Lovable `Label` overridden to `text-[9px]` (weight ~500, not overridden) in `layout-editor.tsx` `LayoutProperties`/`ZoneProperties` | **+3px / +100** |
| `text-xs font-medium` (tab / segmented control) | 12/500 | `LayoutPropertiesPanel.tsx:93`, `ZonePropertiesPanel.tsx:17` | 2 | Lovable tab triggers — `text-[9px]` | **+3px / same** |
| Table head row (`text-[9px] font-semibold`) | 9/600 | `PlaylistsTable.tsx:71`, `CompositionsTable.tsx:125`, `LayoutsTable.tsx:44` | 3 (all 3 tables) | **no Lovable equivalent** — the reference project has no sortable data table, only dashboard cards | — |
| Table body cells (`text-[10px]`, weight varies) | 10/400–600 | same 3 table files, throughout | 15+ | — | — |
| Table meta / secondary (`text-[8px]`–`text-[9px]`) | 8–9/400 | same 3 table files (description, "by X", badges) | 10+ | Lovable card meta uses the same 8–11px micro scale (`AlertsCard`, `ScheduleCard`, `ActivityFeed`) | roughly aligned in scale, no direct 1:1 element |
| Card title (`text-sm font-bold`) | 14/700 | `LibraryShell.tsx:71` | 1 | Lovable `KpiCard`/`ProgramCard` label — `text-[11px] font-semibold` (11/600) | **+3px / +100** |
| Card meta (`text-[9px] text-muted-foreground`) | 9/400 | `LibraryShell.tsx:72` | 1 | Lovable card detail line — `text-[10px]`/`text-[9px]` | roughly aligned |

`LibraryShell.tsx` card title/meta combo (`text-sm font-bold` / `text-[9px]`) is unchanged since the prior known-good check — still current.

**Takeaway**: the app's tables and dense card bodies already sit in the same 8–11px micro-scale Lovable uses for its own dashboard cards, so that part tracks well. The drift is concentrated in *labels* (uppercase field labels, tab triggers) which the app sized up to `text-xs` (12px) while Lovable kept them at `text-[9px]` — a consistent +3px across every panel that uses `labelClasses`-style patterns, and in page/section headers (§3) which have accumulated far more distinct sizes than the Lovable source ever had.
