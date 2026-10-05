# Frontend v0.6.1 production release record — 2026-10-05

## Release and tag

- Owner merged release-prep PR #210 into dev (`4d57218`), then promotion #9 PR #211 into main on 2026-10-05 09:09:15 UTC / 16:09:15 Asia/Bangkok.
- Production main merge commit: `b238c115e54657fe84ed1fe0b98c37840e3dd9fa`; package.json version `0.6.1`.
- GitHub Production deployment `6855292138`, exact release SHA, state success at 09:10:23 UTC / 16:10:23 Asia/Bangkok. Vercel deployment: https://thunder-e6jrozqda-thunders-projects-3dff0238.vercel.app.
- Proposed exact annotated tag command and received owner instruction to continue. Created and pushed `v0.6.1` with message `release v0.6.1 (#9)`.
- Remote verification: tag object `c3b909eb5766c0c5ea9920e47ce1fb0d6924ceb7`; peeled target `b238c115e54657fe84ed1fe0b98c37840e3dd9fa`. No existing tag was moved or deleted.
- Appended release #9 to the canonical versioning table. Documentation-only change; no runtime code, API, schema or dependency changes.

## Verification

- Final candidate tree equalled merged dev; frozen install, TypeScript and production build all exit 0. Build compiled in 7.4s, TypeScript 9.7s, 107 pages. Full release diff check exit 0. Details also in PR #211.
- Production HTTP https://app.thunderone.asia/login returned 200 HTML.
- Production /api/proxy/__config returned 200 JSON, coreApiUrl https://api.thunder.co.th, hasKey true. No key value, cookie or auth header was printed or retained.
- Browser opened production Programs and redirected to app login. Waiting for owner login before authenticated read-only UI verification; login reachability is not authenticated browser/Core HTTP proof.

## Boundaries

- Production browser scope: inspect existing Program dialogs and previews; Cancel before confirmation, no Publish/Save, no fixture or business data mutation.
- Develop acceptance evidence for #195/#204 remains in the merged implementation SESSIONLOGs. Cancelled develop test publications/history remain as explicitly approved.
- No production fixture, migration, activation, Player credential, ACK or simulated delivery was created. Physical Player playback remains unverified until a real Player is online.
- No issue closed; owner reviews the release-record PR.
