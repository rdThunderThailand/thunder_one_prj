# Open questions for the Thunder_Core (backend) team

From the requirement doc's §9 Open follow-up — concrete questions to bring to that team, not answered from this repo alone.

1. **Should Asset Intelligence be a new row in `public.applications` (with its own `tenant_applications` entries, per the multi-app pattern ADR 0007 documents `CityZen` already using), or share the existing `x-api-key`/application binding Media Workspace uses?** Affects how Asset Intelligence's frontend authenticates and how its data gets tenant-scoped — see ADR 0007 for the mechanism this would extend.

2. **Which side owns the foreign key for the Asset↔Device cross-reference** (`docs/adr/0018-asset-device-cross-reference-model.md`)? Does `ai-assets`'s `Asset.externalRef` point at a `media_core`/`channel_devices` row, does `media_core` gain a column pointing back at the Asset Intelligence Asset id, or both, kept in sync? See `plan-asset-device-model.md` for the three options considered from this side.

Neither question can be answered by reading this repo — both depend on `Thunder_Core`'s schema and that team's own constraints.
