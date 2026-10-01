# SESSIONLOG — time sync: signage doc, swagger, commit, PR (2026-08-24)

ต่อจาก `SESSIONLOG-time-sync-prod-apply-2026-08-24.md` — เซสชันนั้นจบที่ migration apply ลง prod
แล้วและรอผลเทส UI เซสชันนี้รับผล UI, เขียนเอกสารให้ทีม signage, อัปเดต swagger, commit และเปิด PR

## ผลเทส UI ที่ผู้ใช้รันเอง (checklist ข้อ 1–6)

ทั้ง 6 ข้อผ่าน — checkbox แสดงและ default ไม่ติ๊ก, สร้าง `zz-uitest-sync-on` เป็น Draft สำเร็จ
(`0013c7ba-dc20-459c-b850-cf032b57a119`), เปิด Edit ค่ายังติ๊ก, ปิดแล้วบันทึกอ่านกลับเป็น `false`,
Channel เก่าไม่ติ๊กและกดบันทึก no-op ได้, หน้า list ปกติ console สะอาด

ข้อ 7 (สร้าง Publication เพิ่มเพื่อดู direct-target conflicts ด้วยข้อมูลจริง) ข้ามตาม scope

## ที่ทำเซสชันนี้

1. **`Thunder_Core/docs/media/player-time-sync-integration.md`** (ใหม่) — คู่มือฝั่ง signage/player
   ภาษาไทยตามสไตล์ `media-api-integration.md`: 2 ฟิลด์ใหม่ใน poll, สูตร phase + ขั้นตอน seek,
   2 ฟิลด์ telemetry ใน heartbeat, สิ่งที่ไม่รับประกัน, direct-target guard, สถานะ deploy
2. **`Thunder_Core/public/swagger-core-v1.json`** — แก้ `/media/player/jobs` (description +
   example เพิ่ม `server_now`/`sync_enabled`) และ `/media/player/heartbeat` (description +
   requestBody 2 property + response example) แก้แบบ text patch ไม่ re-dump ทั้งไฟล์เพราะไฟล์นี้
   จัดรูปด้วยมือ (บาง object เขียนบรรทัดเดียว) diff ออกมา 9 บรรทัด
3. **commit ทั้งสอง repo** และ **เปิด PR เป็น Draft ทั้งคู่** (ภาษาไทยตามที่ผู้ใช้เลือก)

## PR ที่เปิด

| repo | PR | base |
|---|---|---|
| Thunder_Core | https://github.com/rdThunderThailand/Thunder_Core/pull/36 | `develop` |
| thunder_one_prj | https://github.com/rdThunderThailand/thunder_one_prj/pull/14 | `main` |

ทั้งคู่เป็น **Draft** เพราะ verify ยังไม่ครบ (ข้อ 7 ข้าม, ยังไม่มี player จริงเล่นแบบ sync)
ผู้ใช้เป็นคนกด ready เอง

## ข้อเท็จจริงที่ยืนยันแล้ว — อย่า re-derive

- **channels API ไม่มีอยู่ใน swagger เลย** ทั้ง `swagger.json` และ `swagger-core-v1.json`
  ไม่มี path หรือ schema ที่มีคำว่า channel — จึงไม่มีอะไรให้อัปเดตเรื่อง `sync_enabled` ฝั่ง
  dashboard API การจะเพิ่มเข้าไปคือการ document channels API ทั้งชุด ไม่ใช่ scope ของงานนี้
- **`GET /media/player/server-time`** เป็นของ spike ตอนวัดผล ADR 0041 ไม่ใช่ส่วนหนึ่งของ protocol
  ADR 0042 — เขียนกำกับไว้ในคู่มือ player แล้ว
- checks ที่รันจริงเซสชันนี้: `schema.check.mts` (Thunder_Core) และ `*.check.mts` 4 ไฟล์ใน
  thunder_one_prj ผ่านหมด exit 0

## ค้างไว้

- **`zz-uitest-sync-on` ยังอยู่บน prod** ยังไม่ได้ลบ (R0 ต้องขออนุมัติ) — เขียนหมายเหตุไว้ใน PR body แล้ว
- **footer หน้า Channels แสดง `Showing 1 to 4 of 4 playlists`** ควรเป็น `channels` — เจอตอนเทส UI
  ไม่แก้ตาม no scope creep ยังไม่มีใครรับไป
- ยังไม่มีใครวัด `phase_error_ms` จริง จนกว่าจะมี player implement ตามคู่มือ

## รวม PR (ทำหลังเปิด PR)

ทั้งสอง repo มี PR เก่าค้างอยู่ ตรวจแล้วพบว่า branch เก่าเป็น **ancestor ตรงๆ** ของ `feat/timesync`
ทั้งคู่ (`git merge-base --is-ancestor` = true) — commit ของ PR เก่าอยู่ใน PR ใหม่ครบแล้ว ไม่ต้อง
merge/rebase อะไรเพิ่ม จึงรวมโดยการเติมเนื้อหาของ PR เก่าเข้า body ของ PR ใหม่ แล้วปิด PR เก่า

- thunder_one_prj: #13 (`feat/pubcheck`) → ปิด รวมเข้า **#14**
- Thunder_Core: #35 (`feat/channel`) → ปิด รวมเข้า **#36**

**ค้างไว้เพิ่ม:** โค้ด clock-uncertainty spike ที่มาจาก #35 (`media_server_time` RPC +
`/media/player/server-time` + `scripts/clock-spike/`) ไม่มีใครเรียกอีกแล้วหลัง ADR 0042 เลือกใช้
`server_now` ใน poll แทน — ยังไม่ตัดสินว่าจะลบก่อน merge หรือปล่อยเข้า `develop` ไปก่อน
เขียนเป็น warning ไว้ใน body ของ #36 แล้ว
