# Media Detail layout repair — 2026-08-30

## Delivered

- Set the desktop preview/detail card and Usage card to the same 394px height.
- Made the preview fill its card height on desktop.
- Moved Quick Actions into the Media Detail right rail and arranged them as a compact two-column grid.
- Reduced inter-panel spacing and normalized right-rail card padding.

## Verification

- Browser reproduction used the Media Detail page for `KFC-small.jpg` at the supplied desktop viewport.
- Preview/detail and Usage measured 394px each; Quick Actions rendered within the right rail.
- The main content had equal `scrollHeight` and `clientHeight`, so it did not overflow at that viewport.
- Browser console had no errors. `pnpm exec tsc --noEmit`, targeted ESLint and `git diff --check` passed.

## Remaining

- No Move or Trash mutation was performed during this visual verification.
