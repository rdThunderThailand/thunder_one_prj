# SESSIONLOG — Layout UI browser verification — 2026-08-25

## Scope

Task 8 Step 3 was driven through the authenticated in-app Browser against the local
ThunderOne UI at `http://localhost:3000`. No credentials, cookies, or session stores were
read. No commit or push was performed.

The browser-created verification record was:

- Name: `Browser Verify Layout 2026-08-25`
- ID: `413d7b1f-b1f5-4c97-b5b0-8616d537570b`
- Final state: `Active`
- Final geometry: `Main` width `65%`, `Side` width `30%`

This is a real backend-backed record. It was intentionally left in `Active` state because
the workflow has no delete operation and no cleanup was authorized.

## Browser results

Passed:

1. `/communication/layouts` rendered the list and, after creation, showed the wireframe
   thumbnail, `16:9`, `2` Zones, and `Active` status.
2. Search and status filter changed the URL; refresh restored the same view. Sort controls
   changed the URL and direction markers:
   - `?q=Browser+Verify`
   - `?q=Browser+Verify&status=inactive`
   - `?q=Browser+Verify&sort=name&dir=asc`
   - `?q=Browser+Verify&sort=name&dir=desc`
3. The `70 / 30` template rendered two Zones.
4. Dragging the split changed `Main` to `61.2%`, leaving one decimal place.
5. Dragging a Zone over another displayed `Zone ซ้อนทับกัน กรุณาปรับขนาดหรือตำแหน่งใหม่` and
   disabled the step navigation button.
6. Creating the approved Layout succeeded.
7. Editing `Main` from `70%` to `65%` and saving succeeded; reopening the edit page showed
   `Main · 65.0×100.0%`, proving persistence through the UI.
8. Archive changed the row to `Inactive` (`Active 0 / Inactive 1`); Restore changed it back
   to `Active` (`Active 1 / Inactive 0`).
9. The duplicate-name submission did not create a second row; the list remained at one
   Layout.

Failed or incomplete:

- Browser back/forward did not preserve filter history. After filter changes, Back returned
  to the previous route (`/communication/layouts/create`) because the list uses
  `window.history.replaceState`; it did not step through the filtered list state.
- Sort order across multiple rows was not proven because only one Layout existed and no
  second production record was authorized.
- Duplicate-name UX failed the requirement. Submitting the same name stayed on the create
  page but displayed the generic `Media operation failed`, not the required Thai
  duplicate-name message.

## Completion status

Task 8 Step 3 is browser-tested but the Layout UI feature is not fully complete under
`CLAUDE.md §3`: the back/forward requirement and duplicate-name error requirement remain
failed, and multi-row sort ordering remains unverified. The existing implementation and
the two defects above were not changed in this verification session.
