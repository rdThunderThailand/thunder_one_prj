# Thunder One — System Flow

แผนภาพการติดต่อระหว่าง **Thunder One** (frontend), **Thunder_Core** (backend), และ **IoT Player** (เครื่องเล่น)

> อ้างอิงจาก code จริง ณ 2026-07-24 — media routes deploy ขึ้น production แล้ว

---

## 1. ภาพรวมระบบ — ใครคุยกับใคร

```mermaid
graph TB
    subgraph browser["🌐 Browser (ผู้ใช้)"]
        UI["Thunder One UI<br/>/login, /e2e"]
    end

    subgraph one["⚡ Thunder One — Next.js (BFF)"]
        AUTH["/api/auth/login<br/>/api/auth/logout"]
        PROXY["/api/proxy/[...path]"]
    end

    subgraph core["🔷 Thunder_Core — thundercore.vercel.app"]
        CAUTH["/api/core/v1/auth/*"]
        CMEDIA["/api/core/v1/media/*"]
        CPLAYER["/api/core/v1/media/player/*"]
    end

    subgraph sb["🗄️ Supabase"]
        DB[("Postgres<br/>media_core RPC")]
        ST["Storage<br/>(signed URL)"]
    end

    subgraph iot["📺 IoT Player (เครื่องเล่น)"]
        DEV["Player firmware"]
    end

    UI -->|"same-origin<br/>cookie to_at"| AUTH
    UI -->|"same-origin"| PROXY
    AUTH -->|"x-api-key (secret)"| CAUTH
    PROXY -->|"x-api-key + Bearer"| CMEDIA

    UI -.->|"PUT ไฟล์ตรง<br/>ไม่ผ่าน BFF"| ST

    DEV -->|"Bearer device_token<br/>ตรง ไม่ผ่าน Thunder One"| CPLAYER
    DEV -.->|"download ไฟล์ตรง"| ST

    CAUTH --> DB
    CMEDIA --> DB
    CPLAYER --> DB
    CMEDIA --> ST
    CPLAYER -->|"สร้าง signed URL 1 ชม."| ST

    style one fill:#fef3c7,stroke:#d97706
    style core fill:#dbeafe,stroke:#2563eb
    style iot fill:#dcfce7,stroke:#16a34a
    style sb fill:#f3e8ff,stroke:#9333ea
```

### จุดสำคัญ 3 ข้อ

1. **IoT ไม่คุยกับ Thunder One เลย** — ยิงตรงเข้า Thunder_Core ด้วย device token คนละเส้นทางกับฝั่ง web ทั้งหมด
2. **ไฟล์วิดีโอไม่วิ่งผ่าน BFF หรือ Thunder_Core** — ทั้ง upload และ download คุยกับ Supabase Storage ตรงผ่าน signed URL
3. **Thunder One เป็น BFF** — browser ไม่เคยเห็น `CORE_API_KEY` และไม่เคยเห็น JWT (อยู่ใน httpOnly cookie)

---

## 2. ใครใช้ auth แบบไหน

```mermaid
graph LR
    A["Browser<br/>(ผู้ใช้)"] -->|"cookie to_at<br/>(httpOnly)"| B["Thunder One BFF"]
    B -->|"x-api-key: CORE_API_KEY<br/>+ Authorization: Bearer user_jwt"| C["Thunder_Core"]
    D["IoT Player"] -->|"Authorization: Bearer device_token"| C

    style A fill:#e0e7ff
    style B fill:#fef3c7
    style C fill:#dbeafe
    style D fill:#dcfce7
```

| ผู้เรียก | Credential | ได้มาจาก | ใช้กับ |
|---------|-----------|---------|--------|
| Browser → BFF | cookie `to_at` (httpOnly) | login สำเร็จ | เส้นทางภายใน Thunder One |
| BFF → Core | `x-api-key` (app identity) | env `CORE_API_KEY` | `/media/*` ทุกเส้น |
| BFF → Core | `Bearer <user_jwt>` (user identity) | Supabase JWT จาก login | แนบเพิ่มเมื่อล็อกอินแล้ว |
| IoT → Core | `Bearer <device_token>` | `device_credentials.access_token` | `/media/player/*` เท่านั้น |

> ⚠️ device token กับ user JWT ใช้ header เดียวกัน (`Authorization: Bearer`) แต่**คนละ token คนละ endpoint** — IoT ห้ามใช้ `x-api-key`

---

## 3. Flow: ผู้ใช้ Login

```mermaid
sequenceDiagram
    actor U as ผู้ใช้
    participant B as Browser
    participant BFF as Thunder One<br/>/api/auth/login
    participant C as Thunder_Core
    participant SB as Supabase Auth

    U->>B: กรอก email + password
    B->>BFF: POST /api/auth/login<br/>{email, password}
    Note over BFF: CORE_API_KEY อยู่ฝั่ง server<br/>browser ไม่เคยเห็น
    BFF->>C: POST /api/core/v1/auth/login<br/>x-api-key + {email, password}
    C->>SB: signInWithPassword()
    SB-->>C: session (access_token, refresh_token)
    C-->>BFF: {data:{access_token, refresh_token,<br/>expires_at, user_id}}

    alt สำเร็จ
        Note over BFF: เก็บ token ลง httpOnly cookie<br/>to_at + to_rt
        BFF-->>B: 200 {ok:true}<br/>Set-Cookie: to_at, to_rt
        B->>B: redirect → /e2e
    else ผิด
        BFF-->>B: 401 {error:"..."}
        B->>U: แสดง error
    end
```

**หัวใจ:** response ที่กลับไป browser คือ `{ok:true}` เปล่า ๆ — **token ไม่เคยอยู่ใน body** อยู่ใน httpOnly cookie ที่ JS อ่านไม่ได้

