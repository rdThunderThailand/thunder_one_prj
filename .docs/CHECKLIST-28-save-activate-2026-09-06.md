# Checklist — #28 Save / Activate / first-save recovery

Branch `feat/layoutV2` · `thunder_one_prj` เท่านั้น (ไม่แตะ backend)
ทุกข้อทำที่ `http://localhost:3000/media-workspace/layouts`

> **หมายเหตุ:** dev server ชี้ `CORE_API_URL` ไป develop ตาม `.env` เดิม — แถวที่สร้างจาก
> checklist นี้ลงฐาน **develop** ข้อ F บอกวิธีเก็บกวาด

---

## A. Split button (ADR 0063 §8)

| # | ทำ | คาดว่าจะเห็น |
|---|---|---|
| A1 | เปิด `/media-workspace/layouts` → **Create Layout** → เลือก preset ใดก็ได้ | เข้าหน้า editor, badge มุมบนซ้ายใต้ชื่อ = **`Unsaved`** |
| A2 | ดูแถวปุ่มขวาบน | `Cancel` · `Preview` · `Open full preview` · `Use in Program →` · `Save Layout` ที่มีปุ่ม `▾` ติดกันเป็นปุ่มเดียว — **ต้องไม่มีปุ่ม `Publish` และไม่มี `Import Layout`** |
| A3 | ยังไม่กรอกชื่อ → hover `Save Layout` | ปุ่มเทา, tooltip `กรุณากรอกชื่อ Layout` |
| A4 | กรอกชื่อ เช่น `zz-t28-a` → กด `▾` | เมนูเปิดลงมา 2 รายการ: `Save as draft`, `Save & Activate` |
| A5 | hover `Save & Activate` (ยังไม่ผูก Content) | เทา, tooltip `ยังไม่ได้ผูก Content ให้ N Zone: <ชื่อ Zone>` — **ต้องมีตัวเลข N** |
| A6 | กดที่ว่างนอกเมนู / กด Tab ออก | เมนูปิดเอง |
| A7 | ผูก Content ครบทุก Zone (เลือก asset ในแท็บ Content ของทุก Zone) → เปิด `▾` อีกครั้ง | `Save & Activate` กดได้แล้ว (ไม่เทา) |

## B. เจตนาของ bug ที่ absorb เข้ามา — geometry ก่อน save แรก

> เดิม drag/Split/align/duplicate ก่อนกด Save ครั้งแรก **หายเงียบ** ทั้งบนจอและในสิ่งที่บันทึก

| # | ทำ | คาดว่าจะเห็น |
|---|---|---|
| B1 | **Create Layout → Start from scratch** (ไม่ใช่ preset) → ตั้งชื่อ `zz-t28-b` | canvas มี Zone เดียวเต็มจอชื่อ `Main` |
| B2 | กด **Split Zone** 1 ครั้ง | เห็น 2 Zone บน canvas |
| B3 | ลาก Zone หนึ่งให้ขนาด/ตำแหน่งเปลี่ยนชัดเจน แล้วกด align สักปุ่ม | ภาพเปลี่ยนตามและ **ไม่เด้งกลับ** |
| B4 | กด `Save Layout` | บันทึกผ่าน, badge เปลี่ยนเป็น `Last saved HH:MM` |
| B5 | กลับไป `/media-workspace/layouts` แล้วเปิด `zz-t28-b` ใหม่ | **geometry ตรงกับ B2–B3 เป๊ะ** (2 Zone, ตำแหน่งที่ลาก/align ไว้) ← ข้อนี้คือหัวใจ ถ้าเห็น Zone เดียวเต็มจอ = ยังพัง |

## C. Recovery — ล้มกลางทาง 3b (ข้อสำคัญที่สุดของ ticket)

เตรียม DevTools → tab **Network** → dropdown throttling

