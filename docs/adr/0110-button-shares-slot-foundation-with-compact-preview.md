# Button shares a Slot foundation with a compact local preview

**Status:** provisional · local option A preview authorized · 2026-11-13
**Extends:** ADR 0096, ADR 0098 and ADR 0104
**Source:** owner requested "try A first", agent browser verification, then continued after the preview

Prepare option A locally: canonical `ui/Button` on the existing Slot/ref foundation, default height
32px, radius12px, horizontal padding12px and font14px. Small controls remain32px with radius12px;
icon remains36px; lg44px and CVA null remain compatible. Preserve explicit caller sizes/classes.
The owner continued after the comparison, so keep A for ongoing local work. This remains a
reviewable local preview, not release approval or an explicit permanent visual sign-off. Retaining each implementation's
old sizing was considered as option B and remains a fallback if the preview is rejected.

Keep foundation variant names and filled secondary. Remap the old UI secondary buttons to outline
so existing bordered/card treatment remains. Keep primary/default synonyms. Preserve buttonClasses
as a thin positional adapter on buttonVariants rather than rewrite23 Links and6 native buttons.
All product imports use ui/Button; lovable/button is a compatibility re-export. Normalize classes
through cn so explicit overrides win. The old UI callers inherit foundation semibold/shrink/nowrap
behavior; verify narrow layouts and show the before/after preview for owner review.

Retain type=button default, explicit submit/reset/form ownership, native props, ref and asChild link
semantics. No current old UI form owner relies on an implicit submit; do not invent a Triage fix.
Native disabled must retain hover/title eligibility: use its native activation block and keep pointer
events available for existing explanatory hints. No disabled asChild link currently exists; no new
custom disabled-link API is introduced. No nested interactive elements are created.

No dependency, file deletion, component sync, commit, push, deployment or production write is
approved. OD-03 typography remains unresolved; this preview keeps default14px text.
