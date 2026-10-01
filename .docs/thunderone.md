# Untitled

ถ้าจะทำให้ **Solid ที่สุด** ผมไม่แนะนำให้เริ่มจากการทำทุกหน้าตาม Mockup พร้อมกัน เพราะระบบนี้มี Dependency ต่อกันมาก โดยเฉพาะ:

```julia
Asset
→ Playlist / Layout
→ Publication
→ Channel
→ Device
→ Schedule
→ Publish Job
→ Playback / Monitoring
```

ลำดับที่เหมาะที่สุดควรเริ่มจาก **แกนข้อมูลและการ Publish ให้ทำงานจริงก่อน** แล้วจึงเพิ่ม Monitoring, Ticket, SLA และ Analytics ภายหลัง
# Roadmap ที่แนะนำ

```sql
Phase 0 — Product Foundation
Phase 1 — Core Publishing MVP
Phase 1.5 — Pilot & Stabilization
Phase 2 — Monitoring & Support
Phase 3 — Advanced Layout & Workflow
Phase 4 — Reports, SLA & External Integration
Phase 5 — Intelligence & Automation
```

* * *
# Phase 0 — Product Foundation
## เป้าหมาย
สร้างฐานระบบให้ถูกต้องก่อนเริ่มทำ UI และ Feature จำนวนมาก
ระยะโดยประมาณ:

```plain
2–4 สัปดาห์
```

## สิ่งที่ต้องทำ
### 1\. กำหนด Core Entity
ต้องตกลง Entity หลักให้ชัด:
*   Organization
*   User
*   Role
*   Permission
*   Asset
*   Playlist
*   Publication
*   Schedule
*   Location
*   Channel
*   Device
*   Publish Job
*   Playback Log
*   Audit Log
### 2\. กำหนดความหมายของคำในระบบ
ต้องล็อก Definition ให้ตรงกันทั้งทีม:

| Entity | ความหมาย |
| ---| --- |
| Asset | ไฟล์สื่อกลาง |
| Playlist | ลำดับของ Asset |
| Layout | การแบ่งพื้นที่หน้าจอ |
| Publication | งานเผยแพร่ |
| Schedule | วันและเวลาทำงาน |
| Channel | ปลายทางที่ผู้ใช้เลือก Publish |
| Device | อุปกรณ์จริงที่รับสื่อ |
| Publish Job | งานส่งสื่อไปยัง Device |

### 3\. ออกแบบ Data Relationship

```julia
Organization
├── Users
├── Locations
├── Channels
└── Devices

Asset
→ Playlist
→ Publication
→ Channel
→ Device
```

### 4\. กำหนด Device Communication
ต้องตัดสินใจให้ชัด:
*   Device Pairing ใช้วิธีใด
*   Device ส่ง Heartbeat ทุกกี่วินาที
*   Server Push หรือ Device Pull Content
*   Download Content ผ่าน URL หรือ API
*   ตรวจ Download Complete อย่างไร
*   Player ส่ง Playback Log อย่างไร
*   Offline แล้ว Queue งานไว้หรือไม่
*   Retry อย่างไร
### 5\. กำหนด Security
*   Organization isolation
*   User authentication
*   Role-based access control
*   Device token
*   Signed media URL
*   Audit log
*   API authorization
## Exit Criteria
Phase 0 ถือว่าเสร็จเมื่อ:
*   ER Diagram ผ่านการ Review
*   API Contract หลักถูกกำหนด
*   Device Communication Flow ชัดเจน
*   Permission Matrix ผ่านการอนุมัติ
*   Publication State Machine ถูกกำหนด
*   ทีมเข้าใจคำศัพท์ตรงกัน
* * *
# Phase 1 — Core Publishing MVP
นี่คือ MVP ตัวจริงที่ควรนำไปใช้งาน Pilot
## เป้าหมาย
ให้ Operator สามารถทำ Flow นี้ได้ครบ:

