# Page patterns (platform)

Workspace-specific pages (dashboards, domain flows) are in `workspaces/<key>.md`.

## List / management page
- Same shell. H1 = page name, subtitle = one-line purpose.
- Toolbar: segmented filter or search left, primary "Create …" button right.
- Content in a single card with a table. Rows use list-row density (43–57px).
- Every table has an empty state (icon + one line + primary action), loading skeleton, and error state with retry (DS-11).
- Column drop order for narrow cards is defined per Workspace.

## Dashboard page
- Toolbar row: segmented filter left, primary actions right.
- Optional stat-card row, then a card grid (gap 12, `fr` columns, responsive per SKILL.md).
- The Workspace profile defines which cards, their order and any footer (e.g. auto-refresh).

## Side panel (contextual)
- Opens from a header or row action without leaving the page. Desktop right drawer, tablet overlay, mobile full-screen.
- Must be closable, keep the page state underneath unchanged, and offer a route to the full page when there is one.

## Copy rules (DS-12)
- Sentence case for headings, buttons and menu items ("View all alerts", not "View All Alerts").
- Use the exact terms of the Workspace's approved UI and profile vocabulary. Same thing, same word, on every screen.
- Relative time for recent events ("5m ago"); 24h clock for times (`09:00`); show the time zone where times matter (default `Asia/Bangkok (UTC+7)`).
- Percentages with one decimal ("90.3%").
- Locations formatted `Place · Device` when both exist.

## Language (TH / EN)
- Text must fit in both Thai and English. Do not size buttons or columns to the English string only.
- A language switch changes the language of the same content. Never show one language's content labeled as the other.
- Thai typeface: see `open-decisions.md` (OD-05).
