# ThunderOne Media Workspace

## Product Flow & Functional Specification
> เอกสารสรุปโครงสร้างระบบ, User Flow, หน้าจอ, ข้อมูลที่เกี่ยวข้อง และขอบเขตการพัฒนาแพลตฟอร์มควบคุมสื่อ Digital Signage / DOOH แบบรวมศูนย์
* * *
# 1\. Product Vision
ThunderOne Media Workspace เป็นแพลตฟอร์มสำหรับบริหารสื่อตั้งแต่การนำ Asset เข้าระบบ การจัด Playlist การออกแบบ Layout การเผยแพร่สื่อ ไปจนถึง Monitoring และ Reporting

```julia
Asset
→ Playlist / Layout
→ Publication
→ Schedule
→ Channel
→ Device
→ Publish Job
→ Playback
→ Proof of Play
→ Monitoring
→ Alert / Ticket / Incident
→ Reports & Analytics
```

ความสามารถหลัก:
*   จัดการ Asset จากศูนย์กลาง
*   สร้าง Playlist
*   สร้าง Publication
*   รองรับ Grid Layout และ Custom Layout
*   เลือกเผยแพร่ระดับ Channel หรือ Individual Device
*   กำหนด Schedule แบบ One-time และ Recurring
*   Publish หลายสาขาพร้อมกัน
*   ตรวจสอบสถานะ Real-time
*   เก็บ Screenshot และ Proof of Play
*   จัดการ Alert, Incident และ Customer Ticket
*   วิเคราะห์ Uptime, SLA และ Publishing Performance
*   Export และตั้ง Scheduled Report
* * *
# 2\. User Roles
## 2.1 Media Operator / Media Manager
*   Upload Asset
*   สร้าง Playlist
*   สร้าง Layout
*   สร้าง Publication
*   เลือก Channel
*   ตั้ง Schedule
*   Publish
*   ตรวจสอบสถานะ
*   แก้ไขปัญหาเบื้องต้น
*   Export Report
## 2.2 Approver
*   ตรวจ Asset
*   ตรวจ Playlist
*   ตรวจ Layout
*   ตรวจ Publication
*   ตรวจ Schedule
*   Approve
*   Reject
*   Request Changes
## 2.3 Customer / Branch User
*   ดูสถานะเฉพาะ Location ที่มีสิทธิ์
*   แจ้ง Ticket
*   แนบรูปหรือวิดีโอ
*   ติดตามสถานะ Ticket
*   ยืนยันผลการแก้ไข
*   ดาวน์โหลดรายงาน
## 2.4 Administrator
*   จัดการ User
*   จัดการ Role และ Permission
*   Register Device
*   สร้าง Channel
*   ตั้งค่า SLA
*   ตั้งค่า Notification
*   ตั้งค่า Integration
*   ตั้งค่า Report Schedule
* * *
# 3\. Main Navigation

```css
Media Workspace
├── Overview
├── Publishing
│   ├── Now & Next
│   ├── Calendar
│   ├── Campaigns
│   ├── Playlists
│   └── Content & Assets
├── Channels
├── Monitoring
│   ├── Live Status
│   ├── Publish Jobs
│   ├── Screen & Playback
│   ├── Devices
│   ├── Screenshots
│   ├── Alerts & Incidents
│   └── Uptime & SLA
├── Reports & Analytics
│   ├── Overview
│   ├── Playback & Proof of Play
│   ├── Publishing Performance
│   ├── Device & Channel Performance
│   └── Incident Analytics & SLA
└── Settings
```

Customer Ticket สำหรับ MVP อยู่ภายใน:

```markdown
Monitoring
└── Alerts & Incidents
    ├── Alerts
    ├── Incidents
    └── Customer Tickets
```

เมื่อ Ticket มีจำนวนมาก สามารถแยกเป็นเมนู `Support Tickets` ในอนาคตได้
* * *
# 4\. Core Concepts
## 4.1 Asset
ไฟล์สื่อกลางของระบบ เช่น:
*   Image
*   Video
*   Audio
*   Web Page
*   QR Code
*   Text
*   Ticker
*   Live Stream
## 4.2 Playlist
รายการสื่อที่เล่นต่อเนื่องตามลำดับเวลา

```css
Asset 1
→ Transition
→ Asset 2
→ Transition
→ Asset 3
```

## 4.3 Layout
รูปแบบการแบ่งพื้นที่หน้าจอออกเป็น Zone

```css
Full Screen
Two Columns
Two Rows
Four Grid
Main + Sidebar
Video + Ticker
Custom Layout
```

## 4.4 Publication
ชุดคำสั่งเผยแพร่ที่รวม:

```diff
Basic Information
+ Content / Playlist
+ Layout
+ Channel Target
+ Schedule
```

