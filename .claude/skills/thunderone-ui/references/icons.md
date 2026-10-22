# Icons

**Library:** Ant Design Icons (`@ant-design/icons`). The Figma page "Assets Icon" contains the full Ant Design set in three styles: **Outlined** (default, 446 icons), **Filled**, and **Two Tone**. The full Outlined list is in `assets/icons/antd-outlined-icons.txt`.

## Rules (DS-09)
1. Use **Outlined** by default. Use **Filled** only for active or selected state (e.g. the active nav item, a toggled star). Do not use **Two Tone** in product UI.
2. Import from `@ant-design/icons`, through `T1Icon` (platform concepts below) or the Workspace profile's icon map. Do not copy SVG paths into components, and do not mix in another icon library (lucide, heroicons, material). If an icon is missing, ask design instead of using another set.
3. Sizes: 12 (link arrows), 14 (inline rows), 16 (nav, buttons, header), 20 (tiles). Set with `style={{ fontSize: 16 }}`.
4. Color is inherited (`currentColor`). Use text tokens, or `status.*` tokens inside status icon boxes. Never recolor the brand mark with an icon color.
5. Icon-only buttons must have `aria-label`.
6. One concept, one icon, across every Workspace. A Workspace profile adds icons for its own concepts; it never remaps a platform concept below.

## Platform icon map (`T1Icon` from `@rdthunderthailand/thunderone-theme/icons`)
| Concept | `T1Icon` key | React |
|---|---|---|
| Overview / home | `overview` | `<DashboardOutlined />` |
| Search | `search` | `<SearchOutlined />` |
| Notifications | `notifications` | `<BellOutlined />` |
| Help | `help` | `<QuestionCircleOutlined />` |
| Collapse sidebar | `collapse` | `<MenuFoldOutlined />` |
| Expand sidebar | `expand` | `<MenuUnfoldOutlined />` |
| Success / online | `success` | `<CheckCircleOutlined />` |
| Warning | `warning` | `<WarningOutlined />` |
| Error / attention | `error` | `<ExclamationCircleOutlined />` |
| Create | `create` | `<PlusOutlined />` |
| Edit | `edit` | `<EditOutlined />` |
| Delete | `delete` | `<DeleteOutlined />` |
| More actions | `more` | `<MoreOutlined />` |
| Filter | `filter` | `<FilterOutlined />` |
| Refresh / retry | `refresh` | `<ReloadOutlined />` |
| Settings | `settings` | `<SettingOutlined />` |
| View all / link arrow | `linkArrow` | `<RightOutlined />` |
| Back | `back` | `<LeftOutlined />` |
| Close | `close` | `<CloseOutlined />` |
| Calendar / date range | `calendar` | `<CalendarOutlined />` |
| Time | `time` | `<ClockCircleOutlined />` |
| Activity / history | `activity` | `<HistoryOutlined />` |
| User | `user` | `<UserOutlined />` |
| Upload | `upload` | `<CloudUploadOutlined />` |
| Reports | `reports` | `<FileTextOutlined />` |
| Analytics | `analytics` | `<LineChartOutlined />` |
| Language | `language` | `<GlobalOutlined />` |
| External link | `externalLink` | `<ExportOutlined />` |
| Brand Assets | `brandAssets` | `<SkinOutlined />` |
| Design System | `designSystem` | `<BgColorsOutlined />` |

> This map is a proposal built from the Ant Design set in Figma and has not been signed off by design (see `open-decisions.md` OD-04). `back`, `close`, `language` and `externalLink` were added for platform utilities (Help, drawers) and are not on an approved screen yet.
