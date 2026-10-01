# SESSIONLOG — Ticket 06 republish route verification — 2026-08-28

## Scope

Verified the existing Ticket 06 re-publish action against the persistent `develop` Supabase branch
`ftfmokgphewzyxzwjitv`, after explicit approval for the state-changing action. No production data
or schema was changed.

## Evidence

- A direct unauthenticated `POST` to Core `:3001` returned `401`; it wrote nothing.
- The authenticated ThunderOne detail page for composition Publication
  `7b6cb708-bceb-4a0d-b266-a5e10e1f821e` showed its drift indicator and re-publish confirmation.
- Before action, the exact Publication belonged to tenant `22222222-2222-2222-2222-222222222222`,
  was `active`, and had 4 Jobs / 4 Snapshots.
- The UI confirmation called the normal application path successfully. Its post-action state shows
  a new activation timestamp and `published_by`.
- Postflight SQL: 5 Jobs / 5 Snapshots. The newest Job is
  `bb958136-777b-48c1-876f-907fdb3fc150`, references Snapshot
  `bf7b5283-b459-42b5-b149-4308f90c53ca`, and that Snapshot contains 2 Zones / 6 Items.

## Deliberate retention

The new Job and Snapshot are the expected durable record of a real re-publish, so they were not
deleted. The exact pre-existing composition Publication was used; no temporary fixture was created.