## 4.5 Channel
ปลายทางเชิงธุรกิจสำหรับการ Publish เช่น:
*   Central World – LED Screen 1
*   KFC Drive Thru Screens
*   Siam Paragon Menu Boards
*   Bangkok Premium Locations
*   Facebook Page
*   LINE OA
## 4.6 Device
อุปกรณ์จริงที่อยู่ภายใต้ Channel เช่น:
*   Windows Media Player
*   Android Player
*   Kiosk
*   LED Controller
*   External Platform Account

```sql
Channel
├── Primary Device
└── Backup Device
```

## 4.7 Publish Job
งานทางเทคนิคที่ระบบสร้างขึ้นหลังผู้ใช้กด Publish เพื่อส่งข้อมูลไปยังแต่ละ Device
## 4.8 Proof of Play
หลักฐานว่าสื่อถูกเล่นจริง โดยอ้างอิงจาก:
*   Playback Log
*   Media ID
*   Start Time
*   End Time
*   Completion Status
*   Screenshot
* * *
# 5\. Global Data Model
ทุก Entity ควรมีข้อมูลมาตรฐาน:
*   ID
*   Organization ID
*   Status
*   Version
*   Created by
*   Created at
*   Updated by
*   Updated at
*   Archived flag
*   Deleted flag
*   Audit Log
*   Activity History
## Organization Data
*   Organization Name
*   Logo
*   Time Zone
*   Default Language
*   Date Format
*   Default Approval Mode
*   Default SLA
*   Data Retention Period
*   Enabled Modules
*   Subscription
*   License
## User Data
*   User ID
*   Name
*   Email
*   Phone
*   Profile Image
*   Role
*   Team
*   Permission
*   Assigned Locations
*   Assigned Channels
*   Notification Preference
*   Last Login
*   Active Status
* * *
# 6\. Asset Management Flow
## 6.1 จุดที่ Asset เข้าระบบ
Asset เข้าระบบได้ 4 ทาง
### A. Content & Assets

```css
Publishing
→ Content & Assets
→ Upload Assets
→ Save to Asset Repository
```

เหมาะสำหรับเตรียมไฟล์ล่วงหน้า
### B. Create Publication

```sql
Create Publication
→ Content & Layout
→ Upload New
→ Create Asset
→ Attach to Publication
```

### C. Create Playlist

```sql
Create Playlist
→ Add Content
→ Upload New
→ Create Asset
→ Add to Playlist
```

### D. Campaign

```css
Campaign
→ Content & Assets
→ Upload Assets
→ Link Asset to Campaign
```

## 6.2 Asset Processing
ไม่ว่าผู้ใช้ Upload จากหน้าใด ต้องผ่าน Flow เดียวกัน

```dpr
Upload File
→ Validate File Type
→ Validate File Size
→ Extract Metadata
→ Generate Thumbnail
→ Calculate Checksum
→ Check File Integrity
→ Create Asset Record
→ Set Approval Status
→ Ready for Use
```

## 6.3 Asset Data
*   Asset ID
*   File Name
*   Display Name
*   Asset Type
*   MIME Type
*   File Format
*   File Size
*   Storage URL
*   Thumbnail
*   Resolution
*   Aspect Ratio
*   Orientation
*   Duration
*   Frame Rate
*   Bitrate
*   Codec
*   Audio Information
*   Checksum
*   Version
*   Approval Status
*   Tags
*   Campaign
*   Owner
*   Expiry Date
*   Usage Rights
*   Description
*   Used by Playlist
*   Used by Publication
*   Used by Channel
*   Current Live Usage
## 6.4 Content & Assets Page
Tabs:

```less
All Assets
Recent Uploads
Pending Approval
Expiring Soon
Unused Assets
Archived
```

Filters:
*   Search
*   Folder
*   Campaign
*   Type
*   Approval Status
*   Resolution
*   Orientation
*   Owner
*   Tags
*   Expiry
Actions:

```sql
Upload Assets
Create Folder
Preview
Edit Metadata
Upload New Version
Add to Playlist
Create Publication
Move to Folder
Archive
Delete
```

* * *
# 7\. Playlist Flow

```css
Step 1 Basic Info
→ Step 2 Add Content
→ Step 3 Settings
→ Step 4 Review
```

* * *
## 7.1 Step 1: Basic Info
หน้าที่คือสร้างข้อมูลพื้นฐานของ Playlist โดยยังไม่เพิ่ม Content จริง
ข้อมูล:
*   Playlist Name
*   Campaign
*   Playlist Type
*   Resolution
*   Frame Rate
*   Playback Mode
*   Repeat
*   Default Transition
*   Default Transition Duration
*   Description
*   Owner
*   Tags
*   Playlist Cover
ค่าตั้งต้น:

```yaml
Items: 0
Estimated Duration: 00:00:00
```

### Playback Mode สำหรับ MVP

```plain
Sequential
Shuffle
```

