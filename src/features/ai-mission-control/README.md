# ai-mission-control

The CEO / Owner Mission Control dashboard for Asset Intelligence — organization-wide asset risk and value overview (landing page at `/asset-intelligence/mission-control`). Composes `StatCardsRow` and `AttentionListCard` from `components/ui` primitives (`Card`, `Sparkline`), same pattern as `features/overview`'s dashboard.

`mock-data.ts` derives its numbers from `ai-assets`'s `getMockAssets()` rather than inventing separate fake data — there's no real insights/recommendation backend yet (see requirement doc §4.1 CEO-01..05 and `docs/adr/0018-asset-device-cross-reference-model.md`).

- `components/` — `StatCardsRow`, `AttentionListCard`, `MissionControlPage` (composes both)
- `mock-data.ts` — placeholder data derived from `ai-assets`, no backend yet
