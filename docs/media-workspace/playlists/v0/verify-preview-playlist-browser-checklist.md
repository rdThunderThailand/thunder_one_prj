# Browser checklist — Playlist Detail Page + Step 5 Preview

**คู่กับ:** `docs/adr/0020-playlist-detail-page.md`
**ครอบคลุม:** `/playlists/[playlistId]`, การ navigate จาก `/playlists`, และ Content Preview ของ playlist ใน Create Publication Step 5
**วันที่:** 2026-08-17 · branch `feat/preview/playlist`

## เตรียม

```bash
pnpm dev            # อย่าใช้ npm — pnpm เท่านั้น
```

ต้องมี playlist อย่างน้อย 1 อันที่ **status ไม่ใช่ draft** และมี item อย่างน้อย 2 ตัว (1 วิดีโอ + 1 รูป ถ้ามี) — ถ้ายังไม่มีให้สร้างผ่าน `/playlists/create` ก่อน แล้วเปลี่ยนเป็น Active

เปิด DevTools ค้างไว้ทั้ง Network และ Console

---

## A. Navigate จาก `/playlists`

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| A1 | ไป `/playlists` | เห็นตาราง ไม่มี panel ด้านขวาแบบเดิม | |
| A2 | คลิกที่แถว playlist ใดก็ได้ | เด้งไป `/playlists/<id>` (URL เปลี่ยนจริง ไม่ใช่แค่เปิด panel) | |
| A3 | กด back ของ browser | กลับมาที่ `/playlists` ตามปกติ | |

---

## B. หน้า Playlist Detail — โครงและ properties

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| B1 | เปิด `/playlists/<id>` ของ playlist ที่มี cover | กรอบพรีวิวซ้ายบนโชว์รูป/thumbnail cover (ไม่ว่าง) | |
| B2 | ดู header | title = ชื่อ playlist, subtitle = "N items · MM:SS", ปุ่ม กลับ / Edit Playlist / Archive หรือ Activate | |
| B3 | ดูการ์ด Properties | มีครบ: Playlist Type, Items, Total Duration, Resolution, Frame Rate, Play Mode, Repeat, Transition, Media Fit, Audio, Created By (**ไม่มี** Created At — ตั้งใจ ดู ADR 0020) | |
| B4 | ถ้า playlist มี description | โชว์เป็นย่อหน้าใต้เส้นคั่นล่างสุดของการ์ด Properties | |

---

## C. ตาราง Media Content

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| C1 | ดูตารางฝั่งขวา | คอลัมน์ #, Name (มี thumbnail), Resolution, Size, Length, Transition ครบทุกแถว | |
| C2 | ถ้ามี item ที่ไม่มี `title` | คอลัมน์ Name โชว์ชื่อไฟล์จริง **ไม่ใช่** UUID ดิบ | |
| C3 | ถ้า asset เป็นของเก่าก่อน ADR 0019 (อัปโหลดนานแล้ว) | คอลัมน์ Resolution ของแถวนั้นเป็น `—` ไม่ error | |
| C4 | ดูแถว Total ท้ายตาราง | โชว์ `N Files · <ขนาดรวม> · <เวลารวม>` ตรงกับ subtitle บน header | |
| C5 | เอาเมาส์ชี้ค้างที่แถว Total ถ้ามีไฟล์ที่หา asset ไม่เจอ | ขนาดรวมมี `+` ต่อท้าย พร้อม tooltip ว่านับไม่ครบ (ข้ามได้ถ้าไม่มีกรณีนี้) | |

---

## D. เล่นในกรอบพรีวิว

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| D1 | คลิกแถวที่เป็นวิดีโอในตาราง | กรอบซ้ายบนเปลี่ยนเป็น `<video>` เล่นได้จริง มี controls (play/pause/seek) | |
| D2 | คลิกแถวที่เป็นรูปภาพ | กรอบซ้ายบนเปลี่ยนเป็นรูปนิ่ง ไม่มี controls | |
| D3 | คลิกแถวเดิมซ้ำ หรือคลิกแถวอื่นขณะวิดีโอกำลังเล่น | สลับไปเล่น/แสดงตัวใหม่ทันที ไม่ค้างเฟรมเก่า | |

---

