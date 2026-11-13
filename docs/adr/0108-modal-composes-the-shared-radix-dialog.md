# Modal composes the shared Radix Dialog

**Status:** accepted · 2026-11-13
**Extends:** ADR 0096, ADR 0098 and ADR 0104
**Source:** owner selected option A in the shared-UI consolidation discussion

Use `ui/Dialog` as the canonical Radix compound foundation. Keep `ui/Modal` as a higher-level
composite on that foundation with its existing controlled props, size names, title/description,
footer, opt-in close button and overflow option. Existing compound callers use ui/Dialog;
lovable/dialog remains a compatibility re-export. This avoids rewriting nineteen Modal caller files.

Keeping native Modal separate while only renaming the compound path was considered. It is a smaller
change but leaves two modal engines, so it was rejected for this consolidation. A blanket rewrite
of all Modal callers to compound JSX was also rejected because it repeats the existing composition
and makes form/geometry regressions harder to review. No portal clash is claimed as a reproduced bug.

Preserve default presentation separately: compound Dialog keeps its existing styles and default
close button; Modal keeps its prior widths, padding, title typography, backdrop, opt-in close button,
closed-child immediate unmount and scrolling/overflow behavior. No blanket size redesign is approved.
Radix replaces native top-layer behavior, so verify focus trap/return, Escape/outside dismissal,
portalled controls and the actual nested Create Group/Add More Channels flow. Modal callers have
no DialogTrigger: capture opener before autofocus and restore it if still connected. Do not add an
outer form; footer buttons must keep native form ownership and validation.

Implementation and requested local verification are authorized. Commit, push, file deletion,
deployment, component sync and production writes remain outside this decision.
