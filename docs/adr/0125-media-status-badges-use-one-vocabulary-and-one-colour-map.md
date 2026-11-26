# 0125 — Media status badges use one vocabulary and one colour map

Status: accepted (2026-11-25, owner decisions in chat; revised after review the same day).
**Workspace:** media
**Extends:** ADR 0096 (the design system's `media` profile) with the states its DS-04 table leaves out.
**Amends:** ADR 0120 (the playlist badge no longer shows in use as Active/Inactive).
**Relates to:** GitHub #462 (Program badge colours disagree across pages); GitHub #457 (Program
Detail shows the old status vocabulary; this ADR decides its status half); ClickUp 1009 (Playlist:
Save & Activate shows Inactive); ADR 0080 (Program display statuses); ADR 0098 (Asset Workspace's
own local profile, the same pattern for another Workspace).

## Context

The `media` profile's DS-04 table maps six states: Online, Live, Warning, Offline, Scheduled and
Processing. Media screens also show Draft, Active, Inactive, Ready, Publishing, Failed and Ended.
The profile says nothing about those, so each screen picked its own colour and some picked their
own meaning. On `dev` @ d8736869:

| Entity | Where | What it shows |
|---|---|---|
| Playlist | list, side panel (`playlists/status-display.ts`) | Draft yellow · Active green · Inactive grey |
| Playlist | editor header (`StatusBadge` in `components/ui/Badge.tsx`) | Draft **blue** (that map says `draft: info`) |
| Layout | `compositions/status-display.ts` | Draft yellow · Active green · Inactive grey |
| Template | `layouts/status-display.ts` | Active green · Inactive grey |
| Program | List / Edit rail / Breadcrumb (`display_status`) | three colour maps (#462): Draft is outline, blue and grey; Scheduled is yellow in the list and blue in the rail; Publishing is blue in the list and yellow in the rail |
| Program | Detail page, playlist panel's Programs tab (`effective_status` via `publication-status.ts`) | a second vocabulary: draft · scheduled · **active** · ended · cancelled, shown raw (#457) |
| Asset | detail header (`assets/media-detail-rename.tsx`) | everything but `failed` is green, `processing` included |
| Asset | Media picker (`publications/components/MediaPickerModal.tsx`) | `ready` labelled "Active" |
| Channel, Channel Group | four local maps (`channels/…`, `channel-groups/…`) | already match DS-04, but each keeps its own copy |

"Active" carries three meanings:

- **Layout, Template, Channel Group:** the operator activated it and it can be used. Inactive means
  the operator switched it off.
- **Playlist (ADR 0120):** a draft or active Program plays it. Inactive means "finished, nobody
  uses it", which no operator action produces.
- **Program Detail:** the stored status of a published Program, whether or not it is on air.

ClickUp 1009 is what this costs. An operator presses **Save & Activate**, the toast says
"บันทึกและเปิดใช้งานแล้ว", and the badge reads **Inactive**, because no Program uses the new
playlist yet (`usePlaylistEditorRow.ts` sets the state to `inactive` right after activating). The
tester read it as a failed save and asked the Publish wizard to block Inactive playlists. That would
be a deadlock: a playlist becomes "in use" only by being put in a Program.

## Decision

1. **Active means "activated and usable", on every Media entity.** Use is not a status. Programs use
   Live, not Active.
2. **Playlist has two states: Draft and Active.** Draft comes from the stored `playlists.status`
   as today. Every non-draft playlist is Active. Inactive is no longer a playlist state, because no
   operator can switch a playlist off. After Save & Activate the editor's state becomes `active`.
3. **Use is a neutral tag next to the badge, shown only when the playlist is in use.** The tag reads
   `ใช้ใน N Program` from `in_use_count` (ADR 0120's rule, unchanged). A playlist not in use shows the
   Active badge and no tag. A playlist whose Programs have ended but were never cancelled still
   counts as in use (ADR 0120 Consequences), so it keeps the tag. A frontend that gets no
   `in_use_count` shows no tag.
4. **Every Program badge shows `display_status`**, the Detail page and the playlist panel's Programs
   tab included. `effective_status` stays a data field for behaviour gates, never a badge. A stored
   `cancelled` therefore shows as Ended, as ADR 0080 already defines. This decides the status half
   of #457.
5. **One colour map for Media states** (DS-04 tones; `BadgeColor` in brackets):

   | Tone | States |
   |---|---|
   | success (`green`) | Active, Live, Online, Ready |
   | info (`blue`) | Scheduled |
   | in-progress (`indigo`) | Publishing, Processing |
   | warning (`yellow`) | Warning |
   | error (`red`) | Failed, Offline |
   | neutral (`zinc`) | Draft, Inactive, Ended, Archived, Expired, No player |

   Draft is neutral, not yellow: yellow is Warning, and a draft is not a problem. Draft and Inactive
   share a tone and differ by label.
6. **Labels are fixed per state.** Asset `ready` reads "Ready", not "Active", because an asset is
   never activated.
7. **One module owns label and tone for every Media state, and every Media badge calls it.** The
   callers:
   - the Playlist, Layout and Template status helpers, and the Playlist editor header;
   - the Program List, Edit rail, Breadcrumb, Detail page and the playlist panel's Programs tab;
   - the asset detail header and the Media picker;
   - the Channel and Channel Group tables, inspector and sidebar.

   One `*.check.mts` asserts each state's label and tone, so a page cannot drift again.
8. **`StatusBadge` and its `statusMap` in `components/ui/Badge.tsx` are deleted.** Their only caller is
   the Playlist editor header, which moves to the Media module. Thunder Care, People and Asset
   Workspace already use maps of their own. The `lovable/core.tsx` re-export and the `StatusBadge`
   cases in `Badge.check.mts` go with it.

Unchanged: Layout (Draft → Active ↔ Inactive), Template and Channel Group (Active ↔ Inactive),
Channel (Online · Warning · Offline · No player), and the `display_status` set. Only colours and the
pages listed above change, so that every page agrees.

## Rejected alternatives

**Fix each ticket on its own** (#462 colours, ClickUp 1009 wording). This is quicker, but nothing
owns the states the profile leaves out, so the next screen picks its own colour again.

**Upstream the states to the design system repo first.** That is right only once another Workspace
needs these states. It also blocks a Media fix on another repo's release. A later re-copy of the
skill can absorb this table.

**Keep the derived playlist badge and rename it "In use" / "Not in use".** Fewer files change, but
the playlist badge still means something different from every other Active badge, and Save &
Activate still produces a badge that does not say Active.

**Playlist "Ready" instead of Active.** This adds another word for "usable" next to Active, Live
and Online, and Ready already belongs to assets.

**Tag "ไม่ได้ใช้" on unused playlists.** Every new playlist would carry it, as noise. The absence of
the tag already says "not in use".

**Keep `effective_status` on the Program Detail page.** Cancelled would stay visible there, but
"active" would keep a third meaning, and Detail would disagree with the List for the same Program.

**Draft yellow everywhere** (what the Playlist and Layout lists use today). That collides with
Warning in the same Workspace.

**Cancelled red.** The operator chose it; it is not an error. It shows as Ended anyway (decision 4).

**Keep `StatusBadge` for other Workspaces.** None uses it, so it would be dead code.

## Consequences

- ClickUp 1009 closes by design change: after Save & Activate the badge reads Active. The Publish
  wizard's playlist picker does not change. It already lists draft playlists (#404 made it list
  them, because the editor's Publish button already sends drafts there).
- ADR 0120's rule is unchanged: `in_use_count`, the Move to Trash guard and `playlist_program_ids`.
  Only its display changes. "Inactive = can be moved to Trash" becomes "no tag = can be moved to
  Trash".
- On prod (ADR 0120, 2026-11-20) about 80% of finished playlists are in use, so most rows carry the
  tag until abandoned draft Programs are cleaned up. The tag shows that cause instead of hiding it.
- The Playlist status filter (`PlaylistsFilters.tsx`, `PlaylistPickerModal.tsx`) loses Inactive.
  An "in use / not in use" filter, if wanted, is a separate filter, not a status.
- `PlaylistStatus` keeps `inactive` as a type value. No frontend caller sends it, and Core still
  accepts it, so a stored `inactive` row displays as Active. No migration.
- The Program Detail page no longer shows Cancelled. Telling a cancelled Program apart from one that
  ended on schedule needs another field, not a status badge.
- An asset that is still processing stops showing green.
- Frontend only; no Core change.