```sql
Register Device
→ Create Channel
→ Upload Asset
→ Create Playlist
→ Create Publication
→ Select Channel
→ Set Schedule
→ Publish
→ Device Download
→ Device Play
→ ดูผลว่าสำเร็จหรือไม่
```

ระยะโดยประมาณ:

```plain
10–16 สัปดาห์
```

* * *
## Module 1: User & Organization
ต้องมี:
*   Login
*   Organization
*   User
*   Role
*   Permission
*   Basic Profile
Role สำหรับ MVP:

```dpr
Administrator
Media Operator
Viewer
```

Approver สามารถรอ Phase 3 ได้ หากต้องลด Scope
* * *
## Module 2: Location
ต้องมี:
*   Create Location
*   Edit Location
*   Location Name
*   Address
*   Time Zone
*   Tags
*   Active / Inactive
ตัวอย่าง:

```plain
Central World
└── Floor G
```

* * *
## Module 3: Device Registration
ต้องมี:
*   Register Device
*   Pairing Code
*   Device Name
*   Device ID
*   Device Type
*   Location
*   Resolution
*   Orientation
*   Online / Offline
*   Last Seen
*   Player Version
Flow:

```css
ติดตั้ง Player
→ Player แสดง Pairing Code
→ Admin กรอก Pairing Code
→ Device Registered
→ Assign Location
→ Ready to Assign Channel
```

* * *
## Module 4: Channel
ต้องมี:
*   Create Channel
*   Edit Channel
*   Channel Name
*   Channel Type
*   Location
*   Assign Existing Device
*   Resolution
*   Orientation
*   Active / Inactive
*   Online / Offline Summary
สำหรับ MVP แนะนำจำกัด Architecture เป็น:

```julia
1 Channel
→ 1 Device
```

แต่ Database ต้องเผื่อ:

```julia
1 Channel
→ Multiple Devices
```

เพื่อไม่ให้แก้ Architecture ภายหลัง
* * *
## Module 5: Content & Assets
ต้องมีหน้า Asset Repository กลางตั้งแต่ MVP

```css
Publishing
└── Content & Assets
```

Functions:
*   Upload File
*   Drag & Drop
*   Preview
*   Metadata Extraction
*   Thumbnail Generation
*   Search
*   Filter by Type
*   Resolution
*   Duration
*   File Size
*   Upload Status
*   Delete
*   Archive
ประเภทไฟล์ MVP:
*   JPG
*   PNG
*   MP4 H.264
ยังไม่ควรเริ่มด้วย:
*   Web Page
*   Live Stream
*   HTML Package
*   PowerPoint
*   Dynamic Data Source
* * *
## Module 6: Playlist
MVP ควรมี 4 Steps:

```markdown
1. Basic Info
2. Add Content
3. Settings
4. Review
```

Functions:
*   Playlist Name
*   Resolution
*   Add Existing Asset
*   Upload New Asset
*   Drag & Drop Reorder
*   Set Image Duration
*   Total Duration
*   Sequential Playback
*   Loop
*   Save Draft
*   Preview
Transition สำหรับ MVP ควรเริ่มเพียง:

```css
None
Fade
```

ไม่ควรเริ่มทั้งหมดพร้อมกัน เพราะ Transition ต้องรองรับทั้ง Player Engine และ Preview Engine
Phase ถัดไปค่อยเพิ่ม:
*   Slide
*   Wipe
*   Zoom
* * *
## Module 7: Publication
MVP ใช้ 5 Steps:

```markdown
1. Basic Info
2. Content
3. Channels
4. Schedule
5. Review & Publish
```

ใน MVP Step 2 ยังใช้:

```css
Single Content
Playlist
```

Grid Layout และ Custom Layout ควรเลื่อนไป Phase 3
ข้อมูล Publication:
*   Name
*   Content / Playlist
*   Selected Channel
*   Start Date
*   Start Time
*   End Date
*   End Time
*   Time Zone
*   Status
*   Owner
* * *
## Module 8: Schedule
MVP ควรมี:
*   Publish Now
*   Schedule Later
*   Start Date / Time
*   End Date / Time
*   Time Zone
*   Basic Recurring Daily
*   Cancel Schedule
ยังไม่ต้องมี:
*   Complex Recurrence
*   Blackout Period
*   Operating Hours
*   Delay Between Channels
*   Priority Override
* * *
## Module 9: Publish Job
นี่คือ Module สำคัญที่สุด แต่หลายระบบมักมองข้าม
ทุกครั้งที่กด Publish ต้องสร้าง Publish Job
สถานะ:

