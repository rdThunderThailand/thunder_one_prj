# 0079 — Confirm single-screen Player geometry mismatches

Status: accepted (2026-09-29, owner request). Supersedes ADR 0039's orientation hard block and ADR 0074 §3's retained single-screen orientation refusal. Multi-screen behavior is unchanged.

## Decision

When a single-screen Channel's declared resolution differs from the selected Player's reported `screen_width × screen_height`, or its derived orientation differs from the Player's reported `orientation`, show both values and require an explicit operator confirmation. The create and edit APIs pass `confirm_mismatch: true` only after that confirmation; otherwise they pass `false`. The database refuses a known mismatch with `confirm_mismatch: false`.

`NULL` Player dimensions or orientation mean unknown. Compare only reported values; do not invent a match or write the Channel expectation back onto the Player. Multi-screen Channels remain exempt from this comparison because the Player reports one display, not the combined canvas.

The confirmation permits an incorrect physical orientation, which may rotate or scale content. The warning must state that risk. Tenant ownership, Player credential, active reservation, and publication guards remain mandatory and cannot be overridden by this flag.

## Alternatives

- Keep orientation as a hard block: safer for unattended signage, but prevents an operator from proceeding after checking the physical setup. Replaced by the owner's explicit confirmation rule.
- Automatically accept every mismatch: no operator decision or audit of intent. Rejected.

## Release order

Apply the Thunder_Core migration before deploying the Thunder One UI. Until then, confirmed orientation mismatches still receive the old RPC refusal. Do not apply or deploy as part of this ADR.
