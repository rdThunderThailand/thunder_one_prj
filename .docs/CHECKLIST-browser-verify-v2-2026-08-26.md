# Browser verification checklist v2 — 2026-08-26

รอบนี้ทดสอบ **Back/Forward หลังแก้ root cause** และ **ปุ่ม Clear all ที่เพิ่งเพิ่ม**

> **Duplicate name (D1–D4) ผ่านไปแล้วรอบก่อน ไม่ต้องทำซ้ำ** — ไม่มีอะไรแตะโค้ดส่วนนั้น

---

## สิ่งที่เปลี่ยนจาก v1

**แก้บั๊กจริง 2 ตัว**
1. `isFirstRun` ถูกใช้ทิ้งผิดจังหวะ — เข้าหน้าด้วย URL สะอาดแล้ว mount ไม่ได้เขียนอะไร flag เลยค้าง
   ทำให้**การกดครั้งแรกของผู้ใช้กลายเป็น `replaceState`** กิน history entry เดียวที่ Back ต้องใช้
   → นี่คือสาเหตุของ A2/A5/A8, B2/B5/B11, C2/C5/C8 ทั้งหมด
2. เปลี่ยนหน้า (page 2→3) ล้วนๆ ถูกนับเป็น "search edit" เลยโดนยุบรวมกับ run ที่พิมพ์ก่อนหน้า

**แก้เช็คลิสต์ v1 ที่ผมเขียนผิดเอง**
- **C6/C7 ไม่ใช่บั๊ก** — Channels มี default sort เป็น `name/asc` (ต่างจาก Layouts/Playlists ที่เป็น `updated/desc`)
  คลิกหัว `Channel` ครั้งแรกจึงพลิกเป็น `desc` ถูกแล้ว และคลิกซ้ำกลับเป็น default → URL ว่าง ถูกแล้ว
  v1 ผมก๊อปความคาดหวังของ Layouts มาใช้โดยไม่ได้ดู default ก่อน

**เพิ่มของใหม่**
- **ปุ่ม `Clear all`** ในแถบ filter ทั้งสามหน้า — เดิม**ไม่มีปุ่มนี้เลย** มีแต่ลิงก์ในหน้าจอเปล่า
  (ตอนไม่มีผลลัพธ์) นี่คือเหตุผลจริงที่ A10/B10/C10 "ตก" ใน v1 — ไม่มีปุ่มให้กด
  ปุ่มจะ**โผล่เฉพาะตอนที่ state ไม่ใช่ default** และกดแล้ว reset **ทั้ง filter, sort, page, per-page
  และ tab** กลับ default → URL สะอาด

---

## สภาพแวดล้อม

เหมือนเดิม ทั้ง `localhost:3000` และ `localhost:3001` รันอยู่ **ถ้าเพิ่งดึงโค้ดใหม่ ให้ refresh หน้าเว็บก่อน**

> ⚠️ ยังเขียนลง production จริง — เช็คลิสต์นี้**ไม่สร้าง/ไม่แก้/ไม่ลบ record ใดๆ** ทั้งหมดเป็นการอ่านและกด filter
> **ห้ามแตะ Layout `Browser Verify Layout 2026-08-25`**

---

## A. Layouts — `http://localhost:3000/media-workspace/layouts`

**เริ่มจาก URL สะอาด** (ไม่มี `?`) ทุกครั้ง ถ้าไม่สะอาดให้กด `Clear all` ก่อน

| # | ทำ | คาดว่าจะเห็น | ผล |
|---|---|---|---|
| A1 | เปลี่ยน status → `Active` | URL `?status=active` · rows กรอง · **ปุ่ม `Clear all` โผล่** | |
| A2 | **Back** | URL กลับสะอาด · dropdown กลับ `All Status` · rows ครบ · ปุ่ม `Clear all` **หายไป** | |
| A3 | **Forward** | กลับไป `?status=active` · dropdown `Active` · rows กรอง | |
| A4 | (จาก URL สะอาด) พิมพ์ `brow` รวดเดียว | URL `?q=brow` | |
| A5 | **Back ครั้งเดียว** | ช่องค้นหา**ว่างทันที** URL สะอาด | |
| A6 | (จากสะอาด) คลิกหัว `Name` | `?sort=name&dir=asc` (default ของหน้านี้คือ `updated/desc` จึงได้ asc ก่อน) | |
| A7 | คลิก `Name` ซ้ำ | `?sort=name&dir=desc` | |
| A8 | **Back สองครั้ง** | ครั้งแรก → `dir=asc` · ครั้งที่สอง → **URL สะอาด และยังอยู่หน้า Layouts** (ไม่หลุดออกไปหน้าอื่น) | |
| A9 | ตั้ง filter ไว้ แล้ว **refresh** | ได้ view เดิมเป๊ะ | |
| A10 | ตั้ง `q` + `status` + `sort` ให้ครบ แล้วกด **`Clear all`** | URL **สะอาด ไม่มี `?` ห้อยท้าย** · ช่องค้นหาว่าง · dropdown กลับ All · sort กลับ default · ปุ่มหาย | |
| A11 | **Back** หลังกด Clear all | กลับไปสถานะที่มี filter ครบ (Clear all เป็นหนึ่ง history step) | |