ความหมาย:

```java
Playback Mode
= ระบบเลือก Item ใดมาเล่นก่อนหรือหลัง

Repeat
= เมื่อเล่นครบ Playlist แล้วจะทำอะไร
```

ตัวอย่าง:

```yaml
Playback Mode: Sequential
Repeat: Loop

1 → 2 → 3 → 1 → 2 → 3
```

* * *
## 7.2 Step 2: Add Content
หน้าที่:
*   เลือก Asset จากระบบ
*   Upload Asset ใหม่
*   เลือกหลายไฟล์
*   เพิ่มเข้า Playlist
*   จัดลำดับ
*   ตั้ง Duration
*   ตั้ง Transition
*   Preview
*   Validate
Tabs:

```css
Content Library
Upload Assets
Recent Uploads
```

Filters:
*   Search
*   Campaign
*   Type
*   Approval Status
*   Resolution
*   Sort By
*   Grid / List
Actions:

```sql
Add Selected
Upload New
Preview
Filter
Clear Selection
```

ตาราง Selected for Playlist:
*   Order
*   Thumbnail
*   Asset Name
*   Type
*   Duration
*   Transition to Next
*   Transition Duration
*   Screen Fit
*   Approval Status
*   Actions
Transition ที่รองรับเบื้องต้น:

```css
None
Fade
Slide
Wipe
Zoom
```

ตัวอย่าง:

```yaml
1. Opening Logo
   Duration: 5 sec
   Transition to Next: Fade 1.0 sec

2. Product Video
   Duration: 15 sec
   Transition to Next: Slide 0.8 sec

3. Price Image
   Duration: 10 sec
   Transition to Next: Wipe 1.2 sec
```

Bulk Actions:

```css
Apply Transition to All
Default Transition Duration
```

Validation:
*   At least one item selected
*   All selected assets approved
*   All media match Playlist resolution
*   No expired media
*   Total duration is valid
* * *
## 7.3 Step 3: Settings
### Playback Settings
*   Play Mode
*   Repeat
*   Shuffle
*   Start From
*   Auto Play
*   Resume on Error
*   End Behavior
*   Screen Blank Time
### Default Transition
*   Transition
*   Transition Duration
*   Transition Preview
ค่า Default สามารถถูก Override ราย Item ใน Step Add Content
### Display Settings
*   Screen Fit
*   Align
*   Background Color
*   Content Safe Margin
*   Safe Area Guide
### Audio Settings
*   Audio Output
*   Default Volume
*   Mute on Start
*   Audio Fade In
*   Audio Fade Out
### Advanced Options
*   Monitor Health Check
*   Cache Media on Device
*   Allow Remote Control
*   Override by Emergency Content
*   Notes
* * *
## 7.4 Step 4: Review
แสดงข้อมูลสรุป:
*   Playlist Name
*   Campaign
*   Resolution
*   Frame Rate
*   Playback Mode
*   Repeat
*   Default Transition
*   Item Count
*   Total Duration
*   Content Items
*   Transition แต่ละรายการ
*   Validation
*   Approval Status
*   Warning
*   Blocking Issue
Actions:

```rust
Save Playlist
Save as Draft
Submit for Approval
```

* * *
# 8\. Publication Flow

```css
Step 1 Basic Info
→ Step 2 Content & Layout
→ Step 3 Channels
→ Step 4 Schedule
→ Step 5 Review & Publish
```

* * *
## 8.1 Step 1: Basic Info
ข้อมูล:
*   Publication Name
*   Campaign
*   Publication Type
*   Description
*   Language
*   Priority
*   Owner
*   Tags
*   Internal Note
*   Thumbnail
*   Status
Actions:

```cs
Save as Draft
Next: Content & Layout
```

* * *
## 8.2 Step 2: Content & Layout
### Display Mode

```css
Single Content
Playlist
Grid Layout
Custom Layout
```

### Layout Templates
สำหรับ MVP:

```css
Full Screen
Two Columns
Two Rows
Four Grid
Main + Sidebar
Video + Ticker
```

### Layout Data
*   Layout ID
*   Layout Name
*   Template Type
*   Resolution
*   Orientation
*   Canvas Width
*   Canvas Height
*   Background
*   Safe Area
*   Zone Count
*   Version
### Zone Data
*   Zone ID
*   Zone Name
*   X Position
*   Y Position
*   Width
*   Height
*   Z-index
*   Content Source Type
*   Asset
*   Playlist
*   Web Page
*   Fit Mode
*   Duration
*   Loop
*   Mute
*   Volume
*   Background
*   Lock Position
*   Fallback Content
### Custom Layout Builder
Functions:
*   Add Zone
*   Split Horizontal
*   Split Vertical
*   Resize Zone
*   Drag & Drop
*   Align
*   Snap to Grid
*   Duplicate Zone
*   Delete Zone
*   Layer Forward
*   Layer Backward
*   Add Image
*   Add Video
*   Add Text
*   Add Ticker
*   Add QR Code
*   Preview
*   Save as Template
### Layout Validation
*   Empty Zone
*   Overlapping Zone
*   Zone Out of Bounds
*   Unsupported Content
*   Resolution Mismatch
*   Orientation Mismatch
*   Missing Approval
*   Expired Content
* * *
## 8.3 Step 3: Channels
### Selection Mode