## E. Loading / Error states

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| E1 | เปิด `/playlists/<uuid-ที่ไม่มีจริง>` | โชว์ข้อความ "ไม่พบ" พร้อมปุ่มกลับไปยังรายการ ไม่ error ทั้งหน้า | |
| E2 | ปิด/บล็อก network ชั่วคราวแล้วเปิดหน้า (หรือดู throttle ใน DevTools) | ระหว่างโหลดโชว์ "กำลังโหลด..." ไม่ใช่หน้าเปล่า | |
| E3 | เปิด playlist ของ tenant อื่น (ถ้าทดสอบได้) | ขึ้นข้อความไม่มีสิทธิ์ (`NoAccess`) ไม่ใช่ 404 | |

---

## F. Edit / Archive-Activate

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| F1 | กด "Edit Playlist" | เด้งไป `/playlists/create?id=<id>` โหลดข้อมูลเดิมเข้ามาถูกต้อง | |
| F2 | กลับมาหน้า detail แล้วกด Archive (หรือ Activate) | สถานะเปลี่ยนทันที badge อัปเดต ไม่ error | |
| F3 | เปิด playlist ที่ status เป็น draft | **ไม่มี** ปุ่ม Archive/Activate | |

---

## G. Step 5 Content Preview (Create Publication)

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| G1 | `/publications/create` → Basic Info เลือก Publication Type = **Playlist** → Content เลือก playlist ที่มี item → เดินไป step 5 Review & Publish | การ์ด "Content Preview" ซ้ายบน โชว์ cover thumbnail ของ playlist (ไม่ใช่ว่างเหมือนก่อนแก้) | |
| G2 | ดูแถว "Playlist" ในการ์ดเดียวกัน | มีชื่อ playlist เป็นลิงก์สีน้ำเงิน + badge สถานะ + "N items · MM:SS" | |
| G3 | คลิกชื่อ playlist | เปิดแท็บใหม่ไป `/playlists/<id>` **ไม่มี** popup ยืนยันออกจากหน้า wizard | |
| G4 | กลับมาแท็บ wizard เดิม | step/ข้อมูลที่กรอกไว้ยังอยู่ครบ ไม่ถูกรีเซ็ต | |
| G5 | เปลี่ยน Publication Type กลับเป็น Video/Image แล้วเลือกไฟล์ | การ์ด Content Preview กลับไปแสดงแบบเดิม (File row + dimensions/duration) ไม่ใช่แบบ Playlist | |

---

## H. Step 4 Publication Summary (Create Publication) — เพิ่มทีหลัง

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| H1 | จาก step Content (playlist type, เลือก playlist ที่มี item ไว้แล้ว) เดินไป step 4 Schedule | การ์ด "Publication Summary" ด้านขวา โชว์ cover thumbnail ของ playlist แทนกล่อง dashed "Content preview will appear here" | |
| H2 | ดูแถว "Content" ใน dl ใต้รูป | โชว์ `<ชื่อ playlist> (MM:SS)` ไม่ใช่ "—" | |
| H3 | เปลี่ยน Publication Type กลับเป็น Video/Image แล้วเลือกไฟล์ | Step 4 preview กลับไปแสดงแบบเดิม (รูป/วิดีโอของไฟล์ที่เลือก) | |
| H4 | ย้อนกลับไป step Content เปลี่ยน playlist ที่เลือกเป็นตัวอื่น แล้วมา step 4 อีกครั้ง | preview อัปเดตเป็น cover/ชื่อของ playlist ใหม่ ไม่ค้างของเก่า | |

---

## I. Step 5 — Created by (เพิ่มทีหลัง)

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| I1 | เดินจน step 1 save สำเร็จ (publication ถูกสร้างจริง) ไปจนถึง step 5 Review & Publish | การ์ด Content Preview บรรทัดล่างสุดโชว์ "Created by \<ชื่อจริงของคุณ\> · \<วันเวลาที่สร้างจริง\>" ไม่ใช่ "Kanittha W." ที่ hardcode ไว้ | |
| I2 | ดูบรรทัดเดียวกัน | **ไม่มี** "Last updated" อีกต่อไป (ตัดออกแล้ว เพราะ backend ไม่มี field นี้) | |
| I3 | กด Back ไปแก้ step 1-4 แล้วกลับมา step 5 อีกครั้ง | ชื่อ/วันที่ยังถูกต้อง ไม่กระพริบเป็นค่าอื่นระหว่างโหลด | |

---

## รายงานกลับ

ตอบกลับแค่หมายเลขที่ **ไม่ผ่าน** + สิ่งที่เห็นจริงก็พอ ที่เหลือถือว่าผ่าน
