# Open design decisions

Until design decides, agents follow `tokens.json` and mention the decision ID in their reply (DS-14).
A review that finds one of these on a screen reports it as **Decision needed**, not as a defect.

## OD-01 Media approved screen does not use the semantic tokens
The approved screen "MW-01 Overview / 1920w light" (imported from a Lovable build) does not use the tokens on the "Semantic Colors" page.

| Role | Semantic token (official) | Used on approved screen |
|---|---|---|
| Primary text | text/primary `#111827` | `#0F1727` |
| Secondary text | text/secondary `#374151` | `#5A6475` |
| Default border | border/default `#D1D5DB` | `#DCE2E9` |
| Muted background | bg/primary-strong `#F3F4F6` | `#F0F3F7` |
| Success / online | status/success `#10B981` | `#0FA44D` (bg `#E0FAE4`) |
| Warning | status/warning `#F59E0B` | `#E48300` (bg `#FFF2D4`) |
| Error / offline | status/error `#EF4444` | `#F21823` (bg `#FFE9E6`) |
| Brand | bg/brand, action/primary `#286EF9` | `#286EF9` ✅ match |
| Nav active bg | action/subdued-menu `#E9F4FF` | `#E9F4FF` ✅ match |

## OD-02 Brand blue is not in the primitive ramp
`#286EF9` (brand/action primary) is not in the Blue primitive ramp (blue/500 = `#0C60FA`). Either add it to the ramp or point the semantic token at blue/500.
Also: the "Components Overview" page in Figma uses the stock Ant Design theme (`#1677FF`, SF Pro, radius 6). It is not the company theme. Figma layer typo `action/subdud*` should be `action/subdued*` (tokens.json uses the corrected name).

## OD-03 Type scale not confirmed
Font sizes on the approved Media screen (8–11px body text) look like a scaled-down capture. Only Label/Large/Regular is confirmed. Confirm the full scale against the Figma text styles (Display / Heading / Body / Label / Caption / Overline) before shipping.

## OD-04 Icon maps not signed off
The platform map (`icons.md`) and every Workspace map are proposals built from the Ant Design set in Figma. Design has not signed them off.

## OD-05 No Thai typeface (blocking for TH content)
Manrope has no Thai glyphs, so Thai text currently falls back to whatever the OS provides (`system-ui`), which differs per device. Every Workspace that ships TH (Help requires TH and EN) needs a decision: a Thai companion face in `font.family.sans`, with weights matching 400–800, plus line-height checks for Thai vowels and tone marks.

## OD-06 Public page shell
Platform pages that work without a session and have no sidebar (Help Center Home, Search, Article) are not specified in the design system: header content for signed-out visitors, max reading width, and article typography.