```plain
Channels
Individual Devices
```

ค่าเริ่มต้นควรเป็น `Channels`
### Channel Tabs

```sql
All Channels
My Channels
Channel Groups
By Location
External Channels
```

### Channel Data
*   Channel ID
*   Channel Name
*   Channel Type
*   Location
*   Device Count
*   External Account Count
*   Online Status
*   Resolution
*   Orientation
*   Compatibility
*   Permission
### Individual Device Data
*   Device ID
*   Device Name
*   Channel
*   Location
*   Output
*   Resolution
*   Status
*   Last Seen
*   Compatibility
### Layout Compatibility

```plain
Compatible
Needs Adaptation
Incompatible
```

กรณี Layout ไม่รองรับ:

```yaml
Layout Not Supported

Selected Layout:
1920 × 1080 Landscape

Selected Channel:
1080 × 1920 Portrait
```

Suggested Actions:

```sql
Create Portrait Adaptation
Select Another Layout
Remove Channel
Continue with Letterbox
```

### Selected Channel Summary
*   Selected Channel Count
*   Device Count
*   Location Count
*   Online Count
*   Warning Count
*   Offline Count
*   Estimated Reach
*   Compatibility Summary
*   Blocking Issues
* * *
## 8.4 Step 4: Schedule
Schedule Type:

```sql
Publish Now
Schedule Later
Recurring Schedule
Custom Date Range
```

ข้อมูล:
*   Start Date
*   Start Time
*   End Date
*   End Time
*   Expiration
*   Time Zone
*   Recurrence
*   Days of Week
*   Operating Hours
*   Blackout Period
*   Publish Order
*   Delay Between Channels
*   Priority Override
*   Retry Policy
*   Offline Delivery Behavior
### Conflict Detection
*   Time Overlap
*   Channel Overlap
*   Device Overlap
*   Priority Conflict
*   Maintenance Period
*   Blackout Period
*   Approval Incomplete
*   Content Expired
* * *
## 8.5 Step 5: Review & Publish
แสดงข้อมูลสรุปจากทุก Step:
*   Basic Information
*   Content
*   Playlist
*   Layout Preview
*   Zone Summary
*   Selected Channels
*   Selected Devices
*   Schedule
*   Approval Status
*   Compatibility
*   Readiness Checklist
*   Warnings
*   Blocking Errors
*   Offline Devices
*   Version
*   Publish Mode
Readiness Checklist:

```css
✓ All Zones Have Content
✓ Assets Approved
✓ Layout Compatible
✓ Schedule Valid
✓ No Expired Assets
⚠ 2 Devices Offline
```

เมื่อกด Publish ระบบสร้าง:
*   Publication Record
*   Publication Version
*   Schedule Record
*   Publish Job
*   Channel Targets
*   Device Targets
*   Audit Log
*   Notification Event
* * *
# 9\. Campaign Flow
Campaign Tabs:

```css
Overview
Publications
Timeline
Content & Assets
Approvals
Settings
```

## 9.1 Campaign Overview
แสดง:
*   Campaign Details
*   Publication Count
*   Live Publications
*   Scheduled Publications
*   Pending Approval
*   Failed Publications
*   Channel Readiness
*   Location Coverage
*   Device Coverage
*   Campaign Progress
*   Operational Issues
*   Recent Publications
ไม่รวมใน MVP:
*   Budget
*   ROI
*   Sales Conversion
*   Marketing Attribution
## 9.2 Publications
ข้อมูล:
*   Publication ID
*   Name
*   Thumbnail
*   Type
*   Asset / Playlist
*   Version
*   Channels
*   Locations
*   Device Count
*   Schedule
*   Approval
*   Readiness
*   Status
*   Owner
*   Priority
*   Issue Count
*   Last Updated
Bulk Actions:
*   Submit for Approval
*   Change Owner
*   Change Schedule
*   Pause
*   Cancel
*   Duplicate
*   Archive
## 9.3 Timeline
เป็น Publishing Timeline ไม่ใช่ Project Management Timeline
Event Types:

```rust
Campaign Created
Publication Added
Submitted for Approval
Approved
Scheduled
Went Live
Asset Updated
Schedule Changed
Publish Failed
Device Failed
Paused
Cancelled
Completed
```

