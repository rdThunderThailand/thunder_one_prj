# Media Workspace MCP pilot

## Problem Statement

Media operators receive requests in LINE that name a branch and screen and often include a Google Drive link. They must download and register the media, identify the target, and prepare the Program by hand. A request such as “60904 Ao Nang, add this file to screen 4” can also leave the intended Program change unclear. The team wants to handle these requests from an AI client without browser automation or accidental changes to other screens.

## Solution

Offer one remote MCP endpoint for Media Workspace. Start with an internal team in one explicitly enabled tenant. Each operator signs in individually, pastes the request, and answers only questions needed to disambiguate the action, target, or schedule. With permission, the assistant imports the selected Drive file and prepares a reviewable Program draft or change proposal. An operator reviews and publishes in ThunderOne. The assistant can then report delivery and Player-reported playback separately.

## User Stories

1. As a Media operator, I want to paste a LINE request into chat, so that I can start from the original brief.
2. As a Media operator, I want to connect from Claude, Codex, or Grok Bot, so that I can use my existing client.
3. As a Media operator, I want to sign in with my own account, so that actions use my access and can be attributed to me.
4. As a Media operator, I want to find an existing Asset, so that I can reuse it without importing another copy.
5. As a Media operator, I want to resolve a branch and screen to the actual Channel and Media Device, so that I can verify the destination.
6. As a Media operator, I want to see the current Program, so that I can decide whether to append or create a new one.
7. As a Media operator, I want the assistant to ask when the intent or target is ambiguous, so that it never writes based on a guess.
8. As a Media operator, I want to see all Media Devices affected by the Program, so that I can catch requests that would affect extra screens.
9. As a Media operator, I want to know if the source Playlist is shared, so that I can avoid changing another Program.
10. As a Media operator, I want to import a Drive file using my Google account, so that I can use files already shared with me.
11. As a Media operator, I want actionable feedback when a file cannot be downloaded or accepted, so that I can fix the source.
12. As a Media operator, I want to distinguish import progress from playback readiness, so that I can review only playable media.
13. As a Media operator, I want retries to reuse the same import and draft, so that a timeout does not duplicate work.
14. As a Media operator, I want to prepare a new Program with a clear target and Schedule, so that I can review it without manually reentering the brief.
15. As a Media operator, I want an append handoff for an existing Program, so that I can verify the current sequence and apply the change in ThunderOne.
16. As a Media operator, I want to see Schedule conflicts before publishing, so that I can see what would play.
17. As a reviewer, I want a link to the draft or change proposal, so that I can review the exact target and content in ThunderOne.
18. As a reviewer, I want to publish from ThunderOne, so that on-air changes go through the existing operator flow.
19. As a Media operator, I want to distinguish file delivery from Playback Proof, so that I can report what the Player actually confirmed.
20. As a tenant administrator, I want to change read, import, and draft permissions independently per operator, so that access can evolve without code changes.
21. As a tenant administrator, I want revocation to take effect on the next authorized operation, so that an existing client connection cannot keep using old access.
22. As a tenant administrator, I want the integration scoped to the selected tenant and Media Workspace, so that another workspace or organization stays outside the connection.
23. As a tenant administrator, I want an audit record for MCP writes and their outcomes, so that I can trace changes back to the actor.

## Implementation Decisions

