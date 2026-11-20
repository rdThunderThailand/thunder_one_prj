# Workspace profile: Help (`help`)

Adds to the core (SKILL.md). Never overrides a DS-xx rule.
Product truth: *ThunderOne Help Workspace — Product Definition v0.1* and *Product Specification v0.1* (Approved, 2026-10-03). UX canonical: FigJam "Help Center" (`dYc8BpEctkpogcJ1jx86fZ`).
This profile only says how Help looks and where it sits in the platform shell. Behavior, data and acceptance criteria stay in the Spec; when the two disagree, the Spec wins and the conflict is reported.

## Where Help lives
- Help is a **platform utility**, not a Workspace: no Workspace tile, no Help sidebar, no Help section in another Workspace's nav, no Workspace settings.
- Entry points: the header `?` icon button (`T1Icon.help`) opens the contextual drawer; the Help menu opens the full-page Help Center.
- Help Center IA: Home / Browse / Search Results / Article. "Guides" is not a top-level menu. Support is an escalation link, not a section.

## Screens
| ID | Screen | Pattern |
|---|---|---|
| HLP-001 | Help Center Home | Entries for Search, Workspace, Content Type and Recommended Guides (HELP-AC-016) |
| HLP-002 | Search Results | List rows, filters as segmented/tags |
| HLP-003 | Article Page | Reading layout, related + troubleshooting Guides, TH/EN switch |
| HLP-004 | Contextual Help Drawer | Core side panel: desktop right drawer, tablet overlay, mobile full-screen |
| HLP-005 | Browse / Category Results | List page with Workspace + Content Type filters |
| HLP-006 | No Results | Core empty state: new search, browse, support |
| HLP-007 | Loading | Core skeleton (DS-11) |
| HLP-008 | Error / Unavailable | Core error state: Retry / Back / Open Help Center / Support |

## Vocabulary (use these exact terms)
- **Guide** = one help item with one identity across TH and EN. The page that shows it is the Article page.
- Content Types, exactly five, in this order: **Getting Started**, **How-to**, **Concept & Explanation**, **Troubleshooting**, **Reference**.
- **Contact Support** is an action, never a Content Type, tag or filter.
- "Back to ThunderOne" when there is a return context; "Go to ThunderOne" for a public visitor without one.

## Visual rules
- Content Type and Workspace are **taxonomy**: show them with the core Tag, never with status colors (DS-04).
- The drawer groups Guides as Primary, Related and Troubleshooting. The drawer is read-only: no business create/edit/delete buttons inside it.
- Lifecycle states (Draft, In review, Approved, Published, Archived) are never shown to end users; only Published content appears.
- TH/EN switch sits on the Article and in the drawer. If the requested language is missing, show "translation unavailable" with the available language as an action. Never render one language under the other's label.
- Public pages must render fully without a session. The user block and notifications appear only when the visitor is signed in.

## Icon proposals (not signed off, OD-04)
| Concept | React |
|---|---|
| Getting Started | `<RocketOutlined />` |
| How-to | `<ReadOutlined />` |
| Concept & Explanation | `<BulbOutlined />` |
| Troubleshooting | `<ToolOutlined />` |
| Reference | `<BookOutlined />` |
| Contact Support | `<CustomerServiceOutlined />` |
| Language switch | `T1Icon.language` |
| Back to ThunderOne | `T1Icon.back` |

Not exported as code until design signs them off.

## Open items
- Public Help Center page shell (no sidebar, no session) is not specified in the design system yet: OD-06.
- Thai typeface for TH content: OD-05 (blocking for Help, since TH/EN must be tested with real content).