## 9.4 Content & Assets
แสดง:
*   Asset
*   Version
*   Approval
*   Expiry
*   Usage
*   Compatibility
*   Playlist Usage
*   Publication Usage
*   Current Live Usage
## 9.5 Approvals
ข้อมูล:
*   Approval ID
*   Approval Type
*   Target Type
*   Target ID
*   Version
*   Submitted By
*   Submitted At
*   Current Approver
*   Due Date
*   Status
*   Comments
*   Checklist
*   Approval History
*   Rejection Reason
Logic:

```dpr
Approved
→ Add to Campaign
→ Schedule
→ Publish Allowed

Not Approved
→ Save as Draft Allowed
→ Add to Campaign with Warning
→ Publish Blocked
```

## 9.6 Settings
*   Campaign Basic Information
*   Approval Workflow
*   Notification
*   Owner
*   Backup Owner
*   Team
*   Visibility
*   Member Permission
*   Location Scope
*   Channel Scope
* * *
# 10\. Channel Flow

```julia
Channel = ปลายทางสำหรับ Publish
Device = อุปกรณ์จริงที่อยู่ภายใต้ Channel
```

หนึ่ง Channel รองรับ:
*   One Device
*   Multiple Devices
*   Primary Device
*   Backup Device
*   External Account
## 10.1 Channel List
ข้อมูล:
*   Channel ID
*   Channel Name
*   Type
*   Location
*   Device Count
*   Resolution
*   Orientation
*   Status
*   Current Content
*   Next Content
*   Last Seen
*   Owner
*   Tags
*   Group
## 10.2 Create / Edit Channel
### Basic Information
*   Channel Name
*   Channel Type
*   Location
*   Description
*   Tags
*   Status
*   Orientation
*   Time Zone
### Device Assignment
Actions:

```sql
Add Existing Device
Register New Device
```

Data:
*   Device
*   Output
*   IP Address
*   Role
*   Primary / Backup
*   Status
*   Failover Order
*   Sync Group
### Playback Configuration
*   Resolution
*   Default Playlist
*   Fallback Content
*   Audio
*   Playback Mode
*   Sync Mode
*   Auto Resume
*   Fit Mode
### Schedule & Behavior
*   Operating Hours
*   Default Schedule Profile
*   Blackout Period
*   Emergency Override
*   Restart after Failure
*   Content Expiry Warning
### Monitoring Configuration
*   Heartbeat Interval
*   Offline Threshold
*   Screenshot Interval
*   Storage Threshold
*   Alert Recipients
*   Restart Policy
* * *
# 11\. Device Registration Flow

```sql
Register New Device
→ Generate Pairing Code
→ Device Enters Pairing Code
→ Validate Device Identity
→ Register Hardware
→ Assign Organization
→ Assign Location
→ Assign Channel
→ Set Output and Resolution
→ Activate
```

Device Data:
*   Device ID
*   Device Name
*   Serial Number
*   MAC Address
*   Pairing Code
*   Hardware Model
*   Device Type
*   Operating System
*   Player Version
*   IP Address
*   Network Type
*   Location
*   Registration Status
*   Online Status
*   Assigned Channel
*   Primary / Backup Role
*   Last Seen
*   License Status
* * *
# 12\. Publishing: Now & Next
## 12.1 Now Live
ตอบคำถาม:

```julia
ขณะนี้แต่ละ Channel กำลังเล่นอะไร
```

ข้อมูล:
*   Publication
*   Campaign
*   Thumbnail
*   Channel
*   Location
*   Device Count
*   Start Time
*   End Time
*   Remaining Time
*   Current Content
*   Playback Status
*   Publish Job Status
*   Online / Warning / Offline Devices
*   Proof of Play
*   Last Screenshot
## 12.2 Next Up
ตอบคำถาม:

```plain
รายการถัดไปคืออะไร และพร้อมเล่นหรือยัง
```

ข้อมูล:
*   Next Publication
*   Scheduled Start
*   Countdown
*   Campaign
*   Asset / Playlist
*   Channel
*   Device Count
*   Approval Status
*   Asset Readiness
*   Download Status
*   Compatibility
*   Schedule Conflict
*   Estimated Duration
*   Priority
*   Readiness Score
## 12.3 Upcoming
ตอบคำถาม:

```plain
ในอนาคตมี Publication ใดถูกกำหนดไว้บ้าง
```