---

## 4. Flow: อัปโหลดวิดีโอ + Publish

```mermaid
sequenceDiagram
    actor U as ผู้ใช้
    participant B as Browser
    participant P as Thunder One<br/>/api/proxy
    participant C as Thunder_Core
    participant ST as Supabase Storage

    U->>B: เลือกไฟล์วิดีโอ
    B->>P: POST /api/proxy/media/videos/upload-url<br/>{filename, mime_type, file_size_bytes}
    P->>C: + x-api-key
    C-->>P: {file_id, storage_key, upload_url}
    P-->>B: upload_url

    rect rgb(245, 230, 255)
        Note over B,ST: ไฟล์วิ่งตรง ไม่ผ่าน BFF/Core
        B->>ST: PUT <upload_url> (binary)
        ST-->>B: 200
    end

    B->>P: POST /api/proxy/media/videos<br/>{file_id, title, ...}
    P->>C: + x-api-key
    C-->>B: video created

    U->>B: กด Publish ไปยังจอ
    B->>P: POST /api/proxy/media/publish<br/>{playlist_id, targets}
    P->>C: + x-api-key
    Note over C: สร้าง publication +<br/>publish_job_targets (status=pending)<br/>ต่อ 1 เครื่อง
    C-->>B: publication created
```

> เหตุผลที่ proxy ไม่ต้องรองรับ binary — **ไฟล์ไม่เคยวิ่งผ่านมัน** ขอแค่ signed URL แล้ว browser ยิงตรงเข้า Storage

---

## 5. Flow: IoT Player (วงจรหลัก)

```mermaid
sequenceDiagram
    participant D as 📺 IoT Player
    participant C as Thunder_Core<br/>/media/player/*
    participant DB as Postgres RPC
    participant ST as Supabase Storage

    Note over D: ทุก request ใช้<br/>Authorization: Bearer device_token

    loop ทุก 60 วิ
        D->>C: POST /heartbeat<br/>{app_version, ip_address}
        C->>DB: media_heartbeat()
        Note over DB: connection_status = online<br/>last_heartbeat_at = now()
        C-->>D: {device_id, received_at}
    end

    loop ทุก 30–60 วิ
        D->>C: POST /jobs (ไม่มี body)
        C->>DB: media_job_poll()
        DB-->>C: jobs ที่ status=pending
        C->>ST: createSignedUrl(1 ชม.)
        ST-->>C: signed URL
        C-->>D: {device_id, jobs:[{target_id,<br/>playlist, items[].file.url}]}

        alt มีงาน
            D->>C: POST /jobs/{target_id}/ack<br/>{status:"downloading"}
            rect rgb(245, 230, 255)
                Note over D,ST: โหลดไฟล์ตรงจาก Storage
                D->>ST: GET file.url
                ST-->>D: video binary
            end
            D->>D: ตรวจ checksum

            alt โหลดสำเร็จ
                D->>C: POST /jobs/{target_id}/ack<br/>{status:"playing"}
                D->>D: เล่นตาม position
            else ล้มเหลว
                D->>C: POST /jobs/{target_id}/ack<br/>{status:"failed", error:"..."}
            end
        else jobs = []
            Note over D: ไม่ทำอะไร รอรอบถัดไป
        end
    end

    loop ทุก 1–5 นาที
        D->>C: POST /playback<br/>{logs:[{media_asset_id,<br/>played_at, duration_played_seconds}]}
        C->>DB: media_playback_log()
        C-->>D: {logged: n}
    end
```

---

## 6. End-to-end: จากอัปโหลดจนขึ้นจอ

```mermaid
sequenceDiagram
    actor U as ผู้ใช้
    participant ONE as Thunder One
    participant C as Thunder_Core
    participant ST as Storage
    participant D as 📺 IoT Player

    U->>ONE: 1. login
    U->>ONE: 2. upload วิดีโอ
    ONE->>ST: 3. PUT ไฟล์ (ตรง)
    U->>ONE: 4. สร้าง playlist
    U->>ONE: 5. publish → จอ A
    ONE->>C: 6. สร้าง job (pending)

    Note over C,D: ⏳ รอ player poll รอบถัดไป<br/>(server ไม่ push — pull เท่านั้น)

    D->>C: 7. poll jobs
    C-->>D: 8. job + signed URL
    D->>C: 9. ack "downloading"
    D->>ST: 10. download ไฟล์
    D->>C: 11. ack "playing"
    D->>D: 12. 🎬 เล่นขึ้นจอ
    D->>C: 13. playback log
```

**Latency ที่ต้องรู้:** ตั้งแต่กด publish ถึงขึ้นจอ = **รอบ poll ถัดไป (30–60 วิ) + เวลาโหลดไฟล์** ไม่ใช่ทันที เพราะเป็นสถาปัตยกรรม pull

---

## 7. สรุปเส้นทางทั้งหมด

| จาก | ไป | Auth | ใช้ทำอะไร |
|-----|----|----|-----------|
| Browser | Thunder One `/api/auth/*` | cookie | login / logout |
| Browser | Thunder One `/api/proxy/*` | cookie | ทุก media operation |
| Browser | Supabase Storage | signed URL | **upload ไฟล์** (ตรง) |
| Thunder One | Thunder_Core `/auth/*` | `x-api-key` | verify credentials |
| Thunder One | Thunder_Core `/media/*` | `x-api-key` + Bearer | CRUD video/screen/playlist/publish |
| IoT Player | Thunder_Core `/media/player/*` | Bearer device_token | poll / ack / heartbeat / playback |
| IoT Player | Supabase Storage | signed URL | **download ไฟล์** (ตรง) |

รายละเอียด contract ฝั่ง IoT → [player_device_api.md](player_device_api.md)
