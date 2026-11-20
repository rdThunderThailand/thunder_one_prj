# Design system review checklist

Use before finishing any UI work, and as the design-system layer of a QC review.
Each item cites a core rule. Report results as PASS / GAP / NOT CHECKED, with the screen or file where it was seen.

Severity when reviewing:
- **P0**: breaks DS-01, DS-02, DS-03, DS-04, DS-10 or DS-11, or uses another Workspace's vocabulary, nav or icons.
- **P1**: breaks DS-05, DS-07, DS-08, DS-09, DS-12, DS-13, or a Workspace profile rule.
- **P2**: spacing or size off by a few px, wording polish.
- **Decision needed**: the screen hits an item in `open-decisions.md` (OD-xx), or does something the design system does not cover.

## Tokens and theme
- [ ] DS-01 No raw hex/rgb, no arbitrary px font sizes, radii or shadows (`bg-[#…]`, `style={{ color: '#…' }}`, `text-[13px]`).
- [ ] DS-02 Theme comes from `@rdthunderthailand/thunderone-theme` (or the synced copies). No `#1677FF`, no Tailwind default palette classes (`bg-blue-500`, `text-gray-600`).
- [ ] DS-06 No dark mode unless dark tokens exist.

## Shell and layout
- [ ] DS-03 Sidebar 224, header 69, content padding 24/20, nav item 32 (primary 40). Nav groups and order match the Workspace profile.
- [ ] DS-03 Platform utilities (Help, Notifications, account) open from the header, not from a sidebar section or Workspace tile.
- [ ] DS-05 Gaps only 4/8/12/16/24; cards 16 padding, 12 gap, 1px border, radius 16.
- [ ] Responsive: 2 columns < 1280, 1 column + drawer sidebar < 768; side panels follow desktop drawer / tablet overlay / mobile full-screen.
- [ ] Tables do not scroll sideways on desktop; columns drop by card width in the profile's order.

## Status and taxonomy
- [ ] DS-04 Every state maps to `status.*` through the profile's table. No new status colors.
- [ ] DS-04 Categories, types and tags use the neutral Tag, not status colors.

## Components and states
- [ ] DS-08 Shared components reused; any missing component is named, not invented.
- [ ] DS-11 Every data surface has loading skeleton, empty (icon + line + next step) and error with Retry. No empty/error shown while loading.

## Type, icons, brand
- [ ] DS-07 Manrope for Latin text; no Inter / SF Pro / antd default. Thai text noted against OD-05.
- [ ] DS-09 Icons only from `@ant-design/icons`, Outlined (Filled only for active), via `T1Icon` or the profile map. No lucide/heroicons/material. Sizes 12/14/16/20.
- [ ] DS-10 Logo is an imported SVG from `assets/brand/`, correct light/dark variant, not recolored or retyped.

## Copy and access
- [ ] DS-12 Sentence case; exact profile vocabulary; 24h time; time zone where times matter; TH and EN both fit.
- [ ] DS-13 Visible focus ring, hit height ≥ 32, `aria-label` on icon-only buttons.
- [ ] DS-14 Any disputed value follows `tokens.json` and the OD-xx is mentioned.

## Checking code quickly
```bash
# raw colors and arbitrary values in source
grep -rnE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" src --include=*.{ts,tsx,css} | grep -v thunderone-theme
grep -rnE "\b(bg|text|border)-(slate|gray|zinc|neutral|blue|red|green|amber|yellow)-[0-9]{2,3}\b|-\[#|text-\[[0-9]+px\]" src
# other icon libraries
grep -rnE "from ['\"](lucide-react|@heroicons|@mui/icons-material|react-icons)" src
```