ข้อมูล:
*   Publication
*   Campaign
*   Start Date / Time
*   End Date / Time
*   Recurrence
*   Channel
*   Location
*   Device Count
*   Approval Status
*   Schedule Status
*   Conflict
*   Owner
*   Priority
*   Version
* * *
# 13\. Calendar
หน้าที่:
*   ดู Schedule ทั้งระบบ
*   ดูตาม Campaign
*   ดูตาม Publication
*   ดูตาม Channel
*   ตรวจ Conflict
*   Drag & Drop เปลี่ยนเวลา
*   Edit Schedule
ข้อมูล:
*   Schedule ID
*   Publication
*   Campaign
*   Thumbnail
*   Channel
*   Location
*   Start
*   End
*   Time Zone
*   Recurrence
*   Priority
*   Approval
*   Conflict
*   Owner
* * *
# 14\. Monitoring
## 14.1 Live Status
ข้อมูล:
*   Channel
*   Device
*   Location
*   Online Status
*   Current Content
*   Next Content
*   Current Schedule
*   Last Seen
*   Playback Status
*   Screenshot
*   Active Alert
*   Uptime
*   Player Version
## 14.2 Publish Jobs
สถานะ:

```plain
Queued
Processing
Downloading
Delivered
Playing
Partial Success
Failed
Cancelled
```

ข้อมูล:
*   Job ID
*   Publication
*   Start Time
*   Progress
*   Target Count
*   Success Count
*   Failed Count
*   Retry Count
*   Error Type
*   Delivery Time
*   Device-level Result
*   Job Timeline
*   Published By
Actions:

```sql
Retry Failed
Cancel Job
View Failed Devices
View Logs
Republish
```

## 14.3 Screen & Playback
ข้อมูล:
*   Screen Power
*   Signal Status
*   Input Source
*   Expected Content
*   Actual Content
*   Playback Status
*   Playback Time
*   Proof of Play
*   Last Screenshot
*   Last Seen
*   Content Mismatch
*   Resolution
Operational Status:

```scss
Healthy
Warning
Content Syncing
Publish Failed
Player Offline
Screen Off
No Signal
Device Offline
Under Maintenance
Disabled
```

## 14.4 Devices
Telemetry:
*   CPU
*   RAM
*   Storage
*   Temperature
*   Network Signal
*   Latency
*   Packet Loss
*   Uptime
*   Player Process Status
*   Player Version
*   OS Version
*   License
*   Last Heartbeat
*   Restart Count
Remote Actions:

```css
Restart Player
Restart Device
Sync Content
Capture Screenshot
Clear Cache
Update Player
Test Connection
```

## 14.5 Screenshots
ข้อมูล:
*   Screenshot ID
*   Channel
*   Device
*   Location
*   Capture Time
*   Capture Type
*   Expected Content
*   Captured Image
*   Match Status
*   Confidence Score
*   Flagged Status
*   Capture Schedule
*   Captured By
*   Related Incident
Actions:
*   Capture Now
*   Compare Expected vs Actual
*   Download
*   Flag Mismatch
*   View History
## 14.6 Alerts & Incidents
Alert ตัวอย่าง:
*   Device Offline
*   Screen Off
*   No Signal
*   Publish Failed
*   Storage Low
*   Player Crashed
*   Schedule Conflict
*   Content Missing
*   License Expired
*   Network Unstable
Incident Status:

```php
New
Acknowledged
In Progress
Resolved
Closed
Ignored
```

Incident Data:
*   Incident ID
*   Alert IDs
*   Ticket IDs
*   Title
*   Description
*   Severity
*   Owner
*   Created Time
*   Acknowledged Time
*   Started Work Time
*   Resolved Time
*   Closed Time
*   Root Cause
*   Resolution
*   Downtime
*   SLA Result
*   Notes
*   Attachments
## 14.7 Uptime & SLA
ข้อมูล:
*   Device
*   Channel
*   Location
*   Monitoring Period
*   Expected Service Time
*   Online Duration
*   Downtime
*   Planned Downtime
*   Unplanned Downtime
*   Uptime Percentage
*   Incident Count
*   MTTA
*   MTTR
*   SLA Target
*   SLA Result
*   Breach Duration
*   Exclusion Reason
* * *
# 15\. Ticket Flow
ความหมาย:

```plain
Alert
= ระบบตรวจพบความผิดปกติอัตโนมัติ

Ticket
= ลูกค้าหรือผู้ใช้แจ้งปัญหา

Incident
= ทีมงานยืนยันปัญหาและติดตามการแก้ไข
```

Flow:

```sql
Customer Reports Issue
→ Create Ticket
→ Find Related Alert
→ Link or Create Incident
→ Assign Owner
→ Remote Check
→ Resolve Incident
→ Notify Customer
→ Customer Confirmation
→ Close Ticket
```

Ticket Data:
*   Ticket ID
*   Reporter
*   Phone
*   Email
*   Issue Type
*   Issue Category
*   Priority
*   Title
*   Description
*   Issue Start Time
*   Channel
*   Device
*   Location
*   Attachment
*   Screenshot
*   Related Alert
*   Related Incident
*   SLA
*   Customer Reference
Ticket Status:

```php
New
Acknowledged
In Progress
Waiting for Customer
Resolved
Closed
Cancelled
```

Duplicate Detection:

