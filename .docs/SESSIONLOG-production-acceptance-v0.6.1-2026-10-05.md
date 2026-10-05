# Production acceptance — v0.6.1 — 2026-10-05

## Scope and identity

Owner approved temporary Playwright production read-only verification and Thai PR text. No repository dependency or runner added. Production: https://app.thunderone.asia; MAIN database: sfiefevtxalqjizdkcsw. Frontend release #211, main b238c115e54657fe84ed1fe0b98c37840e3dd9fa, annotated v0.6.1, successful deployment 6855292138. Release record #212 already merged.

One headed Chrome login; desktop and touch browser authentication shared in memory only. Service workers blocked. Network guard refused business mutations, allowed reads, authentication, preview URL signing and read-only conflict checks. Touch context deliberately blocked its automatic conflict POST; its warning state is not conflict acceptance evidence. No credentials, storage state or request headers exported. Both temporary contexts closed and process exited 0.

## #195 — actual production browser and HTTP

Existing draft Training Publication 0f70d7b2-b79c-46c5-8ab0-b5c516769d90, tenant 1fa281a7-aff4-4d1d-b22e-e1ed86344157, Channel kiosk1. Opened its edit route, never confirmed Publish or Save.

- First-publish dialog displayed correct copy. Checking schedule conflicts appeared with Publish enabled.
- Actual conflict POST returned 200 and displayed Overlaps “kiosk_1_4” (normal); Publish remained enabled.
- Cancel closed the dialog; reopen displayed Checking again and issued a new Channels GET 200. Both conflict checks completed HTTP 200.
- No save, activation, update-published, schedule or target mutation request was issued.
- In the prior native-browser pass, Monthly/Continuous were present in Edit Schedule. Selected Monthly locally, cancelled, Continuous remained and Save stayed disabled; no Apply.
- Production failure/slow lookup and activation were not exercised. Their actual develop HTTP/DB evidence remains in SESSIONLOG-advisory-http-195-2026-10-05.md; production activation was outside the approved read-only scope.

## #204 — actual deployed preview

Existing Layout คนคลั่งรัก 2, composition 25154ed7-1e73-4186-93de-017371f5dd94, 1920x1080, three zones/two bound. Existing draft ลองเทสต์ 96d6b719-679a-405a-ba02-e68b5beefa71 resumed at Step 4 Review. Navigated backwards using the stepper only; Next calls persistDraft and was not used.

- Preview Layout modal at actual 1440x1000, 1024x768 and 390x844. Settled controls widths 1409.20/1001.52/380.20px; all four buttons 32x32px and contained. 390px controls used two rows. Transitional geometry immediately after resize was not used as acceptance.
- Desktop Program Summary rail at 1440: controls width 262px, overlay with two rows, all actions visible. Play advanced the clock. Fullscreen belonged to this stage, expanded controls to 1408px/one row, and its portal menu was inside document.fullscreenElement. Keyboard selected 3×; reopening showed aria-checked=true. Modal keyboard selected 2×.
- Review main preview with sidebar expanded at 390: width 76px, panel fallback, timeline on its own row and secondary buttons wrapped; four 32px buttons remained contained. This is the approved sub-152px exception. Review rail does not contain a preview.
- Desktop modal playback continued across resizing rather than resetting to zero. Production seek and mute were verified using touch. More extensive resize/model/fit/multiple-stage geometry coverage remains in the previous local acceptance records.
- Separate touch context: actual 390x844, hover:none and pointer:coarse. Play, mute and seek to 9/18s worked. Runnable assertions passed: controls opacity 1 while playing, all four buttons exactly 32x32 and contained, including the 76px Review preview.
- Touch entered/exited real fullscreen. Menu was inside the fullscreen element. Native touchscreen tap at the measured visible 2× menu-item position selected speed; reopening showed 2× checked. Screenshot captured fullscreen, two control rows and the menu.
- Some Playwright role locators timed out during menu/navigation interactions; these timeouts were not counted as passes. DOM/ARIA snapshots showed visible accessible menu items. Native coordinates confirmed touch selection; desktop keyboard confirmed selection. No product fix inferred from a locator timeout.
- Production covers modal, Review main and Program Summary rail. All seven callers were already covered locally in the #208 acceptance; this is not a claim that all seven were rerun in production.

## Read-only database postconditions

Before and after production browser checks:

| Record | Revision | updated_at UTC |
|---|---:|---|
| Training Publication 0f70d7b2-b79c-46c5-8ab0-b5c516769d90 | 3 | 2026-09-28 04:27:58.04504 |
| Draft 96d6b719-679a-405a-ba02-e68b5beefa71 | 8 | 2026-09-23 11:13:05.520425 |
| Layout 25154ed7-1e73-4186-93de-017371f5dd94 | 2 | 2026-09-23 11:08:16.571199 |

Publication postflight occurred before the final read-only touch preview navigation; Layout postflight occurred after both contexts closed. Network guard and observed requests establish that final navigation issued no business write.

## #201 — closure evidence reconciliation

Frontend issue #201 tracks the Core RPC fix; there is no Core issue #201. Core PR #156 merged and production deployed on 2026-10-02 at exact main 2195f45e4cce12ae862adbe94df5aff7745ff36f.

- Recorded develop RED/GREEN: twenty actual-RPC scenarios plus wrong tenant; actual Core HTTP changed A/B from both airing to A suppressed_by=[B], B airing. Regression transaction rolled back.
- Recorded production: six authenticated diagnostic HTTP 200 results equal MAIN RPC at fixed timestamps; missing credentials 401 and unserved tenant 403. Player HTTP returned signed slots equal direct poll. These existing production samples do not contain a same-tier collision.
- Current MAIN check: one airtime-explain overload, postgres owner, source MD5 b2534c40b39b05da57a378face0c981e equals the committed 20261002084043 migration function body exactly. No migration applied again.
- Player poll source now differs from the October 2 recorded hash; no claim that it remains unchanged today. This session did not change either RPC.
- Prior evidence: Thunder_Core/docs/media/release-v0.6.0-airtime-201.md and its two October 2 session logs; /private/tmp/VERIFY-core-201-production-postmerge-2026-10-02.md. Production diagnostic HTTP was not rerun today.

The issue concerns diagnostic arbitration, not physical playback. Physical Player playback remains a separate acceptance gap; currently the production UI shows all six tenant Channels offline.

## Artifacts and remaining work

Local screenshots, inspected visually: /private/tmp/production-204-summary-fullscreen-menu.png; /private/tmp/production-204-touch-fullscreen-390.png. Additional screenshots: production-195-overlap-advisory.png, production-204-modal-390.png, production-204-summary-1440.png, production-204-touch-summary-390.png. The last filename captures the Review main preview, not the Summary rail. Files are temporary, not checked into Git.

Remaining: real Player heartbeat/ACK/playback when online; legacy browser acceptance for affected-count zero, count failure, revision conflict/write failure, actual Layout/Playlist pattern order after Apply, and remaining Edit/Figma edge cases. Shared develop pattern writes require a new exact fixture scope; the previous two-publication/three-job authorization is not reused. #97 remains parked. No cleanup performed.

Documentation-only change: git diff --check; no new build claim and no repeated production deployment/tag.
