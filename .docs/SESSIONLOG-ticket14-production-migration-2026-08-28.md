# SESSIONLOG — Ticket 14 production migration and Template list correction — 2026-08-28

## Outcome

- Applied Ticket 14 migration `20260827103121_layout_kind_template_split.sql` to production
  `sfiefevtxalqjizdkcsw` after explicit R0 approval.
- Verified production now has `media_core.layouts.kind` (`NOT NULL`, default `template`) and the
  `media_layout_set_kind`, `media_composition_fork_layout`, and
  `media_composition_duplicate` RPC signatures.
- Local Thunder_Core on `:3001` targets the persistent `develop` branch
  `ftfmokgphewzyxzwjitv`, not production. This was established from the Core configuration without
  reading credentials.
- Browser verification at `/media-workspace/layouts/templates` initially showed a private Layout
  `comp:ca369a56-5333-403f-8d72-8eb6fd45ff36` among Templates. Read-only develop inspection found
  that exact row was incorrectly `kind = template` while used by one Composition.
- After explicit approval, changed only that exact develop row to `kind = inline`; repeat SQL and
  browser verification passed. The Templates list now shows 2 named Templates and excludes `comp:*`.

## Why `comp:<uuid>` exists

It is the deliberate name of a private, Composition-owned Layout. The Ticket 14 filter is supposed
to hide it through `kind = inline`. The observed row was misclassified, not a UI filter defect.

## Next

- Ticket 20: develop has 13 credentialed Devices, 9 with missing geometry, so `Unknown (n)` can be
  browser-verified against existing data without a fixture write.
- `/no-access` still needs a signed-in account with no tenant membership.

## Ticket 20 fixture attempt

- Develop preflight found 13 credentialed Devices, 9 without complete geometry, but none was already
  assigned to a Channel.
- With explicit approval, created temporary Channel
  `07934b49-2836-4e56-9dcf-bf4991ff2020` and assigned Device
  `0e657c4d-96d0-4358-9c40-c3de169ec4c0`. Its direct Edit route rendered a blank disabled form, so it
  could not safely reach the Publication preview.
- Cleaned up immediately: deleted 1 association and 1 Channel. Repeat SELECT confirmed 0 Channel
  rows and 0 association rows for the fixture UUID.
- A normal browser-created Channel fixture also succeeded (`1f8cb016-4728-464f-b612-48e1f1f83fb7`):
  one assigned Device and `unknown_geometry = 1`. It was removed with its association immediately;
  repeat SELECT again returned 0 Channel and 0 association rows. Reaching a Publication preview would
  require a durable temporary Publication draft, which was not created.

## Ticket 20 follow-up

- A second normal browser-created Channel fixture (`7a6ccb3d-9f15-4aeb-8899-33012748ac00`) was
  created after approval to proceed toward a temporary Publication draft. It was removed before
  leaving the browser: 1 association and 1 Channel removed; repeat SELECT returned 0 rows for both.
- Publication creation is paused safely: the browser has a pre-existing local unfinished draft named
  `test`. Choosing “Start new” would discard that local draft, so no user draft was modified.

## Ticket 20 browser verification

- With approval, started a fresh local draft, created a temporary Publication draft
  `88ef0f78-6d11-4026-b509-c1addd736e95`, and selected the temporary Channel
  `cfdca774-7bc7-4d4f-b11c-c47959491997` with one Device that reports no geometry.
- The Channel fixture initially had an In-store category/type that the Publication selector did not
  list. It was changed only for the test to matching `dooh` category/type, then appeared in the
  selector.
- In Review → Preview playback, the live UI displayed `Unknown (1)` and “These targets report no
  screen geometry. Previewing at 16:9 from the Layout instead.” This verifies the Ticket 20
  unknown-geometry fallback path.
- Cleaned up in dependency order: 1 publication target, 1 schedule, 1 draft publication, 1 Channel
  device association, and 1 Channel. Repeat SELECT confirmed zero publication, target, schedule,
  Channel, and association rows for both fixture UUIDs.
