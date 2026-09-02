# Staged resumable Media Upload

**Status:** accepted (2026-09-02)

Media Upload is a dedicated workflow at `/media-workspace/assets/upload`. The Figma mockup is a visual direction, not authority to expose unsupported formats, quota figures or controls.

**Design reference:** [`Figjam - Media Workspace (8).png`](../layouts/Figjam%20-%20Media%20Workspace%20(8).png). It governs visual hierarchy and relative placement only; the decisions below govern behavior, supported formats, limits and control availability.

## Decision

- Files enter a staged Upload Queue and do not start until the operator selects one Folder for the batch and presses `Start Upload`.
- One queue accepts at most 10 files. At most two files upload concurrently; the remainder stay `Waiting`.
- Each file is limited to 5 GB. Phase 1 therefore uses Supabase TUS resumable upload against the direct Storage hostname rather than the existing non-resumable signed PUT. Size and MIME rules are enforced by both Core and Storage, not only by the browser.
- Phase 1 accepts MP4, PNG, JPG/JPEG and WebP. Audio, PDF, MOV, AVI, MKV and other formats are not advertised.
- A failure affects only its file. Other files continue, and `Retry` resumes the TUS upload when its session remains valid or obtains new authorization and restarts that file when it does not.
- Aggregate queue actions follow queue state: `Clear Queue` removes staged files, `Cancel All` cancels active and waiting work, and `Clear All` dismisses terminal rows. These actions never delete registered Assets.
- A completed row may be dismissed. Asset deletion remains a Media Library operation.
- Leaving while work is active requires confirmation. The queue is not restored after refresh in Phase 1.
- One Folder applies to every file in the queue. Per-file Folder overrides are out.
- `Recent Uploads` shows the tenant's three newest Assets and links to Media Detail and the full Media Library.
- `Add from Source` and `Tags` remain visible but disabled as Phase 2 affordances. `Pause All`, the `Start Upload` dropdown and Storage Usage remain hidden until they have complete contracts. Upload Tips show only rules the system enforces.
- New object keys use `videos/{tenant_code}/{uuid}.{ext}` inside the `media` bucket. `tenant_code` is the existing immutable, unique, name-derived tenant identifier; `tenant.name` is not used directly.
- The TUS client authenticates to Storage with the signed-in operator's own Supabase access token, and the tenant prefix is enforced by an RLS policy on `storage.objects`. See the amendment below.
- The object-key prefix is not the only authorization boundary. Upload authorization and registration continue to derive and check `tenant_id` from the authenticated membership; the RLS policy is a second, server-side check that a tampered `objectName` cannot pass.
- Existing objects retain their current `videos/{uuid}.{ext}` keys. Moving production objects is not part of this decision.
- Upload reservation, completion and cancellation must clean up database and Storage state. A scheduled sweep removes abandoned reservations that a closed browser cannot cancel.
- Asset registration is idempotent and returns its actual contract `{ media_asset_id, status }`.

## Amendment — TUS authentication (2026-09-02, during MU-01)

The original decision assumed the TUS client would authenticate with the presigned upload token Core issues, the same way the signed PUT path did.

**Supabase Storage 1.71.0 ignores `x-signature` on `/upload/resumable`** — verified empirically against both the develop (`ftfmokgphewzyxzwjitv`) and production (`sfiefevtxalqjizdkcsw`) projects. The request falls back to the anon role and fails RLS, so a presigned-token TUS upload cannot work on this Storage version at all.

The shipped design instead:

- serves the operator's own Supabase access token from `src/app/api/auth/storage-token/route.ts`, reading the httpOnly `to_at` cookie the browser cannot; the TUS client sends it as `Authorization: Bearer` plus the publishable key as `apikey`.
- enforces the tenant prefix with an RLS policy on `storage.objects` that compares `split_part(name, '/', 2)` against the caller's `tenant_code`. Segment equality, not `LIKE` — `LIKE 'videos/' || tenant_code || '/%'` treats the `_` in `THUNDER_001` as a wildcard and lets `videos/THUNDERX001/…` through.

This moves prefix enforcement from "Core chooses the key and the client is trusted to use it" to "Storage itself refuses any key outside the caller's tenant", which is strictly stronger. Core still derives `tenant_code` server-side and never accepts a client-supplied prefix.

Revisit if Storage gains working presigned resumable uploads: the token path would let uploads work without exposing an access token to the page.

## Considered options

- Auto-start was rejected because it makes the selected Folder and `Start Upload` control race with active work.
- Ten simultaneous uploads were rejected because large files would compete for bandwidth and make progress estimates unstable.
- Presigned-token TUS upload was rejected because Storage 1.71.0 does not honour `x-signature` on the resumable endpoint (see the amendment above), not because the design was wrong.
- Standard signed PUT was rejected for the 5 GB promise because interruption restarts the entire file; Supabase recommends TUS for files larger than 6 MB.
- `tenant.name` as the Storage prefix was rejected because names are mutable, non-unique and require unsafe path normalization.
- Tenant UUID alone was rejected because `tenant_code` provides the requested human-readable grouping while remaining unique and immutable.
- Persisting the local queue across refresh was rejected because browsers cannot reliably restore local `File` objects without a durable upload-session UX.
- Migrating old Storage objects was rejected because it is an unrelated production rewrite with player and preview risk.

## Consequences

- The 5 GB requirement makes resumable upload and Storage configuration backend prerequisites, not frontend polish.
- Phase 1 adds no Tag assignment, external-source ingestion, Storage quota card, audio or document support.
- Core must expose resumable authorization/cancel/finalize behavior and enforce tenant, type and size constraints before the page can honestly advertise them.
- A future Phase 2 may activate Tags and Add from Source without changing the staged queue semantics.
