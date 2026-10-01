-- Seed สำหรับกด E2E ที่ http://localhost:3000/e2e ให้จบ flow
-- target: Supabase project ThunderCore (sfiefevtxalqjizdkcsw) — ตัวเดียวกับที่ Thunder_Core .env ชี้อยู่
-- idempotent: รันซ้ำได้ (fixed UUID + ON CONFLICT)
-- membership/users: ไม่แตะ — user จัดการเอง
--
-- rollback: ดูท้ายไฟล์

BEGIN;

-- 1) tenant ใหม่ ------------------------------------------------------------
INSERT INTO public.tenants (id, tenant_code, name, legal_name, tenant_type, status, description)
VALUES (
    '11110000-0000-4000-8000-000000000001',
    'THUNDERONE',
    'ThunderOne',
    'ThunderOne DOOH',
    'enterprise',
    'active',
    'Tenant for Thunder One DOOH media MVP / E2E testing'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

-- 2) application + x-api-key ที่ผูกกับ tenant นี้ ----------------------------
-- requireMediaApp() resolve tenant จาก applications.tenant_id ของ key ที่ยิงมา
INSERT INTO public.applications (id, name, description, tenant_id, status, environment, api_key, api_key_generated_at)
VALUES (
    '11110000-0000-4000-8000-000000000002',
    'Thunder One',
    'DOOH video publishing frontend (Repo B)',
    '11110000-0000-4000-8000-000000000001',
    'active',
    'development',
    'tk_e740d24eb83757bfaff50056b61c88a35c0a8caa87239eb22bb8c37ab545188a',
    now()
)
ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, api_key = EXCLUDED.api_key, status = 'active';

-- 3) จอ 2 ตัว (public.assets — "screen", ไม่ใช่ media asset) ------------------
INSERT INTO public.assets (id, tenant_id, name, device_name, device_type, asset_category, status,
                           registry_status, connection_status, model, screen_ratio, screen_dimension, site, zone, description)
VALUES
    ('11110000-0000-4000-8000-000000000011', '11110000-0000-4000-8000-000000000001',
     'ThunderOne Screen 01', 'thunderone-screen-01', 'Player', 'OTHER', 'active',
     'registered', 'offline', 'BrightSign XT1144', '16:9', '1920x1080', 'HQ Lobby', 'Zone A',
     'E2E test screen #1'),
    ('11110000-0000-4000-8000-000000000012', '11110000-0000-4000-8000-000000000001',
     'ThunderOne Screen 02', 'thunderone-screen-02', 'Player', 'OTHER', 'active',
     'registered', 'offline', 'BrightSign XT1144', '9:16', '1080x1920', 'HQ Lobby', 'Zone B',
     'E2E test screen #2')
ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, name = EXCLUDED.name, status = 'active';

-- 4) device_credentials — จอจะโผล่ใน GET /media/screens ก็ต่อเมื่อมีแถวนี้ ----
INSERT INTO public.device_credentials (id, asset_id, access_token, mqtt_client_id, is_revoked)
VALUES
    ('11110000-0000-4000-8000-000000000031', '11110000-0000-4000-8000-000000000011',
     'dtk_6625464d12389e2235c325738ba6dbde3bf7f4edd55d6c80', 'thunderone-screen-01', false),
    ('11110000-0000-4000-8000-000000000032', '11110000-0000-4000-8000-000000000012',
     'dtk_d92b8fbab4fc461aaea04f3b5137b1a6121d4c0f7cfc2495', 'thunderone-screen-02', false)
ON CONFLICT (id) DO UPDATE SET access_token = EXCLUDED.access_token, is_revoked = false, revoked_at = NULL;

-- 5) channel + สมาชิก — ไว้ทดสอบ publish แบบ target_type:"channel" ------------
INSERT INTO media_core.channels (id, tenant_id, name, status)
VALUES ('11110000-0000-4000-8000-000000000021', '11110000-0000-4000-8000-000000000001', 'ThunderOne Lobby Channel', 'active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO media_core.channel_devices (channel_id, device_id, role)
VALUES
    ('11110000-0000-4000-8000-000000000021', '11110000-0000-4000-8000-000000000011', 'primary'),
    ('11110000-0000-4000-8000-000000000021', '11110000-0000-4000-8000-000000000012', 'primary')
ON CONFLICT DO NOTHING;

COMMIT;

-- ---------------------------------------------------------------------------
-- ROLLBACK (ลบทุกอย่างที่ seed นี้สร้าง — ระวัง: ลบ media_core ที่สร้างผ่าน UI ด้วย)
-- ---------------------------------------------------------------------------
-- BEGIN;
-- DELETE FROM media_core.channel_devices WHERE channel_id = '11110000-0000-4000-8000-000000000021';
-- DELETE FROM media_core.channels        WHERE tenant_id  = '11110000-0000-4000-8000-000000000001';
-- DELETE FROM public.device_credentials  WHERE asset_id  IN ('11110000-0000-4000-8000-000000000011','11110000-0000-4000-8000-000000000012');
-- DELETE FROM public.assets              WHERE tenant_id  = '11110000-0000-4000-8000-000000000001';
-- DELETE FROM public.applications        WHERE id         = '11110000-0000-4000-8000-000000000002';
-- DELETE FROM public.tenants             WHERE id         = '11110000-0000-4000-8000-000000000001';
-- COMMIT;
