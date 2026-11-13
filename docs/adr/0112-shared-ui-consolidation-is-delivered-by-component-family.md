# Shared UI consolidation is delivered by component family

Identifier note: originally numbered0104 on the feature branch; renumbered0112 when dev introduced ADR0104 for Failed badges. Historical scope text below is retained.

**Status:** accepted · 2026-11-13 · scope decision only; implementation not started
**Extends:** ADR 0096 and ADR 0098
**Source:** owner acceptance of the shared-UI scope in the component-consolidation discussion
**Plan:** `docs/design-system/plan-component-consolidation.md`
**Follow-up:** ADR 0105 resolves the Skeleton contract separately; the other family decisions remain open.

Shared components serve Media, People, Thunder Care, Asset Workspace and Auth. Consolidate them
across ThunderOne one component family at a time, with Media as the first verification surface
where affected, followed by every other affected workspace. A shared default cannot be released
as a Media-only change. Preserve workspace profiles, behavior and accessibility; do not transfer
Media domain choices into other workspaces.

A Media-only consolidation was considered but does not isolate shared defaults and can leave
incompatible duplicate implementations. A bulk cross-workspace migration was rejected because
it makes regressions harder to trace. Component-family slices bound that risk and must cover all
consumers before being considered complete. Skeleton is the first proposed slice, with its
canonical style/props and class override contract still to be resolved. A temporary re-export
through existing paths is an option for that review, not a decision recorded here.

This decision approves the scope and delivery boundary, not the plan's proposed winners, prop
renames, typography changes, underline-tabs conversion or native-Modal replacement. Keep OD-03
and unproven portal behavior explicit; resolve the relevant design/API decisions before those
changes. No implementation, file deletion, commit, push or deployment is authorized by this ADR.