```plain
Queued
Processing
Downloading
Delivered
Playing
Failed
Cancelled
```

ข้อมูล:
*   Job ID
*   Publication
*   Channel
*   Device
*   Started At
*   Progress
*   Download Status
*   Error Message
*   Retry Count
*   Completed At
Actions:
*   Retry
*   Cancel
*   View Logs
* * *
## Module 10: Basic Monitoring
MVP ไม่ต้องทำ Monitoring 7 หน้าเต็ม แต่ต้องมี Operational View ขั้นพื้นฐาน
ควรมี 3 หน้า:

```plain
Monitoring
├── Live Status
├── Publish Jobs
└── Devices
```

### Live Status
แสดง:
*   Channel
*   Device
*   Online / Offline
*   Current Content
*   Current Publication
*   Last Seen
*   Next Schedule
### Publish Jobs
แสดง:
*   Queued
*   Processing
*   Delivered
*   Playing
*   Failed
### Devices
แสดง:
*   Online / Offline
*   IP
*   Player Version
*   Storage
*   Last Seen
*   Restart Player
*   Sync Content
* * *
## Module 11: Basic Audit Log
ต้องเก็บ:
*   User Login
*   Upload Asset
*   Create Playlist
*   Edit Playlist
*   Create Publication
*   Schedule Change
*   Publish
*   Cancel
*   Device Registration
*   Channel Assignment
* * *
# MVP ที่ Solid จริงต้องมีอะไร

```sql
User / Role
Location
Device Registration
Channel
Asset Repository
Playlist
Publication
Basic Schedule
Publish Job
Basic Monitoring
Audit Log
```

สิ่งที่ยังไม่จำเป็นใน MVP แรก:

```sql
Campaign Workflow
Approval
Grid Layout
Custom Layout
Screenshot Matching
Ticket
Incident
SLA
Advanced Reports
External Channels
AI
```

* * *
# Phase 1.5 — Pilot & Stabilization
## เป้าหมาย
นำระบบไปทดลองใช้กับ Site จริงจำนวนจำกัดก่อนขยาย Feature
ระยะโดยประมาณ:

```plain
4–8 สัปดาห์
```

## Pilot Scope
แนะนำ:

```plain
1 Organization
2–3 Locations
5–20 Devices
1–3 Operators
```

ควรเลือก Site ที่มี Use Case จริง เช่น:
*   The PARQ
*   Office Test Environment
*   Site ลูกค้าที่เข้าถึงเครื่องง่าย
## สิ่งที่ต้องทดสอบ
### Publishing Reliability
*   Publish สำเร็จหรือไม่
*   Download Resume ได้หรือไม่
*   Offline Device กลับมาแล้ว Download ต่อหรือไม่
*   Schedule เริ่มตรงเวลาหรือไม่
*   Player Restart แล้วเล่นต่อหรือไม่
### Device Reliability
*   Heartbeat
*   Storage Full
*   Internet Loss
*   App Crash
*   Device Reboot
*   Version Mismatch
### Operational UX
*   Operator เข้าใจ Channel หรือไม่
*   สร้าง Playlist ได้ง่ายหรือไม่
*   Publish ผิด Device หรือไม่
*   Status เข้าใจง่ายหรือไม่
*   Error Message แก้ปัญหาได้จริงหรือไม่
## Exit Criteria
*   Publish Success Rate ตามเป้าหมาย
*   Device Recover หลัง Offline ได้
*   ไม่มี Data Loss
*   Audit Log ครบ
*   Operator ใช้งาน Flow หลักได้โดยไม่ต้องให้ Developer ช่วย
*   Error สำคัญมีข้อความที่เข้าใจได้
*   Pilot ใช้งานต่อเนื่องอย่างน้อย 2–4 สัปดาห์
* * *
# Phase 2 — Monitoring & Support
## เป้าหมาย
เปลี่ยนระบบจาก “Publish ได้” เป็น “Operate และ Support ได้จริง”
ระยะโดยประมาณ:

```plain
8–12 สัปดาห์
```

## เพิ่ม Monitoring ให้ครบ

```plain
Monitoring
├── Live Status
├── Publish Jobs
├── Screen & Playback
├── Devices
├── Screenshots
├── Alerts & Incidents
└── Uptime & SLA Basic
```

* * *
## Screen & Playback
เพิ่ม:
*   Expected Content
*   Actual Content
*   Screen Power
*   Signal Status
*   Player Process Status
*   Content Playing / Not Playing
*   Last Successful Playback
* * *
## Screenshots
เพิ่ม:
*   Capture Now
*   Scheduled Screenshot
*   Screenshot History
*   Channel
*   Device
*   Capture Time
*   Current Publication
ใน Phase นี้ยังไม่จำเป็นต้องทำ AI Image Matching
* * *
## Alerts
Alert Type:
*   Device Offline
*   Player Offline
*   Publish Failed
*   Storage Low
*   Content Missing
*   Screen No Signal
*   Schedule Not Running
*   License Expiry
Severity:

```scss
Critical
High
Medium
Low
```

Status:

```php
New
Acknowledged
Resolved
Ignored
```

* * *
## Incidents
เพิ่มเมื่อ Alert ต้องมีคนรับผิดชอบ

```sql
Alert
→ Create Incident
→ Assign Owner
→ Acknowledge
→ In Progress
→ Resolve
→ Close
```

* * *
## Customer Tickets
สำหรับ Phase 2 ให้ Customer Ticket อยู่ใน:

```plain
Alerts & Incidents
├── Alerts
├── Incidents
└── Customer Tickets
```

Functions:
*   Create Ticket
*   Select Location
*   Select Channel
*   Select Device
*   Issue Category
*   Description
*   Attachment
*   Priority
*   Assign Owner
*   Timeline
*   Resolve
*   Close
* * *
## Basic Uptime
คำนวณ:
*   Online Duration
*   Offline Duration
*   Uptime %
*   Incident Count
*   Basic MTTR
ยังไม่ต้องมี SLA Engine แบบซับซ้อน
* * *
# Phase 3 — Advanced Publishing Workflow
## เป้าหมาย
เพิ่มความสามารถที่ทำให้ ThunderOne แตกต่างจาก Aurora ชัดเจน
ระยะโดยประมาณ:

```plain
10–16 สัปดาห์
```

## 3.1 Campaign
เพิ่ม:

```css
Campaign
├── Overview
├── Publications
├── Timeline
├── Content & Assets
├── Approvals
└── Settings
```

* * *
## 3.2 Approval Workflow
เพิ่ม Approval สำหรับ:
*   Asset
*   Playlist
*   Layout
*   Publication
*   Schedule
Flow:

```plain
Draft
→ Submit
→ In Review
→ Approved
→ Publish Allowed
```

* * *
## 3.3 Grid Layout
เพิ่ม Template:
*   Two Columns
*   Two Rows
*   Four Grid
*   Main + Sidebar
*   Video + Ticker
ใน Phase นี้ Grid Layout ควรทำก่อน Custom Layout เพราะพัฒนาและทดสอบง่ายกว่า
* * *
## 3.4 Custom Layout Builder
เพิ่ม:
*   Add Zone
*   Resize Zone
*   Drag Zone
*   Split
*   Align
*   Snap to Grid
*   Layer Order
*   Lock Zone
*   Save Template
*   Preview
* * *
## 3.5 Layout Compatibility
ตรวจ:
*   Resolution
*   Orientation
*   Aspect Ratio
*   Channel Capability
สถานะ:

```plain
Compatible
Needs Adaptation
Incompatible
```

Actions:
*   Select Another Layout
*   Remove Channel
*   Continue with Letterbox
*   Create Adaptation
Automatic Adaptation ยังไม่ต้องมีใน Phase นี้
* * *
## 3.6 Advanced Playlist
เพิ่ม:
*   Slide
*   Wipe
*   Zoom
*   Per-item Transition
*   Per-item Volume
*   Shuffle
*   Fallback Content
*   Playlist Versioning
* * *
## 3.7 Advanced Schedule
เพิ่ม:
*   Weekly Recurring
*   Custom Recurrence
*   Operating Hours
*   Blackout Period
*   Conflict Detection
*   Emergency Override
*   Priority
*   Publish Sequence
* * *
# Phase 4 — Reports, SLA & Integrations
## เป้าหมาย
รองรับลูกค้าองค์กร, MA Contract และการส่งรายงานอย่างเป็นทางการ
ระยะโดยประมาณ:

```plain
8–14 สัปดาห์
```

## Reports & Analytics

```julia
Reports & Analytics
├── Overview
├── Playback & Proof of Play
├── Publishing Performance
├── Device & Channel Performance
└── Incident Analytics & SLA
```

* * *
## Playback & Proof of Play
เพิ่ม:
*   Playback Event
*   Completed / Interrupted / Missed
*   Verification
*   Screenshot
*   Campaign
*   Publication
*   Channel
*   Device
*   Location
*   Export
* * *
## Publishing Performance
เพิ่ม:
*   Publish Success Rate
*   Average Delivery Time
*   Retry Success
*   Failure Type
*   Performance by Device
*   Performance by Channel
*   Performance by Location
* * *
## SLA Engine
เพิ่ม:
*   SLA Policy
*   Service Hours
*   Response Target
*   Resolution Target
*   Exclusion
*   Planned Downtime
*   Breach Calculation
*   SLA Result
Metrics:
*   MTTA
*   MTTR
*   Uptime
*   Downtime
*   SLA Compliance
*   SLA Breach
* * *
## Export & Scheduled Reports
Formats:
*   PDF
*   Excel
*   CSV
*   PowerPoint
Schedule:
*   Daily
*   Weekly
*   Monthly
*   Campaign Completed
*   Custom
* * *
## External Integrations
เพิ่มตาม Priority ธุรกิจ:
*   Email
*   LINE
*   Microsoft Teams
*   Webhook
*   API
*   Facebook
*   LINE OA
*   External CMS
* * *
# Phase 5 — Intelligence & Automation
## เป้าหมาย
เพิ่ม Automation และ AI หลังจากระบบมีข้อมูลจริงเพียงพอ
## Functions
### Automatic Screenshot Matching

```css
Expected Content
vs
Actual Screenshot
→ Match / Mismatch
```

### Automatic Layout Adaptation

```rust
Landscape Layout
→ Generate Portrait Version
```

### Predictive Device Failure
วิเคราะห์:
*   CPU Trend
*   Storage Trend
*   Temperature
*   Offline Frequency
*   Restart Frequency
*   Network Instability
### Root Cause Suggestion
ระบบแนะนำ:
*   Network Problem
*   Player Crash
*   Storage Full
*   Schedule Conflict
*   Missing Content
### Intelligent Scheduling
*   แนะนำช่วงเวลาที่เหมาะสม
*   ตรวจ Conflict อัตโนมัติ
*   ป้องกัน Schedule ซ้ำ
*   แนะนำ Channel Adaptation
* * *
# ลำดับพัฒนาที่แนะนำจริง
## Sprint Group 1: Technical Foundation

```sql
Organization
User
Role
Location
Device Pairing
Heartbeat
Asset Storage
Audit Log
```

## Sprint Group 2: Device & Channel

```sql
Device Registry
Channel
Device Assignment
Online / Offline
Last Seen
```

## Sprint Group 3: Content

```sql
Asset Upload
Metadata
Thumbnail
Search
Preview
Archive
```

## Sprint Group 4: Playlist

