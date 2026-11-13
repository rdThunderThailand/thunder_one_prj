# Input restores the original field appearance

Status: accepted ·2026-11-14. Supersedes ADR0106 visual defaults only.
Source: owner selected the Login email input on PR387 and requested the old field
appearance as the default for all shared inputs.

Keep the canonical ui/Input native renderer, ui/TextField label/error composition,
ui/SearchInput composition and compatibility export. Restore the former labeled
ui/Input appearance from8ee2564f: rounded-lg12px, px-3.5/py-2.5 (14px/10px), text-sm
with20px line height, bg-card, border-border, no shadow, focus:border-primary and
focus:ring-2/ring-primary30. With normal text metrics this content-sized field is42px
high. Do not alter generated design-system tokens to change unrelated controls.

Keeping compact32px defaults was rejected by the owner after hosted visual review.
Restoring only Login would leave inconsistent shared defaults and does not meet the
request. Page-specific class overrides remain authoritative under the consolidation
contract: the six explicit h-8/h-9 consumers retain py-1 so text/date content is not
compressed by the restored vertical padding. No new size API or parallel renderer.

Keep refs/native HTML props, file-input presentation metadata, disabled treatment,
validation, label/error associations and accessible naming. TextField errors retain
an error-colored border while focused. Do not change Button, Badge or native bespoke
widgets outside this shared Input family. No workflow/backend/schema change.

Verification uses the existing shared-ui.check.mts and hosted browser review of
Auth, generic search, compact date fields and the Player release file chooser.
No credentials submitted, files selected/uploaded or data saved during verification.
