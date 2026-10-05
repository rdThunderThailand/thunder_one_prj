# Program Edit acceptance — 2026-10-05

## Authorization, environment and scope

Owner confirmed #214 merged; GitHub verified merge 3b36a856930ddede7735285458c50ed7d14a372e. Owner approved /private/tmp/acceptance-program-edit-2026-10-05.md and the recommended temporary Playwright method, then logged in to the separate browser. Scope was verification only; no app code, schema, dependency, production, deployment or tag change.

Develop project ftfmokgphewzyxzwjitv; tenant 22222222-2222-2222-2222-222222222222. localhost proxy config HTTP 200 identified Core localhost:3001; listening process cwd was Thunder_Core and its configured Supabase ref matched develop. All business writes remained in develop.

Guarded SQL created exactly fourteen authored rows in one transaction. Guarded creation/deactivation scripts: /private/tmp/thunder-acceptance-195-204/edit-fixture.sql and edit-deactivate.sql. The second script was executed only after both Programs were confirmed cancelled.

| Table | Exact fixture IDs |
|---|---|
| Location | 7a1ae1f1-aaaf-4bb9-9be1-5ac597ae4931 |
| Channels | 4acddcf5-4c64-46f7-aae8-1d8efde1497b; 3a4e4b56-97b3-4175-86bc-217f77f0f186 |
| Group | 397a93ac-bc4e-4d42-8149-b3ebd4c13c52 |
| Group members (composite keys) | Group above + M2 1f3f43f0-1e7a-4aaf-b99b-ce4d7d888b12; Group above + fixture Channel 4acddcf5… |
| Publications | bb7533a9-6352-401a-8c80-3725b676d1a1; 57645a37-c5a6-4f53-8fa4-24030f84ce57 |
| Publication targets | b0659edb-ab25-42de-b4cc-c10dec78cc12; e9b3ca41-b882-45b9-8870-287b1ae349c7; f7cf81a8-cfea-497f-b17a-c24ab1d4d381; e25e3cd7-0c98-4fef-a3cc-d1c4968c3940 |
| Schedules | 2ed23a2b-db1a-44eb-adc9-911672d7f498; 8849b3b2-aca6-4fbd-9e9b-6da84832862b |

New Group was independent; new Channels had no device links. Existing M2 and its sole offline asset d995d6e8-d16e-4ad3-8736-3a95f1037250 were referenced without modification. One new Channel used the new Location, the retained Channel used existing Bangkok Substation 55555555-5555-5555-5555-555555555555. No credentials, reservations or media were inserted.

Programs referenced existing private Composition b8655de6-56fd-4f29-95a8-79b1b180cb08 revision 5 and its Playlist 02f4c932-8f86-43c1-a66d-3b728e70a505 revision 4. Approved/ready media and files were revalidated. Alternative Test Layout 1 8a51df15-09e8-4608-926f-59f4ab85c205 revision 4 was selected only in form, then discarded. Schedules were finite: A from insertion minus 5m to plus 2h; B plus 24h to plus 48h, Asia/Bangkok, recurrence {}.

Temporary headed Chrome/Playwright stayed outside the repo. Browser blocked business writes except one activation and one cancel per named Publication. Read-only conflict/preview POSTs and authentication were permitted. No token/header/storage-state exported. Initial sandbox launch failed at Chrome Crashpad filesystem access; approved elevated launch succeeded. Test browser closed, runner exited 0.

## Actual browser acceptance

- Draft Change Layout: removed old picker selection, selected Test Layout 1, clicked Select; form content and preview label changed after detail loading. The picker can retain multiple selections; initially choosing an additional item left the old selection first. No claim that this first attempt changed Layout.
- Dirty-form Go Back opened Discard changes?; Stay retained the edit, subsequent Discard left the page. Reopening showed original zz-accept-layout-oct5 and original Group/Channel targets. No Save/Next/draft PATCH or unexpected draft creation request occurred.
- Location facets: All Locations showed 7 committed Channels; Bangkok Substation showed 5; zz-edit-location-oct5 showed its sole new Channel. Switching filters retained selected targets and summary 3 Channels/2 Locations. Checking the additional fixture Channel and Cancel did not retain that selection on reopening.
- A and B each activated once through actual HTTP API, both HTTP 200 with target_device_count 1. Target expansion and NULL heartbeat were rechecked immediately before each activation.
- Real list row B displayed Scheduled and next airing 6 Oct 2026 21:58 Bangkok time. Real row A displayed Live with Not playing yet, 0/1, 1 offline; the Live badge also appeared on its Edit page. Screenshots were visually inspected.
- Live A: removed Group in form, retained keep Channel, Apply changed only form state. Publish changes dialog displayed the literal warning `Will stop playing on 1 channel: zz-edit-group-oct5`. Cancel then dirty-form Discard restored original targets on reopening. Publish was never confirmed.

