# Badge and Tag share one renderer with current density

Update 2026-11-13: ADR 0111 supersedes the 12px default below with owner-approved10px; other contracts remain.

**Status:** accepted · 2026-11-13
**Extends:** ADR 0096, ADR 0098 and ADR 0104
**Source:** owner selected option A in the shared-UI consolidation discussion

Consolidate rendering in `ui/Badge`, preserving its dot default, pill presentation, 12px default
text, color keys and existing workspace mappings. Retain explicit caller font/padding overrides;
do not automatically add a dot to pills. Existing legacy tone variants remain a compatibility
surface in the same renderer so dynamic status maps need no semantic rewrite. The legacy path
keeps its primary default via an adapter; new canonical imports use explicit variants where needed.
Preserve CVA null (base only) separately from undefined (legacy default).

`ui/Tag` is a neutral outline pill composite for confirmed taxonomy with a 12px content-sized
default, no color or status-variant prop, and native span attributes. Migrate only the eight verified
usages in GuideMeta, Playlist tags/content type, Media tags, Program tags and Playback Proof media
kind. An outline Draft remains a status Badge. Existing colored taxonomy in the 86 original
canonical Badge callers is a separate domain audit, not guessed normalization in this slice.

Keep generic StatusBadge mapping and accessible Status prefix unchanged, rendering exactly one
decorative dot on the same foundation. Export it from ui/Badge with a core compatibility re-export.
Legacy div markup becomes span markup; no external refs or div-specific selector dependency was found.

Deferring the whole slice pending OD-03 was considered and rejected: renderer consolidation can
preserve current density without resolving the upstream type scale. Reducing all badge/tag text to
9–10px, forcing fixed 16/18px heights, renaming semantic color props and rewriting every status map
were not approved. OD-03 remains open; this decision does not claim full DS-04/typography compliance.

Local implementation and requested verification are authorized. No file deletion, dependency,
component sync, commit, push, deployment or production write is authorized by this decision.
