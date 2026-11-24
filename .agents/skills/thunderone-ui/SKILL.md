---
name: thunderone-ui
description: Use when building, editing or reviewing any screen, component or page of a ThunderOne product, in any Workspace (Media, Help, or a new one). Enforces the company design system (tokens, app shell, components, icons, brand, copy) and loads the matching Workspace profile for domain vocabulary, icons and status mapping.
---

# ThunderOne UI

One design system for every ThunderOne Workspace. The core below applies everywhere. Domain detail lives in a **Workspace profile**.

## Step 0: pick the Workspace profile

1. Find the Workspace this work belongs to: the project's `AGENTS.md` line `ThunderOne workspace: <key>`, the user's request, or the product docs.
2. Read `references/workspaces/<key>.md`. Available: `media`, `help`.
3. No profile for that Workspace? Use the core only, say so in your reply, and copy `references/workspaces/_template.md` if the user wants one. Never borrow another Workspace's vocabulary, nav items, icons or status mapping.
4. A profile can add detail. It can never override a core rule (DS-xx). If it seems to, follow the core and report the conflict.

## Core rules (non-negotiable)

Each rule has an ID so reviews can cite it.

- **DS-01 Tokens only.** Never hardcode colors, font sizes, radii or shadows. Use `tokens.json` (CSS variables `--t1-*`, Tailwind/antd theme from the package).
- **DS-02 Theme from the package.** Use `@rdthunderthailand/thunderone-theme`. Never ship the stock Ant Design `#1677FF` theme, the Tailwind default palette or arbitrary hex classes.
- **DS-03 Platform shell.** Reuse the app shell (sidebar + header) exactly as specified below. Do not invent new navigation. Nav **contents** come from the Workspace profile.
- **DS-04 Status system.** Every state uses `status.*` tokens (success / warning / error / info / in-progress) through the profile's mapping. Never color-code status ad hoc, and never use status colors for taxonomy (categories, types, tags).
- **DS-05 Spacing.** 4px scale. Allowed gaps: 4, 8, 12, 16, 24. Default gap between cards is **12px**.
- **DS-06 Light theme first.** Add dark mode only when dark tokens exist in `tokens.json`.
- **DS-07 Typography.** Font is **Manrope** for Latin text. Never fall back to Inter, SF Pro or the Ant Design default. Thai text: see `references/open-decisions.md` (OD-05).
- **DS-08 Reuse components.** If a component exists in the shared library, import it. If one is missing, name it in your reply instead of inventing a new style.
- **DS-09 Icons.** Only `@ant-design/icons`, Outlined by default, through `T1Icon` (platform) or the profile's icon map. See `references/icons.md`.
- **DS-10 Brand.** Logos only from the SVGs in `assets/brand/`. Follow `references/brand.md`. Never recolor, stretch or retype the wordmark.
- **DS-11 States.** Every data surface has loading (skeleton), empty, and error-with-retry states. Never show an empty or error state while still loading.
- **DS-12 Copy.** Sentence case, 24h time, UI terms exactly as the Workspace's approved UI and profile vocabulary. See `references/patterns.md`.
- **DS-13 Accessibility.** Visible focus (`border.focus`), hit height ≥ 32px, `aria-label` on icon-only buttons.
- **DS-14 Disputed values.** If a value is listed in `references/open-decisions.md`, use the `tokens.json` value and mention the open decision in your reply.

## Token quick reference

| Use | Token | Value |
|---|---|---|
| App background | `color.bg.primary` | #F9FAFB |
| Card / sidebar surface | `color.surface.default` | #FFFFFF |
| Muted fill (segmented track, icon box) | `color.bg.primary-strong` | #F3F4F6 |
| Primary / secondary / muted text | `color.text.primary / secondary / tertiary` | #111827 / #374151 / #9CA3AF |
| Borders | `color.border.default` | #D1D5DB |
| Brand, primary button, active nav text | `color.action.primary` | #286EF9 (hover #0551DE, pressed #0444BB) |
| Active nav background | `color.action.subdued-menu` | #E9F4FF |
| Focus ring | `color.border.focus` | #0444BB |
| Success | `color.status.success` (+ `-bg`) | #10B981 / #ECFDF5 |
| Warning | `color.status.warning` (+ `-bg`) | #F59E0B / #FFFBEB |
| Error | `color.status.error` (+ `-bg`) | #EF4444 / #FEF2F2 |
| Info / In progress | `color.status.info`, `status.in-progress` | #286EF9 / #8B5CF6 |
| Card radius | `radius.xl` | 16px |
| Input, search, icon box, primary nav | `radius.lg` | 12px |
| Nav item, segmented item | `radius.md` | 10px |
| Badges and tags | `radius.pill` | 9999px |
| Card shadow | `shadow.card` | 0 1px 2px rgba(15,23,39,.04) |

