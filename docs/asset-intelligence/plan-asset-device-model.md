# Plan: Asset↔Device cross-reference model

Expands `docs/adr/0024-asset-device-cross-reference-model.md` into the concrete schema notes for `src/features/asset-intelligence/assets/types/index.ts`.

## Current shape

```ts
type AssetCategory = "laptop" | "printer" | "nas" | "media_player_device" | "other";
type AssetStatus = "healthy" | "attention" | "critical";

interface Asset {
  id: string;
  tag: string;
  category: AssetCategory;
  status: AssetStatus;
  locationId: string | null;
  departmentId: string | null;
  assigneeId: string | null;
  vendorId: string | null;
  warrantyExpiry: string | null;
  purchaseValue: number;
  healthScore: number;
  externalRef: string | null; // cross-reference slot — see below
}
```

`externalRef` ships unused this sprint (always `null` in `services/mock-assets.ts`). Nothing reads or writes it yet — no assignment flow exists (that's the Sprint 2+ state machine, requirement doc §5.1 / a future ADR-0019), and no Thunder_Core contract exists to write against.

## Still open — needs the Thunder_Core (backend) team

Which side owns the foreign key:
- **Option A**: `asset-intelligence/assets`'s `Asset.externalRef` stores the `media_core` Device/`channel_devices` id. Keeps the pointer next to the entity whose lifecycle drives the assignment (Asset Intelligence decides "this Asset now serves as a Device").
- **Option B**: `media_core` stores the Asset Intelligence Asset id (e.g. a new column on `channel_devices`). Keeps the pointer next to the entity that actually consumes it for playback/targeting.
- **Option C**: both directions, kept in sync — more redundancy, needs a defined sync mechanism (write-through, event, or periodic reconciliation).

This repo cannot decide this alone — see `questions-thunder-core-contract.md` for the concrete question to bring to that team. Whichever direction is chosen, `Asset.externalRef`'s type (`string | null`) does not need to change; only who writes to it and when does.

## When this gets implemented

1. Direction decided with Thunder_Core team → recorded in a follow-up ADR (0024 stays as the "we decided to defer this" record; a new ADR records the actual answer, per this repo's convention of not editing a shipped ADR's Decision after the fact).
2. Assignment flow (requirement doc §5.1 state machine) writes `externalRef` when an Asset of category `media_player_device` is assigned to Media Workspace.
3. `features/asset-intelligence/assets` gains a real service call (replacing `services/mock-assets.ts`) once the sync contract exists.
