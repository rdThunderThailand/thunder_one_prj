# Browser checklist — Playlist Type & Output Profile (ticket 86d3xxkab)

**คู่กับ:** `.docs/SESSIONLOG-playlist-output-profile-2026-08-20.md`, `docs/adr/0032-playlist-output-profile.md`
**ครอบคลุม:** 4.1 Playlist Type, 4.2 Resolution, 4.3 Frame Rate ฝั่ง frontend (4.4 และ "API ปฏิเสธค่าที่ไม่รองรับ" ต้อง deploy Thunder_Core ก่อน — ไม่อยู่ใน checklist นี้)
**วันที่:** 2026-08-20 · branch `feat/playlistOverview`

## เตรียม

```bash
pnpm dev            # อย่าใช้ npm — pnpm เท่านั้น
```

เปิด `http://localhost:3000/playlists` ล็อกอินให้เรียบร้อย
เปิดแท็บ Network ค้างไว้ตลอด (ใช้ยืนยัน A3, C1)
**ก่อนเริ่ม จด playlist ที่มีอยู่แล้ว 1 ตัว** (สร้างก่อนวันนี้) ไว้ใช้ในบล็อก B — จะใช้ตัวไหนก็ได้ที่เห็นในรายการตอนนี้

---

## A. 4.1 Playlist Type — เหลือแค่ Standard

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| A1 | เปิด `/playlists/create` (ล้าง draft เก่าถ้ามีเตือน resume) | Field **Playlist Type** เป็น dropdown | |
| A2 | คลิกเปิด dropdown Playlist Type | เห็น **แค่ตัวเลือกเดียว: Standard** — ไม่มี Dynamic/Loop/Manual โผล่มาอีก | |
| A3 | พิมพ์ชื่อ playlist แล้วดู Summary ด้านขวา | **Playlist Type = Standard** ตรงกับ dropdown | |

---

## B. 4.2 Resolution — label มีสัดส่วนครบ + ของเก่าเปิดได้ไม่พัง

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| B1 | ที่ `/playlists/create` เปิด dropdown **Resolution** | เห็น 4 ตัวเลือก: `1920 × 1080 (16:9)`, `1080 × 1920 (9:16)`, `3840 × 2160 (16:9)`, `1280 × 720 (16:9)` — **สังเกต 3840×2160 ตอนนี้ต้องบอก (16:9) ไม่ใช่ (4K)** เหมือนก่อนแก้ | |
| B2 | เลือก `3840 × 2160 (16:9)` แล้วดู Summary ขวา | Resolution แสดง `3840 × 2160 (16:9)` | |
| B3 | เปิด playlist เก่าที่จดไว้ตอนเตรียม (ตัวที่สร้างก่อนวันนี้) ผ่าน `/playlists/[id]` หรือ side panel | เปิดได้ปกติ **description, campaign, tags, cover ยังอยู่ครบ** — นี่คือจุดที่พังได้ถ้า metadata version ไม่ตรง | |
| B4 | ดู Resolution ของ playlist เก่าตัวนั้น (ใน Detail page และใน side panel) | แสดงเป็น label มีสัดส่วน เช่น `1920 × 1080 (16:9)` ไม่ใช่ raw string `1920x1080` เฉยๆ — ถ้าตัวนี้ไม่เคยตั้ง resolution มาก่อนจะโชว์ `—` ก็ปกติ | |

---

## C. Payload จริงที่ยิงออกไป — width/height เป็นตัวเลข

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| C1 | เข้า `/playlists/create` ใหม่ ตั้งชื่อ, เลือก Resolution `1920 × 1080 (16:9)`, กด **Save Draft** | ดู request POST `/api/proxy/media/playlists` ใน Network → เปิด payload ดู `metadata.info` | |
| C2 | ตรวจ payload | มี `"resolution":"1920x1080"`, `"width":1920`, `"height":1080` — **width/height ต้องเป็นตัวเลข (ไม่มีเครื่องหมายคำพูดล้อม) ไม่ใช่ string** | |

---

## D. 4.3 Frame Rate — ค่าเดิม ไม่มีอะไรเปลี่ยนแต่เช็คซ้ำกันพัง

| # | ทำ | ผลที่คาดหวัง | ผ่าน? |
|---|---|---|---|
| D1 | ที่ Step 1 เปิดดู **Frame Rate** | ค่าเริ่มต้น `30 fps`, เปลี่ยนได้เป็น 24/25/30/60 | |
| D2 | เปลี่ยนเป็น `60 fps` ดู Summary ขวา | Frame Rate = `60 fps` ตรงกัน | |

---

## รายงานกลับ

ตอบกลับแค่หมายเลขที่ **ไม่ผ่าน** + สิ่งที่เห็นจริงก็พอ ที่เหลือถือว่าผ่าน
ถ้าติดตรงไหนจนเดินต่อไม่ได้ บอกข้อนั้นแล้วข้ามบล็อกนั้นไปได้เลย

**B3/B4 คือจุดเสี่ยงที่สุด** — ถ้าพัง (playlist เก่าเปิดแล้วข้อมูลหาย) คือ metadata backward-compat มีปัญหาจริง ต้องแจ้งกลับทันที อย่าข้าม
