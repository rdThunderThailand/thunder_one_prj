# Input primitive and TextField share one native input renderer

**Status:** accepted · 2026-11-13
**Source:** owner chose ui/Input + ui/TextField and 32px / 12px defaults
**Extends:** ADR 0104; applies only to the Input family

Use ui/Input for the bare native input primitive and ui/TextField for the label/error composite.
TextField renders Input. Move all 16 primitive caller imports and all 6 labeled-field callers
to those names. Keep lovable/input as a compatibility re-export; preserve native props, refs,
validation and caller style overrides. Defaults are h-control (32px), rounded-control (12px)
and bg-card. Implementation uses h-(--spacing-control) and rounded-(--radius-control) so
caller overrides merge with the installed tailwind-merge; it does not recognize the bare custom
h-control/rounded-control aliases. Label components and other form controls stay unchanged.

Keeping ui/Input as the composite and introducing ui/InputControl was considered. The owner
selected the conventional bare Input / labeled TextField split already proposed in the plan.
Preserving the old 36px/42px defaults as a separate first step was also considered; the owner
approved the spec-aligned 32px/12px default now. Explicit caller size overrides remain effective.

This intentionally changes the ui/Input public contract: labeled callers must use TextField.
The legacy lovable primitive path stays compatible. Audit external/prototype consumers separately;
the old PO guard ban of ui/Input reflects the former contract, not the new primitive. No database,
business workflow, file deletion, dependency, commit or deployment is included.
