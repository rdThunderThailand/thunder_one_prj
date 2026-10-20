# SESSIONLOG — ThunderOne DS migration P6 (cleanup) — 2026-10-20

Branch `style/thunderone-ds-p6` from `dev` @ c0cbe2a. Not committed.

## Done
- Renamed the last alias class tokens (26 uses, 11 files: `help/components/*`, `BriefPanel.tsx`):
  `primary-soft`→`accent`, `info-soft`→`info-muted`, `warning-soft`→`warning-muted`,
  `danger-soft`→`error-muted`, `text-danger`→`text-error`. `success-soft` and `danger-foreground`
  had no users. `danger` as a component prop/variant name (`Badge`, `LibraryEmpty`, `StatusTone`) is
  not a colour token and was left.
- `globals.css`: removed the alias block, `@custom-variant dark` + its comment, and the stale
  "temporary aliases" bullet.
- Plan P5/P6 status and ADR 0096 status updated.

## Proof (all run)
- `grep '\bdark:' src` → only the QR `color: { dark }` library option.
- Raw palette classes, `bg|text-white|black`, `[#hex]` classes, hex in class strings → 0.
- `tsc --noEmit` clean (after `rm -rf .next/dev/types`); `eslint src` 0 errors, 2 pre-existing
  `no-img-element` warnings; all `*.check.mts` ok (incl. `design-system.check.mts`); `next build` ok.

## Browser (run by the agent, built-in pane, dev server already on :3000, 1440×900, logged-in session)
- `/mission-control` (BriefPanel): `bg-accent` → rgb(233,244,255), `bg-info-muted` → rgb(222,233,254),
  `text-error` → rgb(239,68,68); 0 console errors.
- `/help` hero `bg-accent` ok; `/help/browse?type=troubleshooting` card hover → `bg-accent/40` +
  `border-primary/40` (real hover, computed); `/help/guides/channel-is-offline` renders, tiles ok.
- `/media-workspace` (Overview, reached by sidebar click): renders; sidebar 224, header 69, nav items 32;
  Manrope → Noto Sans Thai stack; no `.dark` class. Help drawer opens, trigger active = `bg-accent`.
- Not exercised: `HelpDrawer` `TONE` danger/warning/info tiles (need a troubleshooting article inside the
  drawer), `HelpStates` error state, `BriefPanel` text-error icon in the hero illustration, TH locale.

## Not verified
- Review checklist: DS-01 GAP — arbitrary px font sizes (`text-[8|9|10|11px]`) in
  `components/layout/{Sidebar,media-workspace-sidebar,Topbar,UserMenu,NotificationBell,GlobalSearch}`;
  predates the migration, not fixed here. DS-03 sizes PASS (measured). DS-05/11/13 NOT CHECKED.

## Open
- Close #281 after this PR merges into `dev` (owner's OK needed). Upstream DS issue #2 stays open.
- Owner: `~/.claude/CLAUDE.md` §8 still cites ADR 0075 → draft replacement offered in chat.
- Delete DS repo branch `feat/close-od-01-04-05-07` (R0) once all merged — owner agreed to the timing.
