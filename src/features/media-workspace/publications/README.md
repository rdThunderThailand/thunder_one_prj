# publications

A publishable package that binds an Asset or Playlist snapshot to Channels and a Schedule — see `CONTEXT.md` at the repo root for the full definition.

> R&D placeholder — the "Create Publication" wizard (step 1: Basic Info) is built as UI only. `Campaign` reflects the full product mockup (Phase 2+), not Phase 1 MVP scope, same tradeoff as `features/overview` — see `docs/adr/` for phasing.

- `components/` — wizard step components (`PublicationStepper`, `BasicInfoForm`, `PreviewPanel`) composed by `CreatePublicationPage`
- `mock-data.ts` — placeholder data (campaigns, publication types, priorities), no backend yet
