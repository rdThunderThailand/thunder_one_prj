# Tabs share Radix with explicit presentation

**Status:** accepted · 2026-11-13
**Extends:** ADR 0096, ADR 0098 and ADR 0112
**Source:** owner selected option A in the shared-UI consolidation discussion

Use one Radix Tabs foundation exported from `ui/Tabs`, with explicit `segmented` (default) and
`underline` presentation. Keep existing Help overrides. `lovable/tabs` remains a compatibility
re-export; feature callers use the canonical path. This records a local underline pattern whose
upstream component spec is still absent, not a claim that the design system approved that pattern.

Replacing every tab with segmented controls was considered and rejected for this slice: it changes
existing Playlist, Channel Groups, Asset Workspace and Library rail presentation without a need
established by the consolidation. Keeping independent implementations was rejected because it
leaves inconsistent keyboard and ARIA behavior. Preserve existing sizes and caller overrides;
segmented spec-size changes are outside this decision.

Replace the former items API at all three known callers with compound Radix elements. Preserve
controlled callbacks, Playlist reset on identity change, and inactive-content unmounting. Use manual
activation for those three callers so arrow-key focus does not start URL navigation or clear sidebar
selection. Existing Radix consumers retain their activation behavior.

Asset list tabs control a URL-filtered shared body. Associate every trigger with the one stable
panel containing filters, selection toolbar and table. Keep that body mounted across tab changes;
do not create empty panels or duplicate the table per tab.

This decision authorizes local implementation and requested verification. It does not authorize
file deletion, commit, push, deployment, component sync or production writes.
