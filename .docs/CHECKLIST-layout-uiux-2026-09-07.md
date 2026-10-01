# CHECKLIST — Layout editor UI/UX rework (2026-09-07)

งานที่เช็ค: 31 ไฟล์ที่แก้หลังจาก ticket 21–29 ถูก sign off ไปแล้ว — **ยังไม่มีใคร verify ที่ browser**
ผ่านแล้วแค่เกต: `tsc` exit 0 · `eslint` 0 error · `*.check.mts` ผ่านหมด

**สภาพแวดล้อม**

- `CORE_API_URL=http://localhost:3001` (local Thunder_Core → **develop** DB `ftfmokgphewzyxzwjitv`)
- restart dev server หลังเปลี่ยน env แล้วเช็ค `http://localhost:3000/api/proxy/__config`
  → ต้องได้ `{"coreApiUrl":"http://localhost:3001","hasKey":true}`
- ตั้งชื่อของทดสอบขึ้นต้น **`zz-ux-`** ทุกอัน เพื่อให้ §H ลบทิ้งได้
- asset ส่วนใหญ่เป็น `approval_status='draft'` เลือกไม่ได้ — ที่ approved แล้ว search `KFC`, `sample`, `Predator`

ตอบกลับแค่ **PASS / FAIL + สิ่งที่เห็น** พอ ไม่ต้องแก้อะไร

---

## A. New Layout start step (ไฟล์ใหม่ `create-layout-start-step.tsx`)

| # | ทำ | คาดว่าจะได้ |
|---|---|---|
| A1 | `/media-workspace/layouts` → `+ New Layout` | ขึ้น step ให้เลือก 2 ทาง: **Blank** กับ **Template** (มีไอคอนต่างกัน) |
| A2 | เลือก **Blank** | มีฟอร์มให้กรอก: name, folder, tags, width × height, background |
| A3 | กรอก name `zz-ux-blank`, width `1920`, height `1080`, background ดำ → ไปต่อ | เข้า editor **โดยที่ชื่อ / folder / tags / resolution / background ติดมาแล้ว** ไม่ต้องกรอกซ้ำในพาเนลขวา |
| A4 | ดู badge บน header | เห็น `1920x1080` และ `16:9` |
| A5 | ย้อนกลับมาสร้างใหม่ เลือก **Template** | เปิด Template Picker (ข้อ B) |

## B. Template Picker (เขียนใหม่ 391 บรรทัด)

| # | ทำ | คาดว่าจะได้ |
|---|---|---|
| B1 | ดู Picker | มี preset ของระบบ + Template ที่ tenant มีจริง แยกกลุ่มกัน |
| B2 | ดูการ์ดแต่ละใบ | โชว์ wireframe ของ zone, จำนวน zone, aspect ratio และ **reference resolution** |
| B3 | เลือก preset แนวตั้ง (portrait) | editor เปิดมาเป็น `1080x1920` / `9:16` — **ไม่ใช่ 16:9** |
| B4 | เลือก Template ของ tenant | editor เปิดพร้อม zone ของ Template นั้น ครบจำนวน |
| B5 | reload หน้า editor 1 ครั้ง (F5) | zone ยังอยู่ ไม่กลับไปเป็น "Start from the Template Picker" |

## C. Editor 3 คอลัมน์ + Zone Overview

| # | ทำ | คาดว่าจะได้ |
|---|---|---|
| C1 | ดูโครงหน้า | ซ้าย = ชั้นวาง content, กลาง = canvas, ขวา = properties |
| C2 | ยังไม่เลือก zone | พาเนลขวา = **Layout Properties** |
| C3 | คลิก zone บน canvas | พาเนลขวาสลับเป็น **Zone properties** ของ zone นั้น |
| C4 | เลื่อนลงล่างสุด | **Zone Overview** อยู่ใต้ 3 คอลัมน์ (ไม่ได้อยู่กลางหน้าแบบเดิม) |
| C5 | เปิด drawer เลือก content จากคอลัมน์ซ้าย | เลือกได้ทั้ง **Media** และ **Playlist** ใน drawer เดียว |
| C6 | เลือก asset แล้วยังไม่กด insert | ของไป **พักบนชั้นวาง** — zone ยังไม่เปลี่ยน |
| C7 | กด insert | zone ถึงจะผูก content, Zone Overview ขึ้น `Bound` |
| C8 | หา `Split Zone` | อยู่ใน toolbar ของ canvas |

## D. Header ใหม่ (ชื่อแบบ click-to-edit + badge + ปุ่ม Save)

| # | ทำ | คาดว่าจะได้ |
|---|---|---|
| D1 | ดูหัวข้อ | เป็นข้อความธรรมดา + ปุ่มดินสอ (ไม่ใช่ input ตลอดเวลา) ถ้าไม่มีชื่อขึ้น `Untitled Layout` |
| D2 | กดดินสอ → พิมพ์ → **Enter** | ชื่อเปลี่ยน กลับเป็นข้อความ |
| D3 | กดดินสอ → พิมพ์ → **Escape** | **ยกเลิก** ชื่อกลับเป็นของเดิม |
| D4 | กดดินสอ → พิมพ์ → กดปุ่มติ๊กถูก | ชื่อเปลี่ยน |
| D5 | ดูแถว badge | resolution · aspect ratio · จำนวน Zone · `Not saved` (ก่อนเซฟ) · สถานะ |
| D6 | กด Save 1 ครั้ง | badge เปลี่ยนเป็น `Updated HH:MM` |
| D7 | Layout สถานะ **draft** | ปุ่มอ่านว่า `Save Layout` และ **มี ▾** ข้างๆ |
| D8 | กด ▾ | มีแค่ `Save & Activate` — **ไม่มี `Save as draft` แล้ว** |
| D9 | ถ้ามี zone ยังไม่ผูก content แล้วกด ▾ | `Save & Activate` ถูก disable + บอกว่า zone ไหนยังไม่ผูก |
| D10 | เปิด Layout ที่สถานะ **active** | ปุ่มอ่านว่า `Save` เฉยๆ และ **ไม่มี ▾** |