Some wrong exact-name locators timed out (singular Apply and lowercase Publish changes); corrected locators used observed accessible labels. An initial navigation used a nonexistent plural route before inspecting the actual singular program route. These attempts were not passes and issued no business mutation.

## Status semantics: corrected assumption and remaining gap

The proposal assumed an open offline target would produce Publishing. Actual deployed develop function public.media_publications_list computes waiting only for pending/downloading/delivered Job Targets whose heartbeat health is not offline. media_core.publication_display_status returns Live for an open active Program with waiting=false. Hence A legitimately displayed Live under the current contract despite a pending offline target.

This round verifies actual Live and Scheduled rows and the Live Edit path. Publishing on a real row remains unverified. No heartbeat or fake delivery/playing state was written to manufacture it. Live is not Playback Confirmed; physical playback remains unverified.

## Group warning discrepancy and limits

Source trace: program-edit.ts removedTargetLabels returns one name per removed target row; useProgramEdit passes these labels to PublishChangesDialog, which calls their length a Channel count. The browser visibly names zz-edit-group-oct5 as a Channel. This is a reproduced Group/Channel copy mismatch, not accepted as correct copy.

The current Group had two directory Channel members, but one had no Player. Actual publication_snapshot_group_members contained only M2 (device-bearing Channel), so the published snapshot lost one playable Channel when removing Group. Do not claim this fixture proves numeric undercount for multiple playable Channels: it does not. It also does not cover overlap between a removed Group and retained direct Channels. Follow-up should trace actual removed Channel reach and wording across Group/direct overlap before choosing the smallest correction; no correction implemented here.

Additional observations, not fixes: the Live Edit rail says Playing on 1 channel despite pending offline delivery; the dialog showed a newer-Layout note although referenced content fingerprints did not change in this run. These require independent source/contract diagnosis before claiming bugs or changing behavior.

## Jobs, cancellation and postconditions

| Publication | Job | Snapshot | Job Target |
|---|---|---|---|
| A bb7533a9… | eebfcaa1-df84-4695-8bd8-8781759e1bc5 | 34eba165-d475-45c0-9c2c-c75a1f79372e | 07dc601b-5f2c-4fd2-98f2-d936e5d2ae68 |
| B 57645a37… | 37fa62ff-5df9-4cb6-bde1-10cb0bae0e58 | e2f75885-187a-4cf2-b879-f45763f7c4c9 | b42fd8b3-6d98-42f8-b4b9-bdaad81d9520 |

Exactly two Jobs/two snapshots/two Job Targets, all targeting only the approved M2 asset. Both cancel POSTs returned HTTP 200; DB confirms both Publications cancelled revision 1, original Composition and four target rows retained. Job Targets remain pending. No publication PATCH or update-published request was attempted.

Fixture Group disabled; both fixture Channels inactive; new Location inactive. Authored and historical rows retained, no delete/trash. Target heartbeat remains NULL. Field-by-field pre/post fingerprint equality passed for both referenced Compositions, their Zone bindings, private Playlist/items, existing M2 Channel/device link and existing Bangkok Location.

No app code changed; no build/lint/TypeScript/model-check pass claimed for this documentation-only change. git diff --check is run for the record. Existing broad Figma decisions and physical Player work remain separate. Owner controls Ready/merge.

Screenshots: /private/tmp/edit-dirty-discard.png, edit-location-facets.png, edit-real-status-badges.png, edit-live-remove-group.png. Last two inspected visually. Temporary evidence files are not repo dependencies.
