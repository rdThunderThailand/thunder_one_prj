// ตัวช่วยกลางสำหรับยิง GET ตรงไปที่ Thunder_Core (ไม่ผ่าน /api/proxy) — ใช้ได้
// เฉพาะฝั่ง server เท่านั้น เพราะต้องใช้ CORE_API_KEY ซึ่งเป็นความลับ (ห้าม
// ส่งลง client bundle). ก่อนหน้านี้ People Workspace's roles-api.ts,
// organizations-api.ts, members-api.ts (และ asset-intelligence's
// asset-list-api.ts นอกขอบเขตของรอบนี้) ต่างก็ก็อปปี้ authHeaders()/coreGet()
// ชุดเดียวกันแยกไฟล์ละชุด — รวมมาไว้ที่เดียวเพื่อไม่ให้ logic (retry, error
// handling, การ dedupe ด้านล่าง) ต้องแก้ซ้ำหลายจุดเวลามีอะไรเปลี่ยน.
import { cache } from "react";
import { env } from "@/config/env";

export function coreAuthHeaders(token: string): Record<string, string> {
  return { "x-api-key": env.coreApiKey, Authorization: `Bearer ${token}` };
}

/**
 * ครอบด้วย `React.cache()` — ภายใน request เดียวกัน ถ้ามีการเรียก `coreGet`
 * ด้วย path+token ชุดเดียวกันซ้ำมากกว่าหนึ่งครั้ง (เช่น layout กับ page
 * component ต่างก็ต้องใช้ org tree ชุดเดียวกัน) จะยิง fetch จริงแค่ครั้งเดียว
 * ครั้งต่อๆ ไปได้ผลลัพธ์เดิมกลับมาทันทีโดยไม่ต้องรอ network — ไม่ใช่ cache
 * ข้าม request (นั่นต้องมี store ภายนอกอย่าง Redis ซึ่งยังไม่ทำในรอบนี้).
 *
 * Fails open (`null`) เมื่อ transport/HTTP/รูปแบบข้อมูลผิดพลาด — Core ล่มไม่
 * ควรทำให้ทั้งหน้าใช้งานไม่ได้ ให้แต่ละหน้าที่เรียกไปตัดสินใจเองว่าจะ degrade
 * ยังไงเมื่อได้ `null` กลับมา (เช่น "ไม่พบข้อมูลหน่วยงาน" แทนที่จะเป็นหน้า error).
 */
export const coreGet = cache(async function coreGet<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v1${path}`, {
      headers: coreAuthHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return (body?.data as T) ?? null;
  } catch {
    return null;
  }
});
