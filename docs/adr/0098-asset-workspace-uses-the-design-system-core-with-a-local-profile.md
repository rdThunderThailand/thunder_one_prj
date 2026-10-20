# Asset Workspace uses the design system core with a local profile

**Status:** accepted · 2026-10-20
**Extends:** ADR 0096 (the ThunderOne design system is the UI source) for `src/features/asset-workspace/**`
and `src/app/(dashboard)/(application)/asset-workspace/**`
**Source:** Dev Lead decision 2026-10-20; Phase 1 work package P1-05; Product Specification v1.1.5 §4.3–4.4, §4.11
**Related:** Pace #38 (P1-05); ADR 0097 (Asset Workspace routes); P1-03 domain (`src/features/asset-workspace/domain/`)

## Context

The work package (written 2026-10-14) asked P1-05 to extend ADR 0075/0076: Lovable primitives plus the
old `globals.css` tokens. ADR 0096 (2026-10-16) superseded the visual parts of both — the `thunderone-ui`
skill is now the UI source and every screen takes its tokens from `src/design-system/`.

The skill picks domain vocabulary, status colours and icons from a **Workspace profile**. It ships
`media` and `help` only; this repo's `AGENTS.md` names `media`. The skill forbids borrowing another
Workspace's vocabulary, status mapping or icons, and requires states to map to `status.*` tokens
through a profile (DS-04). Asset Workspace has five statuses and four conditions (P1-03) that no
profile covers. This repo cannot add a profile to the design system repo (read-only, ADR 0096).

## Decision

1. **Visual authority** for Asset Workspace screens is the skill's **core** (DS-01…DS-14) and the
   local profile below. The `media` profile does not apply there: no Media terms, nav items, icons or
   status mapping.
2. **Components** come from `src/components/ui/lovable/` and the shared `src/components/ui/` pieces,
   as everywhere else (ADR 0096 §1). `WizardSteps`, `Pagination` and `StatTile` are **reused as they
   are**: the design system sweep (ADR 0096 plan P5/P6) already moved them to tokens on `dev`. A piece
   that is missing is named in the PR (DS-08), not styled ad hoc in the feature folder.
3. **Status mapping (DS-04).** One map in code, next to the domain, used by every badge, pill, tile
   and filter chip; screens never pick a colour per status.

   | Asset status | Token | Badge |
   |---|---|---|
   | Available | `status.success` | success |
   | Assigned | `status.info` | processing |
   | In Maintenance | `status.warning` | warning |
   | Retired | neutral | default |
   | Disposed | neutral | default |

   | Condition | Token | Badge |
   |---|---|---|
   | Good | `status.success` | success |
   | Fair | neutral | default |
   | Damaged | `status.warning` | warning |
   | Unusable | `status.error` | error |

   *Neutral* = `text.secondary` on `bg.primary-strong`, no dot colour — Retired and Disposed are end
   states, not alerts, and Fair needs no attention. `status.in-progress` is not used. Categories and
   asset types are taxonomy and use tags, never status colours (DS-04).
4. **Icon map** (in addition to `T1Icon`; all present in the skill's antd list). Added to
   `src/components/ui/icons.tsx` when the first screen needs them, never imported from
   `@ant-design/icons` in feature code. Platform concepts keep `T1Icon`: Overview (`overview`),
   Reports (`reports`), Settings (`settings`), Register (`create`), activity history (`activity`).

   | Concept | Glyph |
   |---|---|
   | Assets | `InboxOutlined` |
   | Assignments | `SolutionOutlined` |
   | Inventory | `AuditOutlined` |
   | Categories | `TagsOutlined` |
   | Locations | `EnvironmentOutlined` |
   | Lifecycle & Warranty | `SafetyCertificateOutlined` |
   | My Assets | `ContainerOutlined` |
   | Scan | `ScanOutlined` |
   | Bulk import | `ImportOutlined` |
   | Print label | `PrinterOutlined` |
   | Transfer | `SwapOutlined` |
   | Return | `RollbackOutlined` |
   | Maintenance | `ToolOutlined` |
   | Retire | `StopOutlined` |
   | Dispose | `RestOutlined` |

5. **Light only** (DS-06), and every data surface has loading, empty and error-with-retry states
   (DS-11) — P1-06 builds those once for the whole Workspace.
6. **Upstream.** This profile is local until the design system team ships an `asset` profile; the
   request goes to the design system repo's issue #2 like ADR 0096 §6. When it ships, the vendored
   skill is re-copied and this ADR is superseded where they differ.

## Alternatives

- **Extend ADR 0075/0076 as the work package said.** Rejected: ADR 0096 superseded their visual parts;
  building new screens on them would be swept again.
- **Core rules only, no mapping.** Rejected: each screen would choose its own status colours, which
  DS-04 forbids and which drifts between the list, the profile and the tiles.
- **Wait for the design system team's `asset` profile.** Rejected: P1-06…P1-08 depend on this ADR and
  are due this week; the local profile is cheap to replace.
- **Assigned = `status.in-progress` (violet)** to keep it apart from the brand blue. Rejected:
  Assigned is a steady state, not work in progress.
- **Restyle or copy `WizardSteps` / `Pagination` / `StatTile` for Asset Workspace.** Not needed: the
  shared pieces already follow the tokens.

## Consequences

- `feat/asset-workspace-mvp` is behind `dev` and still has the pre-sweep `WizardSteps`, `Pagination`
  and `StatTile`; it must take `dev` before P1-06/P1-07 use them.
- The status map is built (next to `domain/`) by the first task that shows a status — P1-07 — and
  P1-08 reads the same map instead of hard-coding classes.
- The Phase 1 nav icons (`asset-workspace.tsx`) predate this map; they are aligned when the nav is
  next touched, not in this ADR's PR.
- `AGENTS.md` gets an "Asset Workspace styling" note pointing here.
