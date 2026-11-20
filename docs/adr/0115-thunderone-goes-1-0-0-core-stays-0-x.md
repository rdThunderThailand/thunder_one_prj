# 0115 — ThunderOne goes 1.0.0; Thunder_Core stays 0.x

Status: accepted (2026-11-18, owner decisions in a grilling session on v1.0 readiness, 2026-11-17/18).
Amends `docs/agents/versioning.md` ("stay on `0.x` … Do not bump to `1.0.0` without an ADR").

## Context

- `docs/agents/versioning.md` keeps this app on `0.x` "until the frontend has a stable contract against
  Thunder_Core" and requires an ADR for `1.0.0`.
- v1.0 is the full production release of the Media Workspace to every tenant. Its P0 list
  (`docs/media-workspace/plan-v1-p0.md`) shipped in `v0.22.0`; the Core changes it needs shipped in Core
  `v0.26.0` (stop logging the admin client, Layout copy keeps `canvas_mode`). What is left before the number
  changes is a UAT pass on prod (`docs/media-workspace/plan-v1-release.md`).
- The app has no staging: `main` deploys to production on merge, and `dev` runs against Core `develop`, whose
  data differs from prod. UAT therefore runs on prod in the `thunder_qa` tenant.
- Thunder_Core serves this app and the Asset Workspace. Its Asset Workspace v2 API (Core ADR 0024) is still
  changing, and Core's own `versioning.md` also requires an ADR (in Core) to reach `1.0.0`.

## Decision

1. **This app becomes `1.0.0`** in the release that follows a passing UAT on prod. The number marks the first
   release for every tenant, not a feature set. UAT runs on the build that will become v1.0: that build goes to
   prod first as an ordinary release under the existing rules (`0.23.0`, because its diff adds a feature), QA
   tests it there, bugs are fixed and released, and `1.0.0` is cut afterwards. The tag `v1.0.0` is never
   created before UAT passes.
2. **The contract that is now treated as stable** is the one operators use: the Media Workspace routes in
   `src/config/nav/media-workspace.tsx` and their workflows (upload, Playlist, Layout, Program wizard and edit,
   Now & Next, Calendar, Playback Proof, Channels). This app keeps calling the deployed Core; it pins no Core
   version.
3. **Version rules from `1.0.0` on:**
   - MAJOR: removes or renames a nav route, removes a workflow step operators rely on, or needs a Core change
     that the previous release of this app cannot run against.
   - MINOR: a promotion that adds backward-compatible functionality.
   - PATCH: only backward-compatible bug fixes (plus release-only docs), whether promoted from `dev` or
     hot-fixed on `main`.
   The release sequence, the promotion count and the tag rules in `versioning.md` do not change.
4. **Thunder_Core stays on `0.x`.** v1.0 runs against Core `v0.26.0` or later. Core reaching `1.0.0` is Core's
   decision, recorded in Core's ADRs.

## Not chosen

- **Bump both repos to `1.0.0`.** Core would need its own ADR, and the Asset Workspace API it serves is not
  stable; a Core MAJOR would then be forced by work that has nothing to do with this app.
- **Release `0.23.0` and call it "v1.0" only in announcements.** The tag on `main` would disagree with what
  the team and customers call the release, and `versioning.md` would keep saying the contract is unstable.
  (`0.23.0` still ships, but as the UAT candidate; it is not announced as v1.0.)
- **Tag `1.0.0` first and let QA test afterwards.** Testing first costs one extra release, and the first UAT
  bug would otherwise make the first stable release a `1.0.1`.

## Consequences

- `docs/agents/versioning.md` drops the "stay on `0.x`" paragraph and points here for the MAJOR rule;
  `CLAUDE.md`'s one-line summary changes the same way.
- Removing or renaming a Media Workspace route now needs a MAJOR bump, so retiring a page is planned
  instead of slipped into a minor release.
- Known gaps at `1.0.0` are listed in `docs/media-workspace/uat-v1-checklist.md` section D (no-verdict videos,
  missing posters, Calendar "Now", Layout cover on Edit, Channel delete, empty-Playlist Zone, checksum-only
  Player updates, Android devices without playback logs). They are P1 work after `1.0.0`, not blockers.

## Amendment — several Workspaces, one number (2026-11-20)

Owner decisions in a grilling session after `v1.0.0`. The app now ships seven Workspaces (the `APPS` registry in
`src/config/apps.tsx`), all in one Next.js app, one `package.json`, one Vercel deploy.

1. **One SemVer for the whole app.** No per-Workspace version: a Workspace cannot be deployed or rolled back on
   its own, so its own number would describe nothing. Release notes group changes by Workspace instead.
2. **Stable Workspace.** A Workspace whose routes and workflows are a promise to operators. The list lives in
   `docs/agents/versioning.md`; at this amendment it is **Media Workspace** only. It is separate from the
   launcher's `dataStatus` (`live` means "reads Thunder_Core", not "ready for customers": Asset Intelligence,
   People and Lead Approval are `live` and not stable).
3. **MAJOR applies to Stable Workspaces.** Decision 3's MAJOR rule now reads: removes or renames a nav route of a
   Stable Workspace, removes a workflow step its operators rely on, or needs a Core change the previous release
   cannot run against. A Workspace that is not stable may change in a MINOR.
4. **Becoming stable** follows Decision 1's pattern: the Workspace passes a UAT on prod in `thunder_qa`, the owner
   accepts it, the release-prep PR adds it to the list, and it ships as a MINOR whose release note announces
   it. Which tenants see a Workspace stays a Core setting (`enabled_workspaces`).
5. **The release log moves to GitHub Releases.** The promotion table in `versioning.md` stops at `v1.0.0`; each
   tag from then on gets a GitHub Release with the Thai release note. No `docs/record-*` PR. The full sequence
   is in `versioning.md`; merge methods are ADR 0118.
