# ตอบกลับ: ขนาด Canvas สำหรับ Windows Player

ตอบ handoff "Backend Handoff: ขนาด Canvas สำหรับ Windows Player" (13 พ.ย. 2026)
แก้เสร็จและขึ้น production แล้ววันที่ 13 พ.ย. 2026 (ThunderCore `v0.24.1`, PR Thunder_Core#382)

## สรุป

`POST /jobs` ส่ง `canvas_width_px`, `canvas_height_px` และ `canvas_mode` ใน `data.layout` แล้ว
ทั้งสามค่าอ่านจาก **snapshot ที่ส่งให้เครื่อง** งาน "lat krabang test" Publish ใหม่แล้ว
และ snapshot ใหม่มีค่า `896`, `512`, `native_top_left` ครบ เหลือให้ฝั่ง Player วัดกรอบจริงบน Windows

## สิ่งที่ทำตามที่ขอ

| ข้อที่ขอ | สิ่งที่ทำ |
| --- | --- |
| 1. เก็บขนาด canvas และโหมดใน snapshot ตอน Publish | เพิ่ม `canvas_width_px`, `canvas_height_px`, `canvas_mode` ใน `media_core.publication_snapshots` (nullable ไม่ backfill) ตอน Publish จะแตก `reference_resolution` ของ Layout ที่ใช้จริง (รวม inline layout) เป็นจำนวนเต็ม ไม่คำนวณจาก aspect ratio ฐานข้อมูลบังคับให้ขนาดมาคู่กันและเป็นบวก |
| 2. `/jobs` ส่งค่าจาก snapshot ทั้งตอนเตรียมเล่นและตอน active | `media_job_poll` อ่านสามค่าจาก snapshot ที่เครื่องได้รับ ทั้งตอน `activation_pending: true` และตอน active ใช้ path เดียวกัน แก้ Layout ทีหลังโดยไม่ Publish ใหม่ งานเดิมยังได้ขนาดเดิม |
| 3. ส่ง `native_top_left` เฉพาะงานที่ตั้งใจ | โหมดเป็นธงที่ตั้งราย Layout ไม่เปิดอัตโนมัติจาก `reference_resolution` (ทุก Layout บน production มี `reference_resolution` อยู่แล้ว) ตอนนี้ตั้งไว้ Layout เดียวคือของลาดกระบัง Layout อื่นได้ขนาดไปด้วยแต่ `canvas_mode: null` |
| 4. zone ยังเป็นเปอร์เซ็นต์ | ไม่แตะ `data.zones[]` `x/y/width/height` ยังเป็นเปอร์เซ็นต์ของ canvas |

## รูปแบบ response

ฟิลด์ใหม่สามตัวอยู่ใน `data.layout` ฟิลด์เดิมไม่เปลี่ยน

| ฟิลด์ | ชนิด | ความหมาย |
| --- | --- | --- |
| `canvas_width_px` | integer หรือ `null` | ความกว้าง canvas ตอน Publish |
| `canvas_height_px` | integer หรือ `null` | ความสูง canvas ตอน Publish |
| `canvas_mode` | `"native_top_left"` หรือ `null` | `native_top_left` = วาดขนาดจริงที่มุมซ้ายบนของจอหลัก, `null` = จัดวางตาม `aspect_ratio` แบบเดิม |

กติกาที่ฐานข้อมูลรับประกัน:

- ขนาดเป็น `null` ทั้งคู่ หรือเป็นจำนวนเต็มบวกทั้งคู่
- ถ้า `canvas_mode` ไม่ใช่ `null` จะมีขนาดมาด้วยเสมอ
- snapshot ที่สร้างก่อน 13 พ.ย. 2026 08:49 UTC ได้ `null` ทั้งสามช่อง

ค่าที่เครื่อง `testwindow 1` จะได้รับจาก production (ตัดฟิลด์อื่นออก):

```json
{
  "data": {
    "publication_snapshot_id": "f59abe78-0236-4a1e-94bc-8ee756ad7e9c",
    "layout": {
      "aspect_ratio": "7:4",
      "canvas_width_px": 896,
      "canvas_height_px": 512,
      "canvas_mode": "native_top_left"
    },
    "zones": [
      {
        "snapshot_zone_id": "0d60c25a-3124-4551-8c83-3d55df109175",
        "name": "Main",
        "x": 0,
        "y": 0,
        "width": 100,
        "height": 100
      }
    ]
  }
}
```

`snapshot_zone_id` เปลี่ยนจาก `4c7cade7-…` ใน handoff เพราะการ Publish ใหม่สร้าง snapshot ใหม่ (`013ca8e5-…` → `f59abe78-…`)
รูปแบบของ id ไม่เปลี่ยน

## ที่ฝั่ง Backend ทดสอบแล้ว

- develop (rollback ทุกครั้ง): Layout ที่ตั้งโหมดได้ snapshot ครบสามค่า Layout ที่ไม่ตั้งโหมดได้ขนาดแต่โหมดเป็น `null`
  แก้ `reference_resolution` หลัง Publish แล้ว snapshot เดิมยังได้ขนาดเดิม
- production: function ตรงกับเวอร์ชันที่ทดสอบ (เทียบ md5) `POST /jobs` ผ่าน HTTP ตอบ `200`
- production: snapshot ใหม่ของ "lat krabang test" มี `896 / 512 / native_top_left` และ Main zone เป็น `0/0/100/100`
- production: เรียก poll ในนามเครื่อง `testwindow 1` แล้ว rollback ได้ผลตามตัวอย่างข้างบน
  ตอนตรวจ เครื่องยังไม่ได้ poll เอง (target ยัง `pending`)

ยังไม่ได้ตรวจ: response ที่เครื่องได้จริงผ่าน HTTP และการวาดบน Windows

## ขอให้ฝั่ง Player ทดสอบ

1. ให้ `testwindow 1` poll งาน "lat krabang test" (snapshot `f59abe78-…`) โดย**ไม่ตั้ง LED override**
2. ตรวจว่า log มี `Fixed LED output 896x512 ... source=publication`
3. วัดกรอบจริง `896×512` ที่ `(0,0)` บน Windows `1920×1080` ที่ scaling 100% และ 125%
4. ตรวจงาน fullscreen/video wall เดิมและ snapshot เก่า (`canvas_mode: null`) ว่ายังจัดวางแบบเดิม
5. แจ้งผลกลับมา ถ้ากรอบไม่ตรง ให้แนบ response `/jobs` ดิบของเครื่องมาด้วย

## ข้อจำกัดตอนนี้

- **ยังไม่มีหน้าจอตั้งโหมด** ถ้ามีจอ LED แบบเดียวกันที่อื่น แจ้ง Backend ให้ตั้งธงราย Layout แล้ว Publish ใหม่
- **ถ้าแก้ Composition จนระบบสร้าง Layout ใหม่ ธงจะไม่ตามไปด้วย** งานนั้นจะได้ขนาดแต่ไม่มีโหมด
  ต้องแจ้ง Backend ให้ตั้งใหม่ (follow-up)
- **develop** (`thundercoredev.vercel.app`) มีการแก้นี้แล้วเช่นกัน ทดสอบบน develop ได้ แต่ต้องตั้งธงให้ Layout ทดสอบก่อน
  แจ้ง Backend ได้