- Ship in three slices: authenticated reads, Drive import, and Program preparation with playback follow-up. Expose only named Media business operations.
- Resolve user, tenant, application, and Media Workspace from verified connection context. Require current membership, an active tenant application, explicit Media Workspace entitlement, and the current per-user operation grant. Fail closed on missing data or lookup errors. No implicit default tenant, UI session fallback, or super-admin bypass for the pilot. Verify the selected pilot tenant has an explicit workspace entitlement even if its owner can already open Media in the browser.
- Reuse the existing workspace catalog, tenant switches, and tenant-scoped Media records. Persist revocable grants against existing identities. Keep authorization and audit records server-owned. Check ownership of each referenced object, including children through their parent. Keep privileged RPCs and credentials behind Core. Validate resource-bound OAuth tokens at the MCP boundary and use an authorized internal Core call path with the same actor and tenant.
- Check target and intent before writes. Expand Channel Groups and deduplicate Media Devices. Use the published snapshot or delivery targets for current scope and resolve proposed targets independently for change review. If the result is missing or ambiguous, return a structured clarification result for the client to ask in chat.
- Treat one Program per screen as common practice. For an append, verify both the Program's actual target set and reuse of its source Playlist, including Composition zones. Return a handoff with the Program link, affected devices, Asset and intended change. The operator applies it in ThunderOne. A stored append proposal is a separate design decision because the existing update-published operation immediately creates a Publish Job.
- Accept Drive file references only for the first import slice. Use the requesting operator's Google authorization, verify download access, and reuse Media format, size, Storage and Asset registration checks. Keep file bytes and credentials out of tool payloads. Return a resumable operation reference with readiness or failure details and reuse it on retry. Recheck grants before asynchronous work continues or commits an Asset.
- Use existing draft lifecycle, idempotency, revision and Schedule checks where available. Recheck the affected target and source revision before applying a prepared change. Record actor, tenant, workspace, operation and result. Keep activation in the existing ThunderOne Publish flow.
- Report current Schedule, delivery status, and Playback Proof as distinct observations. Existing Proof results can report historical playback. Confirm a new publication snapshot only when evidence matches that snapshot, Media Device, Asset and a played outcome.

## Implementation Sequence

1. **Validate the Core boundary in a test deployment.** Prove sign-in against an OAuth issuer with a token scoped to the MCP resource. Prefer hosting the MCP handler in Core and calling named internal Media operations under a strict gate. Verify explicit workspace enablement for the pilot tenant and test against a second tenant with fixtures. The issuer and deployment placement remain design decisions until the spike establishes compatibility.
2. **Ship an authenticated read slice.** Add Asset search, screen resolution, Program target inspection and playback status reads. Reuse Core Media queries. Resolve branch and screen to a unique device using verified tenant data. Return clarification when there are zero or multiple candidates or the action is unclear. Exit gate is successful reads from the intended clients and denial for the wrong tenant, disabled workspace, wrong audience or revoked grant.
3. **Add Drive import.** Use the operator's Google authorization in a server-owned transfer job. Record the Drive file ID and version and bind the operation to a Core-issued Media reservation. Derive the file ID from the job rather than accepting it from the client. Verify the completed object and run existing codec checks before registration. Exit gate is one Asset after retry or timeout, with denial for inaccessible files, unrelated reservations and revoked access before registration.
4. **Add Program preparation.** Resolve target, intent and Schedule before writes. Use existing create, content and Schedule operations for a new Program and persist enough progress to resume a partial draft. Return an append handoff for published Programs. Exit gate is a reviewable draft or handoff with verified target impact, no live change before operator Publish, and separate delivery and historical playback results afterward.

## Testing Decisions

- Proposed primary seam for review is the remote MCP HTTP endpoint against a test Core and database. Assert observable tool results and durable outcomes, using the existing Core API and Media contract checks as prior art. Use a controlled Drive fixture at the provider boundary for deterministic failure cases.
- Test authorized use, cross-tenant and cross-workspace denial, disabled workspace, wrong token audience, removed grants on an existing connection, and jobs whose grant is revoked before registration.
- Test ambiguous target, action and Schedule without writes. Test append handoff for both single-device and multi-device Programs, shared Playlists, Group expansion, stale revisions, and Schedule conflicts.
- Test inaccessible and invalid files, retries after partial transfer or registration, distinct playback readiness, duplicate draft prevention, and the distinction between delivery and Playback Proof.
- Smoke-test the same read and preparation flow from Claude, Codex, and Grok Bot. Verify actual playback evidence separately after an operator publishes to a test screen.

## Out of Scope

- Other workspaces and broad tenant rollout.
- Computer use, LINE bot ingestion, arbitrary URL ingestion, and local file transport in the first release.
- MCP Publish, cancel, republish, destructive library operations, and automated changes to shared playlists or multi-screen Programs.
- Role/group grant management beyond the first per-user grants.

## Further Notes

- Production catalog inspection confirmed the existing workspace tables, tenant-scoped Media records, restricted execution for sampled Media RPCs, and a tenant-scoped Media Storage insert policy. It did not verify end-to-end authorization for MCP.
- Confirm the OAuth issuer and each client's registration flow in the authentication slice. Verify the target and draft behavior against the test deployment before enabling production access.
- The Ao Nang screen request is a design example. The actual Drive file and deployed screen were not inspected.