```sql
Existing Incident Found
→ View Existing Incident
→ Link to Existing Incident
→ Create New Ticket
```

* * *
# 16\. Reports & Analytics
ความแตกต่าง:

```plain
Monitoring
= ขณะนี้เกิดอะไรขึ้น และต้องแก้ไขอะไร

Reports & Analytics
= ที่ผ่านมาเกิดอะไรขึ้น และมีแนวโน้มอย่างไร
```

Global Filters:
*   Date Range
*   Campaign
*   Publication
*   Channel
*   Channel Type
*   Location
*   Device
*   Status
*   Severity
*   Saved View
## 16.1 Overview
KPI:
*   Total Publications
*   Total Plays
*   Verified Plays
*   Publish Success Rate
*   Active Channels
*   Average Uptime
*   Open Incidents
*   SLA Compliance
Charts:
*   Playback Trend
*   Publish Success Trend
*   Incidents by Severity
*   Channel Status
*   Top Locations by Incidents
*   Active Channels by Type
## 16.2 Playback & Proof of Play
KPI:
*   Total Plays
*   Verified Plays
*   Unverified Plays
*   Missed Plays
*   Completion Rate
*   Total Playback Duration
*   Proof of Play Coverage
Table:
*   Played At
*   Publication
*   Asset
*   Campaign
*   Channel
*   Device
*   Location
*   Duration
*   Result
*   Verification
*   Screenshot
*   Missed Reason
*   Expected Schedule
## 16.3 Publishing Performance
KPI:
*   Total Publish Jobs
*   Delivery Success Rate
*   Average Delivery Time
*   Failed Jobs
*   Partial Success
*   Retry Success Rate
Analytics:
*   Jobs by Status
*   Delivery Trend
*   Failure by Error Type
*   Failure by Device
*   Failure by Channel
*   Failure by Location
## 16.4 Device & Channel Performance
ข้อมูล:
*   Uptime
*   Downtime
*   Offline Events
*   MTTR
*   CPU
*   RAM
*   Storage
*   Network Quality
*   Publish Success
*   Playback Success
*   Incident Count
*   SLA Status
*   Performance Ranking
Views:

```plain
Overview
Devices
Channels
Locations
```

## 16.5 Incident Analytics & SLA
ใช้วิเคราะห์ย้อนหลัง ไม่ใช้จัดการ Incident แบบ Real-time
KPI:
*   Incident Count
*   Critical Incident
*   Response Time
*   Resolution Time
*   MTTA
*   MTTR
*   SLA Compliance
*   SLA Breach
*   Reopened Ticket
*   Recurring Incident
Analytics:
*   Incident Trend
*   Severity
*   Root Cause
*   SLA by Location
*   Recurring Issues
*   Location Ranking
*   Device Ranking
* * *
# 17\. Export & Scheduled Report
Export Formats:

```coffeescript
PDF
Excel
CSV
PowerPoint
JSON
API
```

Export Options:
*   Report Type
*   Filter Snapshot
*   Selected Columns
*   Include Charts
*   Include Raw Data
*   Include Screenshots
*   Time Zone
*   Language
*   Generated By
*   Generated At
Scheduled Report Data:
*   Schedule ID
*   Report Template
*   Frequency
*   Day
*   Time
*   Time Zone
*   Start Date
*   End Date
*   Recipients
*   Email Subject
*   Email Message
*   File Format
*   Filter Conditions
*   Active Status
*   Last Run
*   Next Run
*   Delivery Result
Frequency:

```plain
Daily
Weekly
Monthly
After Campaign Completed
Custom
```

* * *
# 18\. Approval Flow

```rust
Draft
→ Submit for Approval
→ In Review
→ Approved
→ Scheduled
→ Published
```

กรณีไม่ผ่าน:

```sql
Rejected
→ Request Changes
→ Update Version
→ Resubmit
```

Approval Targets:
*   Asset
*   Playlist
*   Layout
*   Publication
*   Schedule
Policy:

```sql
Approved
→ Publish Allowed

Not Approved
→ Save Draft Allowed
→ Add to Campaign with Warning
→ Publish Blocked
```

* * *
# 19\. Notification Flow
Notification Channels:
*   In-App
*   Email
*   LINE
*   Microsoft Teams
*   Mobile Application
*   API / Webhook
Notification Events:
*   Asset Approved
*   Approval Requested
*   Publication Scheduled
*   Publish Failed
*   Device Offline
*   Screen No Signal
*   Storage Low
*   Incident Assigned
*   SLA Risk
*   Ticket Updated
*   Report Ready
* * *
# 20\. Settings
Settings ควรแบ่งเป็น:

```julia
Settings
├── Organization
├── Users & Roles
├── Permissions
├── Device Registration
├── Channel Defaults
├── Layout Templates
├── Approval Workflow
├── Notification
├── SLA Policies
├── Integrations
├── Report Templates
├── Data Retention
└── Audit Logs
```