```css
Basic Info
Add Content
Reorder
Duration
Loop
Preview
```

## Sprint Group 5: Publication

```sql
Basic Info
Select Content
Select Channel
Schedule
Review
```

## Sprint Group 6: Delivery Engine

```scss
Publish Job
Device Download
Progress
Retry
Playback Command
Playback Log
```

## Sprint Group 7: Operations

```javascript
Live Status
Publish Jobs
Device Monitoring
Error Logs
Remote Restart
```

## Sprint Group 8: Pilot

```plain
Deploy
Observe
Fix
Optimize
Stabilize
```

* * *
# สิ่งที่ห้ามทำในช่วงแรก
เพื่อไม่ให้โครงการใหญ่เกินไป ไม่ควรเริ่มพร้อมกันด้วย:
*   Custom Layout Builder
*   Full Campaign Workflow
*   Multi-step Approval
*   AI Screenshot Matching
*   SLA Engine เต็มรูปแบบ
*   Social Media Integration
*   Advanced Analytics
*   Automatic Layout Adaptation
*   Predictive Maintenance
เพราะ Feature เหล่านี้ต้องพึ่งข้อมูลและ Core Publishing Engine ที่เสถียรก่อน
* * *
# MVP Definition of Done
MVP ถือว่า Solid เมื่อ Operator สามารถทำ Flow นี้ได้โดยไม่ใช้ Aurora หรือเข้าเครื่องทีละตัว:

```markdown
1. Register Device
2. Create Channel
3. Upload Asset
4. Create Playlist
5. Create Publication
6. Select Multiple Channels
7. Set Schedule
8. Publish
9. ดู Download Progress
10. ยืนยันว่า Device เล่นสื่อ
11. Retry Device ที่ Failed
12. ดู Online / Offline
13. ตรวจ Audit Log
```

Technical Acceptance Criteria:
*   Device ไม่สลับหรือรับงานผิด Organization
*   Asset ไม่สูญหาย
*   Publish Job มีสถานะครบ
*   Offline Device สามารถรับงานเมื่อกลับ Online
*   Schedule ทำงานตรง Time Zone
*   Retry ไม่สร้างการเล่นซ้ำผิดพลาด
*   Playlist Version ไม่เปลี่ยนระหว่าง Publish โดยไม่ตั้งใจ
*   ทุก Publish มี Audit Log
*   Operator เห็น Error ที่เข้าใจได้
*   ระบบรองรับการใช้งานต่อเนื่องใน Pilot
* * *
# ข้อเสนอ Final Roadmap

| Phase | เป้าหมาย | Feature หลัก |
| ---| ---| --- |
| Phase 0 | วางฐานระบบ | Data Model, API, Security, Device Protocol |
| Phase 1 | Publish ได้จริง | Asset, Playlist, Publication, Channel, Schedule |
| Phase 1.5 | ทำให้เสถียร | Pilot, Retry, Recovery, Error Handling |
| Phase 2 | Operate ได้จริง | Monitoring, Screenshot, Alert, Incident, Ticket |
| Phase 3 | สร้างความแตกต่าง | Campaign, Approval, Grid, Custom Layout |
| Phase 4 | รองรับองค์กร | SLA, Analytics, Export, Scheduled Report |
| Phase 5 | Automation | AI Matching, Predictive Failure, Auto Adaptation |

## ข้อสรุปที่แนะนำที่สุด
เริ่มจากแกนนี้ก่อน:

```julia
Device
→ Channel
→ Asset
→ Playlist
→ Publication
→ Schedule
→ Publish Job
→ Playback Log
```

เมื่อ Flow นี้เสถียรแล้ว จึงต่อ:

```plain
Monitoring
→ Alert
→ Incident
→ Ticket
→ SLA
→ Reports
```

นี่จะทำให้ระบบ Solid กว่าการเริ่มจากหน้า Dashboard หรือ Feature ที่ดูสวย แต่ยังไม่มีข้อมูลและ Delivery Engine ที่เชื่อถือได้รองรับครับ