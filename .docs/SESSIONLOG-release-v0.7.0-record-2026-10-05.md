# Release v0.7.0 record — 2026-10-05

## Confirmed release

- Owner merged release PR #218 (`dev → main`). GitHub reports `MERGED`, merge commit `61c8dc7c5284ba9ff1b749d85e3c717f600eab30`, at `2026-10-05T16:47:25Z`.
- `origin/main` is this merge commit and `package.json` is `0.7.0`.
- Vercel commit status is success. GitHub deployment `6864776505` is Production/success, created `2026-10-05T16:48:20Z`.
- Deployment: `https://thunder-r2nj7wdi1-thunders-projects-3dff0238.vercel.app`; Vercel details: `https://vercel.com/thunders-projects-3dff0238/thunder-one/6TFZTJyFYXJUB6SaKUFowMviwUEB`.
- Release #10 includes #212–#217, 14 commits since `v0.6.1` before the production merge. Version classification and release checks are recorded in #217/#218.

## Public HTTP smoke

- `https://app.thunderone.asia/login` — 200, HTML.
- `https://app.thunderone.asia/media-workspace/program` without authentication — 307 to `/login`.
- `https://app.thunderone.asia/api/proxy/__config` — 200, JSON; response body/credentials not logged.
- HTTP smoke proves reachability and authentication routing, not playback.

## Authorized authenticated production browser smoke

Owner chose browser-tool verification for this point, read-only with no business persistence.

- Chrome artDev; hard navigation to existing Program `02028235-ecdb-46cb-9168-22ade2a5e314` (`boe_55`) at `https://app.thunderone.asia/media-workspace/program/02028235-ecdb-46cb-9168-22ade2a5e314/edit`.
- Topbar showed `Playlist: pboss · 1 Channel`.
- Edit Schedule → Date range displayed two consecutive months. After moving to October/November, first selecting November 3 kept both months visible; Enter on October 12 completed the inclusive range October 12–November 3 with 23 selected days.
- At viewport 390×844, the months stacked with equal x=57px; dialog clientWidth/scrollWidth both 388px. Restored the viewport override.
- Cancel closed the dialog; Publish changes remained disabled, so the main form was unchanged.
- Captures: `docs/program/acceptance/production-v0.7.0/desktop.jpg` and `mobile.jpg`, copied from the corresponding browser captures in `/private/tmp`.
- No Apply Schedule, Save, publish confirmation, activation, fixture/cleanup, or shared Layout/Playlist edit performed. No network-blocking harness or DB fingerprint comparison collected; absence of writes is based on the exercised form-only paths, not a separate DB audit.

## Tag approval boundary

- Remote lookup for `refs/tags/v0.7.0*` returned no existing tag at preflight.
- Owner approved the exact commands below; both executed successfully:

```sh
git tag -a v0.7.0 61c8dc7c5284ba9ff1b749d85e3c717f600eab30 -m 'release v0.7.0 (#10)'
git push origin refs/tags/v0.7.0
```

- Remote annotated tag object: `b4e9c95836c19ba2041cf5f29df3269ab42009ee`; peeled commit: `61c8dc7c5284ba9ff1b749d85e3c717f600eab30`, matching the #218 production merge.
- `docs/agents/versioning.md` now records completed release #10.
- This branch contains release-only records; no application/version/dependency changes or deployment actions.

## Limits

- Production smoke covers the new Edit subtitle, range selection, keyboard Enter, responsive layout and Cancel; full screen-reader/touch, Create wizard/Custom days browser regressions and removed-target dialog copy were not re-tested in this round.
- Public/deployment/browser evidence does not prove delivery, Publishing on an online Player, or physical Player playback. Those remain separate verification work.