## B. Playlists — `http://localhost:3000/media-workspace/playlists`

| # | ทำ | คาดว่าจะเห็น | ผล |
|---|---|---|---|
| B1–B11 | เหมือน A1–A11 | เหมือนกัน (default sort เป็น `updated/desc` เหมือน Layouts) | |
| B12 | สลับ tab `All` → `Mine` แล้ว **Back** | tab กลับ `All` **และ rows เปลี่ยนตาม** | |
| B13 | ลอง filter `Type` และ `Campaign` อย่างละครั้ง แล้ว **Back** | ค่าใน dropdown และ rows กลับของเดิมทั้งคู่ | |

> B8 (Back สองครั้งของ sort) รอบก่อนยังไม่ได้ตรวจ — รอบนี้ขอให้ตรวจด้วย

## C. Channels — `http://localhost:3000/media-workspace/channels`

| # | ทำ | คาดว่าจะเห็น | ผล |
|---|---|---|---|
| C1 | เปลี่ยน `Category` → `DOOH` | URL `?tab=dooh` · **ปุ่ม `Clear all` โผล่** | |
| C2 | **Back** | URL สะอาด · dropdown กลับ `All categories` · rows ครบ | |
| C3 | **Forward** | กลับไป `?tab=dooh` | |
| C4 | (จากสะอาด) พิมพ์ `screen` รวดเดียว | URL `?q=screen` | |
| C5 | **Back ครั้งเดียว** | ช่องค้นหาว่าง URL สะอาด | |
| C6 | (จากสะอาด) คลิกหัว `Channel` | `?sort=name&dir=desc` ← **ถูกต้องแล้ว** default ของหน้านี้คือ `name/asc` คลิกจึงพลิกเป็น desc | |
| C7 | คลิก `Channel` ซ้ำ | **URL กลับสะอาด** ← ถูกต้องแล้ว กลับเป็น default ที่ไม่ต้องเขียนลง URL | |
| C8 | **Back สองครั้ง** จาก C7 | ย้อนทีละขั้น และ**ยังอยู่หน้า Channels** ไม่หลุดออกไป | |
| C9 | ตั้ง filter แล้ว **refresh** | ได้ view เดิม | |
| C10 | ตั้ง `q` + category + lifecycle แล้วกด **`Clear all`** | URL **สะอาด ไม่มี `?` เปล่าห้อยท้าย** · ทุก control กลับ default | |
| C11 | ลอง category + lifecycle พร้อมกัน แล้ว **Back** | ย้อนทีละขั้น ค่าใน control ตรงกับ URL ทุกขั้น | |

---

## สิ่งที่ต้องดูเป็นพิเศษรอบนี้

1. **A8 / C8 — Back ครั้งสุดท้ายต้องยังอยู่ในหน้า list** ถ้าหลุดไป `layouts/create` หรือหน้าอื่น = บั๊กเดิมยังอยู่
2. **A5 / B5 / C5 — Back ครั้งเดียวต้องล้างช่องค้นหาหมด** ถ้าได้ `q=b` หรือ `q=bro` = การยุบ run ยังผิด
3. **A10 / C10 — ต้องไม่เหลือ `?` เปล่า** ท้าย URL

## สรุปกลับมาแค่นี้พอ

1. ข้อไหน **ตก** (เลขข้อ + เห็นอะไรแทน + URL ที่เห็นจริง)
2. ผ่านหมด → บอก "ผ่านหมด"
