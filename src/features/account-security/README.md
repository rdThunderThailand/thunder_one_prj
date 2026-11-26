# account-security

`/account-security` — new 2026-09-16, part of the shell redesign alongside `profile`. Reached from `UserMenu`'s "บัญชีและความปลอดภัย" item and from the dedicated settings sidebar (`Sidebar.tsx`'s `SettingsSidebar`, shown on `/profile` and `/account-security`).

> **Password change is real; the rest is inert by necessity.** `PATCH /api/core/v1/me/password` exists in Core (called through `changePassword()` in `profile/services/profile-api.ts`; it verifies the current password server-side). MFA, device/session management and login-activity have **no backing in Core** (no route, no table, checked against `thunder_core_API` on 2026-09-16), so those sections are built to match the mockup's visual language (Figma node 341:3520) but their *values* stay honest placeholders — no fabricated device list, no fake "MFA enabled"/security-checklist green checks.

- `components/AccountSecurityPage.tsx`:
  - Profile-summary card — real (reuses `profile`'s `CoreMe`, same person, no duplicate fetch). Email row has a "ใช้งานอยู่" badge (true by definition — it's the address the session is authenticated with). Username row has a working copy-to-clipboard button (only rendered when `global_user_code` is set). The phone row is a static "ยังไม่มีข้อมูลในระบบ" here; the editable phone lives on `/profile`.
  - Password card — "last updated" is "-" until a change succeeds in this session ("เมื่อสักครู่"; Core's response carries no timestamp), and opens `ChangePasswordModal`.
  - MFA card, security-status card, login-activity card, connected-devices card — inert, with explicit "not available yet" notes or empty states rather than invented data.
  - "ความปลอดภัยเพิ่มเติม" links — inert list items, each `title="ยังไม่พร้อมใช้งาน"`.
- `components/ChangePasswordModal.tsx` — form with a real-time strength checklist → validating → success, a genuine end-to-end change via `changePassword()`; a wrong current password (401) is shown as an error. The mockup's last two steps ("log out other devices?") are not built: that needs a session-revoke endpoint Core doesn't have.
