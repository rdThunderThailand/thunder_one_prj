# Workspace profile: Media Workspace (`media`)

Adds to the core (SKILL.md). Never overrides a DS-xx rule.
Design source: Figma `Rev.2 - Media Workspace` (`opERvqzEvbeU8uuwMQmc4v`), page "DS Media Workspace" (node 2019:3303). Reference screen "MW-01 Overview / 1920w light" (node 2019:3868), **DESIGN APPROVED**.
Code: `import { mediaStatus, MediaIcon, channelTypeIcon } from '@rdthunderthailand/thunderone-theme/workspaces/media'`.

## Vocabulary (use these exact terms)
- **Channel** = any managed output. Types: **Screens**, **TV**, **PA / Audio**, **Kiosks**.
- **Program** = scheduled content block pushed to channels. **Playlist**, **Layout**, **Media library** = content building blocks.
- **Publication** = a published program/content.

## Navigation (fixed order)
Overview · Content (Media library, Playlists, Layouts) · Programming (Programs, Now & next, Calendar) · Channels (All channels, Screens, TV, PA / Audio, Kiosks) · Monitoring (Live view, Alerts, System health) · Reports & analytics (Reports, Analytics) · Settings (Brand Assets, Design System).
Primary nav item: "Overview" (height 40). Alerts carries a count badge.

## Status mapping (DS-04)
| Media state | Semantic token | antd Badge |
|---|---|---|
| Online | `status.success` | success |
| Live | `status.success` | success |
| Warning | `status.warning` | warning |
| Offline | `status.error` | error |
| Scheduled | `status.info` | processing |
| Processing | `status.in-progress` | processing |

## Icon map (`MediaIcon`, in addition to `T1Icon`)
| Concept | Key | React |
|---|---|---|
| Media library | `mediaLibrary` | `<PictureOutlined />` |
| Playlists / Create playlist | `playlists` | `<UnorderedListOutlined />` |
| Layouts | `layouts` | `<LayoutOutlined />` |
| Programs / Create program | `programs` | `<ProjectOutlined />` |
| Now & next | `nowNext` | `<PlayCircleOutlined />` |
| All channels | `allChannels` | `<ApartmentOutlined />` |
| Screens | `screen` | `<DesktopOutlined />` |
| TV | `tv` | `<FundProjectionScreenOutlined />` |
| PA / Audio | `pa` | `<SoundOutlined />` |
| Kiosks | `kiosk` | `<TabletOutlined />` |
| Live view | `liveView` | `<EyeOutlined />` |
| Alerts | `alerts` | `<BellOutlined />` |
| System health | `systemHealth` | `<HeartOutlined />` |
| Offline / connection lost | `offline` | `<DisconnectOutlined />` |
| No heartbeat | `noHeartbeat` | `<ExclamationCircleOutlined />` |
| Create publication | `createPublication` | `<SendOutlined />` |
| Upload media | `uploadMedia` | `<CloudUploadOutlined />` |
| Add channel | `addChannel` | `<PlusCircleOutlined />` |
| Schedule program | `scheduleProgram` | `<ScheduleOutlined />` |
| Brightness | `brightness` | `<SunOutlined />` |
| Wi-Fi / network | `network` | `<WifiOutlined />` |

## Overview dashboard (node 2019:3868)
1. Toolbar row: segmented filter (All channels / Screens / Audio) left, primary actions right.
2. KPI row: 5 stat cards × 320×140, gap 12 (Total, Online, Warning, Offline, Delivery success rate). The "rate" variant adds a delta pill (`↑ 1.2%`, h13) and a 56×56 ring chart.
3. 3-column grid (≈ 566 / 467 / 590 at 1648 wide, as `fr`), gap 12:
   - Col 1: Now playing → Today's schedule → Quick actions → Activity feed
   - Col 2: Next program → Channel health → Channels by type
   - Col 3: Needs attention (tall, list of alerts)
4. Footer bar: auto-refresh state with status dot · "Last updated: HH:MM:SS" · time zone right-aligned.

## Table column drop order (narrow cards)
Uptime (<1040px) → Now playing (<880px) → Type (<600px) → Status and heartbeat fold under the channel name (<520px).

## Media components
| Component | Spec |
|---|---|
| Alert row ("Needs attention") | Height 57. 28×28 tinted icon box (icon 14) → title 12 (`Location · Device`) + subtitle 11 muted → relative time ("5m ago") → channel-type tag. |
| Schedule row (timeline) | Height 43. 8px status dot on a 1px vertical line (x22) → `HH:MM` → title 12 + "Program" caption 10 → Live badge or "N channels". |
| Activity row | 24×24 icon box (icon 14) → sentence 11 with quoted entity names (“Lunch Promotion”) + actor/location caption 10 → time right. |
| Channel health bars | Status dot 6 + label + "count (pct%)" → 4px progress bar. Paired with a 104×104 donut, total in center. |
| Channel type tile | ~102×115 bordered tile: icon 20, label, count 24px, "N online", "N issues" (warning tint when > 0). |
| Program preview | 112×84 rounded thumbnail, gradient, overlay "Live broadcast" + title. Stats strip: Screens / TV / PA / Kiosk with icon 14 + count. |
| Channel-type tag | Core Tag (bordered pill): Screen, TV, PA, Kiosk. |

## Open items
- Token conflicts on the approved screen: `open-decisions.md` OD-01.
- Icon map not signed off by design: OD-04.
