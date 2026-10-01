# Browser verification checklist — 2026-08-26

ครอบสองบั๊ก: **Back/Forward ของ filter** (สามหน้า) และ **duplicate-name แสดงข้อความไทย**

กรอกผลในคอลัมน์ขวาแล้วส่งกลับมา — ข้อไหนไม่ตรงที่คาดให้บอกว่าเห็นอะไรแทน

---

## สภาพแวดล้อม — เช็คแล้ว 2026-08-26 08:50 พร้อมใช้ ไม่ต้องตั้งอะไรเพิ่ม

| | สถานะ |
|---|---|
| frontend `localhost:3000` | ✅ ตอบ HTTP 307 |
| backend `localhost:3001` | ✅ ตอบ HTTP 200 |
| frontend proxy ชี้ไปที่ | `http://localhost:3001` (**ไม่ใช่** vercel) |
| backend ต่อ DB | **production Supabase** |
| migration duplicate-name | ✅ apply production แล้ว — **มีผลทันที ไม่ต้อง deploy** |

> ⚠️ **การเขียนทุกอย่างลง production จริง** — เช็คลิสต์นี้ออกแบบให้**ไม่สร้าง record ใหม่เลย**
> ข้อ D สร้าง Layout ชื่อซ้ำซึ่ง**ต้อง fail และ rollback** ถ้าเผลอสร้างสำเร็จแปลว่าเทสต์ตก
>
> **ห้ามแก้/ลบ Layout ที่มีอยู่: `Browser Verify Layout 2026-08-25` (`413d7b1f-b1f5-4c97-b5b0-8616d537570b`)**
> — ตอนนี้มี Layout ใน production แค่ตัวเดียวนี้

---

## A. Layouts — `http://localhost:3000/media-workspace/layouts`

| # | ทำ | คาดว่าจะเห็น | ผล |
|---|---|---|---|
| A1 | เปลี่ยน status filter เป็น `Active` | URL ขึ้น `?status=active` · rows กรองแล้ว | |
| A2 | กด **Back** | URL กลับเป็น `/media-workspace/layouts` เปล่า · **dropdown กลับเป็น All** · rows กลับครบ | |
| A3 | กด **Forward** | กลับไป `?status=active` · dropdown เป็น Active · rows กรองอีกครั้ง | |
| A4 | พิมพ์ `brow` ในช่องค้นหา **รวดเดียวไม่หยุด** | URL ขึ้น `?q=brow` · rows กรองตามชื่อ | |
| A5 | กด **Back ครั้งเดียว** | ช่องค้นหา**ว่างทันที** ไม่ใช่ต้องกด 4 ครั้งทีละตัวอักษร | |
| A6 | คลิกหัวคอลัมน์ `Name` เพื่อ sort | URL ขึ้น `?sort=name&dir=asc` | |
| A7 | คลิก `Name` ซ้ำ | `dir=desc` | |
| A8 | กด **Back** สองครั้ง | ย้อนทีละขั้น: `dir=asc` → ไม่มี sort param | |
| A9 | ตั้ง filter ไว้ แล้ว **refresh (⌘R)** | ได้ view เดิมเป๊ะ ทั้ง URL, control และ rows | |
| A10 | เคลียร์ filter ทั้งหมดกลับ default | URL **สะอาด ไม่มี `?` ห้อยท้าย** | |

## B. Playlists — `http://localhost:3000/media-workspace/playlists`

ทำ B1–B10 แบบเดียวกับ A ทุกข้อ **บวกอีกข้อ**:

| # | ทำ | คาดว่าจะเห็น | ผล |
|---|---|---|---|
| B1–B10 | เหมือน A1–A10 | เหมือนกัน | |
| B11 | สลับ tab `Mine` ↔ `All` แล้วกด **Back** | tab กลับอันเดิม **และ rows เปลี่ยนตาม** | |

## C. Channels — `http://localhost:3000/media-workspace/channels`

| # | ทำ | คาดว่าจะเห็น | ผล |
|---|---|---|---|
| C1–C10 | เหมือน A1–A10 (filter ที่นี่คือ category กับ lifecycle) | เหมือนกัน | |
| C12 | **โดยเฉพาะข้อ A10** — เคลียร์กลับ default | URL **ต้องไม่เหลือ `?` เปล่าห้อยท้าย** (บั๊กเดิมของหน้านี้ที่เพิ่งแก้) | |

---

## D. Duplicate name — `http://localhost:3000/media-workspace/layouts`

| # | ทำ | คาดว่าจะเห็น | ผล |
|---|---|---|---|
| D1 | กด **New Layout** → เลือก template ไหนก็ได้ | เข้า editor เห็น zones | |
| D2 | ตั้งชื่อให้ตรงเป๊ะว่า `Browser Verify Layout 2026-08-25` | — | |
| D3 | กด **Save** | ขึ้นข้อความ **`ชื่อนี้ถูกใช้ไปแล้ว กรุณาตั้งชื่ออื่นแล้วลองใหม่`** ไม่ใช่ "Media operation failed" และไม่ใช่ error ดิบของ Postgres | |
| D4 | กลับไปหน้า list แล้วดูจำนวน Layout | **ยังมีตัวเดียวเหมือนเดิม** ไม่มีตัวใหม่โผล่ | |

> ถ้า D3 ขึ้นว่า `Media operation failed` แปลว่า backend ที่รันบน 3001 ยังไม่ได้ restart
> หลัง migration — ปิดแล้วเปิดใหม่ (`pnpm dev` ใน `Thunder_Core`) แล้วลอง D1–D4 อีกรอบ

---

## ไม่ต้องทดสอบ

- **multi-row sort** — รับหลักฐานจาก `list-filtering.check.mts` ที่ผ่านแล้ว **ไม่ต้องสร้าง Layout ตัวที่สอง**
- **แก้/archive/restore Layout เดิม** — นอกขอบเขตรอบนี้ และห้ามแตะ record production

---

## สรุปกลับมาแค่นี้พอ

1. ข้อไหน **ตก** บ้าง (เลขข้อ + เห็นอะไรแทน)
2. ถ้าผ่านหมด บอกว่า "ผ่านหมด" ก็พอ

ผลที่ได้จะเอาไปติ๊ก `docs/layouts/plan-layout-execution.md` Task 8 Step 3 และเขียน SESSIONLOG ต่อ