## E. ⚠️ Save as Template — เปลี่ยนเป็น "คัดลอก" (จุดสำคัญที่สุด)

พฤติกรรมเปลี่ยนจาก *ย้าย row ตัวเองไปเป็น Template* → *สร้าง Template ใบใหม่* (ADR 0052 §4 amendment)

| # | ทำ | คาดว่าจะได้ |
|---|---|---|
| E1 | เปิด Layout ที่เซฟแล้ว ชื่อ `zz-ux-src` | ปุ่ม `Save as Template` **โชว์เสมอ** (เดิมโชว์เฉพาะบาง Layout) |
| E2 | กด → ตั้งชื่อ `zz-ux-tpl-1` → ยืนยัน | **ไม่ redirect** อยู่หน้าเดิม ขึ้นแถบเขียว `Added "zz-ux-tpl-1" to My Templates.` |
| E3 | กด `Save as Template` อีกรอบ ตั้งชื่อ `zz-ux-tpl-2` | **ทำซ้ำได้** ได้ Template ใบที่สอง (เดิมทำได้ครั้งเดียว) |
| E4 | ตั้งชื่อซ้ำกับ Template ที่มีอยู่ | ปุ่มยืนยัน disable + ขึ้นข้อความสีแดง |
| E5 | ไป `/media-workspace/layouts/templates` | เห็นทั้ง `zz-ux-tpl-1` และ `zz-ux-tpl-2` ชื่อถูกต้อง **ไม่มี `comp:<uuid>`** โผล่ |
| E6 | กลับมาเปิด `zz-ux-src` อีกครั้ง | **zone และ content ที่ผูกไว้ยังครบเหมือนเดิม** — การเซฟ Template ต้องไม่แตะของเดิม |
| E7 | แก้ zone ของ `zz-ux-src` แล้วเซฟ | **ต้องไม่ขึ้นคำเตือน "This Template is used by N Layouts"** — geometry ของมันยังเป็นของส่วนตัวอยู่ |

**SQL ยืนยัน E** (Supabase MCP, project `ftfmokgphewzyxzwjitv`) — ส่งผลกลับมาด้วย:

```sql
select l.id, l.name, l.kind, l.status,
       (select count(*) from media_core.layout_zones z where z.layout_id = l.id) as zones
from media_core.layouts l
where l.name like 'zz-ux-%' or l.id = (
  select layout_id from media_core.compositions where name = 'zz-ux-src')
order by l.created_at;
```

ต้องได้: `zz-ux-tpl-1` + `zz-ux-tpl-2` เป็น `kind=template`, และ row ของ `zz-ux-src` ยังเป็น
**`kind=inline` ชื่อ `comp:<uuid>`** — ถ้ากลายเป็น `template` แปลว่ายังเป็นโค้ดเก่า **FAIL**

## F. Regression — ของเดิมต้องไม่พัง

| # | ทำ | คาดว่าจะได้ |
|---|---|---|
| F1 | เปิด Layout เก่าที่มีอยู่ (`ZZTEST-T15-browser-layout`) | โหลดได้ zone ครบ content ที่ผูกไว้ยังอยู่ |
| F2 | กด `Preview` | เล่นได้ทุก zone |
| F3 | แก้ชื่อแล้วกด `Cancel` | เด้ง "ออกโดยไม่บันทึกร่าง?" — `อยู่ต่อ` ปิดกล่องแล้วยังแก้ค้างอยู่ |
| F4 | undo / redo (Cmd+Z / ปุ่ม) | ยังทำงาน |
| F5 | `/media-workspace/layouts` | Folders / Tags rail ยังกรองได้ |
| F6 | เปิด DevTools Console ตลอดการทดสอบ | **ไม่มี error สีแดง** — ถ้ามี copy มาให้ด้วย |

## G. สรุปที่อยากได้กลับ

- ตาราง PASS/FAIL ต่อข้อ + ที่ FAIL ขอ screenshot หรือข้อความ error
- ผล SQL ของ §E
- console error ทั้งหมด (ถ้ามี)

## H. ⚠️ Cleanup — **อย่าเพิ่งลบเอง**

ของที่สร้างระหว่างเทสขึ้นต้น `zz-ux-` ทั้งหมด (compositions / layouts / inline playlists)
การลบข้อมูลเป็น R0 — บอกมาว่าเทสเสร็จ เดี๋ยวผมดึงรายการจริงมาโชว์ก่อนแล้วค่อยขออนุมัติลบ
เหมือนรอบ `zz-t28-` / `zz-e1-` (55 แถว) เมื่อเช้า