| # | ทำ | คาดว่าจะเห็น |
|---|---|---|
| C1 | Create Layout → preset ที่มี **3 Zone** → ตั้งชื่อ `zz-t28-c` | canvas 3 Zone |
| C2 | ผูก Content ทั้ง 3 Zone ด้วยการ **เลือก asset** (แท็บ Content → เลือกไฟล์ ไม่ใช่เลือก Playlist ที่มีอยู่) | ทั้ง 3 Zone ไม่ขึ้น badge unbound |
| C3 | กด `Save Layout` **แล้วสลับ Network เป็น `Offline` ทันทีระหว่างที่ปุ่มยังขึ้น `กำลังบันทึก...`** (ถ้าเร็วไม่ทัน ใช้ throttling `Slow 3G` ก่อนค่อยกด Save แล้วตัดตอนกลางทาง) | แถบแดงขึ้นข้อความภาษาไทย **ไม่ใช่ error ดิบจาก DB/Postgres** |
| C4 | สลับ Network กลับ `No throttling` → กด `Save Layout` **ซ้ำ** | บันทึกผ่าน |
| C5 | ส่ง SQL นี้ให้ผมรัน (หรือรันเองบน develop) | ต้องได้ **3 แถว ไม่ใช่ 5 หรือ 6** |

```sql
select count(*) from media_core.playlists
where kind = 'inline' and name like 'zz-t28-c%';
```

## D. Recovery — ล้มที่ step 2 (layouts row ซ้ำ)

| # | ทำ | คาดว่าจะเห็น |
|---|---|---|
| D1 | Create Layout → **Start from scratch** → ชื่อ `zz-t28-d` | canvas 1 Zone |
| D2 | กด `Save Layout` แล้วตัดเน็ตให้ล้มระหว่างทาง (เหมือน C3) | ขึ้น error |
| D3 | ต่อเน็ต → `Save Layout` ซ้ำ | บันทึกผ่าน |
| D4 | ส่ง SQL นี้ให้ผมรัน | ต้องได้ **1 แถว ไม่ใช่ 2** |

```sql
select count(*), array_agg(kind) from media_core.layouts where name = 'zz-t28-d';
```

## E. Save as Template · Use in Program · revision conflict

| # | ทำ | คาดว่าจะเห็น |
|---|---|---|
| E1 | เปิด `zz-t28-b` → กด `Save as Template` | เด้งไป `/media-workspace/layouts/templates` และมีแถวชื่อ `zz-t28-b` อยู่ในลิสต์ |
| E2 | เปิด Layout ที่ **ยังไม่เคยเซฟ** (Create ใหม่) → hover `Use in Program →` | เทา, tooltip `บันทึก Layout ก่อนนำไปใช้ใน Program` |
| E3 | เปิด `zz-t28-c` (เซฟแล้ว) → กด `Use in Program →` | ไป wizard `/media-workspace/publications/create?compositionId=…`, อยู่ **step 1**, ช่อง type = **Layout**, ช่อง Layout เลือก `zz-t28-c` ไว้แล้ว |
| E4 | เปิด `zz-t28-c` ใน **2 แท็บ** → แท็บ 1 เปลี่ยนชื่อ + Save → แท็บ 2 (ยังค้างของเก่า) เปลี่ยนอะไรก็ได้ + Save | แท็บ 2 ขึ้น **`Composition นี้ถูกแก้ไขจากที่อื่น กรุณาโหลดใหม่แล้วลองอีกครั้ง`** — ไม่ใช่ข้อความ DB ดิบ |
| E5 | เปิด Composition ที่ status = **Active** → กด `▾` | `Save as draft` เทา, tooltip `Composition นี้เปิดใช้งานแล้ว ย้อนกลับเป็น Draft ไม่ได้` |

## F. เก็บกวาด (R0 — ผมจะไม่ลบเองจนกว่าจะอนุมัติ)

ส่งผลข้อ C5/D4 กลับมา แล้วผมจะ:
1. list แถวจริงทั้งหมดที่ชื่อขึ้นต้น `zz-t28-` (compositions, layouts, playlists) ให้ดูก่อน
2. รอคุณอนุมัติ แล้วค่อยลบ

---

## รายงานกลับ

ตอบสั้นๆ ได้เลย เช่น `A ผ่านหมด · B5 ผ่าน · C5 = 3 · D4 = 1 · E ผ่านหมด` หรือระบุข้อที่ตก + สิ่งที่เห็นจริง
