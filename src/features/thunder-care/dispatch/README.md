# thunder-care/dispatch

Thunder Care Provider Side's Dispatcher persona — 2026-09-08, against the "Dispatcher : ผังการทำงาน" flow diagram + 11 screen mockups the user provided (following the same request/build pattern as `thunder-care/service-ops`'s Service Operator persona).

> R&D — mock data only, no backend yet. See `mock-data.ts` for the exact shape each page's mock data is standing in for.

- `components/DispatcherHomePage.tsx` — "หน้าหลัก Dispatcher": 6 stats, งานรอจัดสรร table, สถานะงาน donut, งานเสี่ยง SLA / แผนที่งาน (preview) / ช่าง-ทีมพร้อมใช้งาน row, งานที่กำลังดำเนินการ table, แจ้งเตือนและประกาศ, ทางลัด quick actions.
- `components/UnassignedQueuePage.tsx` — "งานรอจัดสรร": full incident queue (`INC-2025-XXXX`), status pills (รอ Triage / รอข้อมูล / รอรวมเรื่อง), filter sidebar.
- `components/InProgressPage.tsx` — "งานที่กำลังดำเนินการ": tab-filterable Work Order table with progress bars, row click opens a detail panel with an update log (mocked for `WO-30516` only, the one the mockup shows selected — other rows fall back to a generic "no updates yet" message).
- `components/CompletedWorkPage.tsx` — "งานที่เสร็จสิ้น": closed-ticket history with SLA pass/fail and star ratings.
- `components/TechniciansPage.tsx` — "ช่าง / ทีมของฉัน": ช่าง/ทีม tabs, technician table + detail panel (skills, certifications, service area).
- `components/SchedulerPage.tsx` — "ตารางงาน": a day-view timeline grid (technician rows × hour columns) built from `SCHEDULER_HOURS`/`ScheduleBlock.startHour-endHour` — plain CSS positioning, not a calendar library.
- `components/MapViewPage.tsx` — "แผนที่งาน": job pins over a placeholder map surface (`MapJobPin.xPercent/yPercent` are illustrative coordinates, **not** real geo — Mapbox integration is listed as a tool in the flow diagram but wasn't wired up this pass).
- `components/CustomersPage.tsx` — "ลูกค้า": full CRM-style customer table + detail panel (tax ID, contacts, outstanding balance). **Replaces** `thunder-care/service-ops`'s old English `CustomersPage.tsx` placeholder outright (deleted, along with its route and `CustomerRow`/`mockCustomers` in that feature's `mock-data.ts`) — the user's explicit call when the new mockup turned out to be a completely different data model.
- `components/InventoryPage.tsx` — "คลังอะไหล่ / อุปกรณ์": spare-parts stock table + detail panel (usage history mocked for `SP-AC-001` only). Distinct from Asset Intelligence's Asset — this is consumable/spare-part stock, not installed equipment.

**Not built — reused or explicitly out of scope, not overlooked:**
- **Asset** — the mockups' own "Asset" nav item breadcrumbs as "ASSET WORKSPACE" (Asset Manager role, not Dispatcher), i.e. it's `/asset-intelligence/assets`, which already exists. `config/nav/thunder-care.tsx`'s `dispatcherNav` links straight there.
- **คลังความรู้** — reuses `thunder-care/service-ops`'s `KnowledgeBasePage` as-is. A knowledge-base mockup was also sent for this persona, but its role badge read "Customer Service Coordinator" (not Dispatcher) with a materially different category/stat structure — treated as a different draft, not this persona's real KB, per the user's call.
- **Dispatcher's own Triage/Work Order creation flow, Vendor assignment** — described in the flow diagram (step ②③④) but no dedicated screen mockup provided yet; `+ สร้าง Work Order` buttons are present but disabled ("ยังไม่เปิดใช้งาน") throughout.