* * *
# 21\. Backend Entities

```plain
organizations
users
roles
permissions

campaigns
campaign_members
campaign_settings

assets
asset_versions
asset_adaptations
asset_usage

layouts
layout_versions
layout_zones
layout_templates

playlists
playlist_items
playlist_versions

publications
publication_targets
publication_versions

schedules
schedule_recurrences
blackout_periods

locations
channels
channel_groups
channel_group_members

devices
device_outputs
device_assignments
device_telemetry
device_heartbeats

publish_jobs
publish_job_targets
publish_job_events

playback_logs
proof_of_play
screenshots

approval_requests
approval_steps
approval_actions

alerts
incidents
incident_activities

tickets
ticket_activities

sla_policies
sla_results
uptime_records
downtime_events

reports
report_templates
report_schedules
report_exports

notifications
audit_logs
```

* * *
# 22\. MVP Scope
## MVP
*   Organization
*   User / Role / Permission
*   Campaign
*   Asset Repository
*   Upload Asset
*   Playlist
*   Publication
*   Basic Layout Templates
*   Channel
*   Device Registration
*   Schedule
*   Publish Job
*   Live Status
*   Device Health
*   Screenshot
*   Alert
*   Incident
*   Customer Ticket
*   Approval
*   Basic Reports
*   Export PDF / Excel / CSV
## Phase 2
*   Advanced Proof of Play
*   Automatic Screenshot Matching
*   SLA Engine
*   Custom Layout Builder
*   Layout Adaptation
*   Device Failover
*   Scheduled Reports
*   External Channel Integration
*   Remote Player Update
*   Advanced Notification Integration
## Phase 3
*   Automatic Layout Adaptation
*   AI Content Validation
*   Predictive Device Failure
*   Audience Reach
*   Advanced Analytics
*   Marketing Integration
*   Automated Root Cause Suggestion
* * *
# 23\. End-to-End User Flow

```markdown
1. Upload Asset
2. Validate Asset
3. Approve Asset
4. Create Playlist หรือเลือก Single Content
5. เลือก Grid Layout หรือสร้าง Custom Layout
6. Create Publication
7. Select Channel หรือ Individual Device
8. Validate Resolution / Orientation / Compatibility
9. Set Schedule
10. Check Conflict
11. Review & Publish
12. Track Publish Job
13. Verify Device Delivery
14. Verify Playback
15. Capture Screenshot / Proof of Play
16. Monitor Device / Screen / Network
17. Create Alert / Ticket / Incident
18. Resolve Issue
19. Calculate Uptime / SLA
20. Export หรือ Schedule Report
```

* * *
# 24\. Product Principles
1. `Channel` เป็นหน่วยหลักที่ผู้ใช้เลือกตอน Publish
2. `Device` เป็นหน่วยทางเทคนิคที่อยู่ภายใต้ Channel
3. `Asset` ต้องเป็น Repository กลางของระบบ
4. Upload จากหน้าใดต้องสร้าง Asset ด้วยมาตรฐานเดียวกัน
5. Playlist ใช้กำหนดลำดับเวลา ส่วน Layout ใช้กำหนดพื้นที่หน้าจอ
6. Monitoring ต้องแยกจาก Reports & Analytics
7. Alert, Ticket และ Incident ต้องมีความหมายและ Workflow ต่างกัน
8. Publication ต้องตรวจ Approval, Schedule และ Compatibility ก่อน Publish
9. Layout ต้องตรวจ Resolution และ Orientation กับ Channel
10. ทุก Action สำคัญต้องบันทึก Audit Log
11. ระบบต้องรองรับ One Man Operation
12. Data Model ต้องรองรับการขยายเป็น Multi-role และ Multi-organization
* * *
# 25\. Final Summary
ThunderOne Media Workspace ครอบคลุมกระบวนการทั้งหมดดังนี้:

```julia
เตรียม Asset
→ สร้าง Playlist
→ ออกแบบ Layout
→ สร้าง Publication
→ เลือก Channel
→ ตั้ง Schedule
→ Publish
→ Monitor
→ Verify Playback
→ Handle Incident
→ Analyze
→ Report
```

จุดเด่นหลัก:
*   ควบคุมหลายสาขาและหลาย Device จากระบบเดียว
*   มี Asset Repository กลาง
*   รองรับ Playlist, Grid Layout และ Custom Layout
*   มี Approval Workflow
*   ตรวจ Publish Job ได้ถึงระดับ Device
*   Monitoring แบบ Real-time
*   มี Screenshot และ Proof of Play
*   เชื่อมโยง Alert, Incident และ Customer Ticket
*   คำนวณ Uptime และ SLA
*   Export และ Scheduled Report
*   รองรับการขยายระบบในอนาคต