## Theme: install the package, never write your own

Check `package.json`. If `@rdthunderthailand/thunderone-theme` is missing, install it (the project's `.npmrc` must map `@rdthunderthailand` to `https://npm.pkg.github.com`).

| Stack | Wire it at the app root |
|---|---|
| **Ant Design v5** | `import { t1Theme } from '@rdthunderthailand/thunderone-theme/antd'` → `<ConfigProvider theme={t1Theme}><App>…</App></ConfigProvider>`, plus `import '@rdthunderthailand/thunderone-theme/global.css'` |
| **Tailwind v3 / shadcn** (Lovable default) | `presets: [require('@rdthunderthailand/thunderone-theme/tailwind/preset')]` + `@import '@rdthunderthailand/thunderone-theme/tailwind/shadcn.css'` at the top of `src/index.css`. See `references/tailwind.md` |
| **Tailwind v4** | `@import "tailwindcss";` then `@import "@rdthunderthailand/thunderone-theme/tailwind/v4.css";` |

| Import | Contents |
|---|---|
| `…/antd` | `t1Theme`, `t1Status` (semantic status → antd Badge + colors), `t1Tokens` |
| `…/icons` | `T1Icon`: platform concept → icon map |
| `…/workspaces/<key>` | Workspace extras, e.g. `…/workspaces/media`: `mediaStatus`, `MediaIcon`, `channelTypeIcon` |
| `…/tokens` | `t1Tokens`: raw values for charts and custom CSS |
| `…/global.css` | Manrope, `--t1-*` variables, scrollbars, `.t1-scroll-quiet`, `.t1-scroll-x` |
| `…/brand/*.svg` | ThunderOne logos |

**Can't install packages** (Lovable without registry access, a quick prototype): copy the same files from `assets/code/`. They are identical copies, synced automatically.

**Changing a token:** edit `tokens.json` in the design system repo, run `npm run build:tokens`, commit and release. Never edit generated files or the copies in a project.

## Platform shell (desktop 1920w)

| Region | Spec |
|---|---|
| Sidebar (`aside`) | width 224 (223 + 1px right border). Logo block height 68 with bottom border. Collapse button pinned bottom (block height 57). |
| Nav item | height 32, inset 8px left/right (width 207), icon 16 at x12, label at x40. Primary item height 40. |
| Nav group label | uppercase, bold, muted (`text.secondary`), 20px left inset, 20px above first item. Group names and order come from the Workspace profile. |
| Nav count badge | pill, height ~15, right-aligned. |
| Header | height 69, horizontal padding 24. Left: H1 title + one-line muted subtitle. Center: search 448×36 with `⌘K` hint. Right: optional page controls, notifications icon button 36×36 with 8px dot, help `?` icon button, user block (32 avatar with initials + name + role). |
| Main content | padding 24 left/right, 20 top. Max content width 1648 at 1920w. |

Platform utilities (Help, Notifications, account) open from the header. They are not Workspace tiles and do not add sidebar sections.

## Grid and responsive

- Card grids use CSS grid with `fr` units, gap 12. Never fixed pixel columns.
- Below 1280px: collapse to 2 columns. Below 768px: 1 column, sidebar becomes a drawer.
- Side panels: desktop = right-side drawer, tablet = overlay, mobile = full-screen surface.

## Card (base surface)

- White surface, radius 16, `shadow.card`, padding 16 + 1px border.
- Header is translucent: `rgba(249,250,251,.95)` with `backdrop-filter: blur(4px)`, sticky on scroll.
- Card title (H2) top-left. Optional "View all … →" link button top-right, aligned to the title baseline.
- Content starts 12px below the title row. Lists inside cards use full-width rows separated by 1px borders.

## Scrolling

- Only the page scrolls vertically. The sidebar is sticky with its own nav scroll area (`.t1-scroll-quiet`).
- Scrollbars are thin and token-colored. Never leave the OS default scrollbar.
- Tables must not scroll sideways on desktop. Hide lower-priority columns based on the **card's** width (ResizeObserver), not the window width. The profile lists the drop order.
- Horizontal chip/segmented rows on phones use `.t1-scroll-x` with a fade mask on the right edge.

## Workflow

1. Step 0: load the Workspace profile.
2. Pick the page pattern (`references/patterns.md`, then the profile).
3. Build with existing components (`references/components.md`).
4. Run `references/review-checklist.md` before finishing. List anything that fails or is missing.
