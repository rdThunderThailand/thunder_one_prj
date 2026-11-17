# ข้อเสนอ: ให้ PO ทำ UX/UI prototype ด้วย AI เป็นโค้ด

สถานะ: ร่างเพื่อเสนอ PO · 2026-11-13 · ขอบเขตรอบแรก: Media Workspace

## ปัญหา

ไม่มี UX/UI designer · PO ใช้ image gen ของ ChatGPT ทำภาพหน้าจอ แต่ทุกครั้งที่สั่งแก้ ภาพถูกวาดใหม่ทั้งใบ ของที่ดีอยู่แล้วแตก และ dev เอาภาพไปเขียนโค้ดต่อไม่ได้ตรงๆ

## หลักการ

1. **Prototype เป็นโค้ด ไม่ใช่ภาพ** — AI แก้ทีละจุด (diff) ของเดิมไม่แตก
2. **ใช้ design system จริง** — token, icon, component ชุดเดียวกับ ThunderOne (skill `thunderone-ui` + profile `media`)
3. **แก้ของที่มี ไม่งอกของใหม่** — ทุกคำสั่งแก้ต้องไปแก้ไฟล์/component เดิม ห้ามสร้างตัวซ้ำ
4. **คลิกได้จริงแต่ไม่ต่อ backend** — mock data + state ในหน่วยความจำ ครบ empty / error / ขั้นยืนยันก่อนลบ
5. **Prototype คือสเปกที่รันได้** — dev ใช้ layout และ component ที่เลือก แล้วเขียน data layer / server action ใหม่ตามกติกา repo (ไม่ merge โค้ด prototype เข้า product ตรงๆ)

## ลูปที่ทุกแนวทางต้องครบ

| # | ขั้น | ผลลัพธ์ |
|---|---|---|
| ① | Dev ตั้งระบบครั้งเดียว | ที่ทำงานของ PO พร้อม design system และกติกา |
| ② | PO เขียน brief | ปัญหา · ผู้ใช้ · flow · หน้าจอที่เกี่ยว |
| ③ | **AI อ่าน design system → เสนอแผน → สร้าง** | แผนสั้น (ใช้ pattern / component อะไร ไฟล์ไหน) ให้ PO ยืนยันก่อน แล้วค่อยเขียนโค้ด |
| ④ | Preview | URL ที่คลิกได้ ส่งต่อได้ |
| ⑤ | **PO สั่งแก้ทีละจุด** | AI บอกก่อนว่าจะแก้ไฟล์ไหน · แก้เฉพาะจุด · ไม่สร้างของซ้ำ |
| ⑥ | ตรวจอัตโนมัติ | token ถูก · ไม่งอก component ซ้ำ · ไม่แตะไฟล์ design system |
| ⑦ | Handoff | preview URL + ลิงก์โค้ด + โน้ต flow 5 บรรทัด |
| ⑧ | Dev ทำจริง แล้วปิดลูป | prototype ถูกปิด/เก็บเป็นประวัติ ลิงก์จาก ticket |

### ③ AI ต้องอ่านอะไรก่อนสร้าง (บังคับใน `AGENTS.md` ของ repo prototype)

ก่อนสร้างหน้าแรก AI ต้องอ่าน:

- `thunderone-ui/SKILL.md` — กติกาหลัก
- `references/workspaces/media.md` — คำศัพท์ / icon / สีสถานะของ Media
- `references/patterns.md` — โครงหน้า (list, detail, form, wizard, empty state)
- `references/components.md` — มี component อะไรให้ใช้
- `references/review-checklist.md` — เช็กตัวเองก่อนส่ง
- `src/config/nav/media-workspace.tsx` — เมนูและชื่อเรียกจริง (ชนะ profile เมื่อขัดกัน)

แล้วตอบ PO เป็น **แผนก่อนโค้ด**:

```
หน้า: <ชื่อ> · pattern: <list/detail/wizard…>
ใช้ component: Button, Sheet, Tabs …  (มีอยู่แล้วทั้งหมด / ต้องเพิ่ม: <ชื่อ + เหตุผล>)
ไฟล์ที่จะสร้าง/แก้: src/app/<route>/page.tsx, src/mocks/<x>.ts
state ที่ครอบคลุม: ปกติ · ว่าง · error · ยืนยันก่อนลบ
```

PO ตอบ "ok" แล้วค่อยเขียน — แก้แผนถูกกว่าแก้โค้ด

### ⑤ กติกา "แก้ ไม่งอก" (ponytail rules ใน `AGENTS.md`)

ทุกคำสั่งแก้ AI ต้อง:

1. **หาของเดิมก่อน** — ระบุไฟล์และ component ที่จะแก้ ถ้าหาไม่เจอให้ถาม PO ห้ามเดาแล้วสร้างใหม่
2. **แก้ในที่เดิม** — ห้าม copy ไฟล์เป็น `PageV2`, `NewCard`, `-copy` ฯลฯ
3. **ใช้ primitive ที่มี** — ห้ามสร้างปุ่ม / dialog / dropdown เอง ห้าม `<button>` ดิบเมื่อมี `Button`
4. **ห้ามแตะ design system** — `src/components/ui/`, `icons.tsx`, `src/design-system/` เป็นของ sync มา อ่านอย่างเดียว ขาดอะไรให้แจ้ง dev
5. **diff เล็กที่สุดที่ทำงานได้** — ไม่แถม feature ที่ไม่ได้สั่ง ไม่ refactor ส่วนอื่น
6. **รายงานหลังแก้** — "แก้ไฟล์ X บรรทัดประมาณ Y เพราะ Z · ไม่ได้สร้างไฟล์ใหม่"

PO สั่งแก้ด้วย template นี้จะได้ผลแม่นสุด:

```
หน้า: <ชื่อหน้า / URL>
ตรงไหน: <ส่วนของหน้า เช่น "ปุ่มมุมขวาบน", "การ์ดแถวที่ 2">
อยากให้เป็น: <ผลที่ต้องการ>
ห้ามเปลี่ยน: <ส่วนที่พอใจแล้ว>
```

### ⑥ ตรวจอัตโนมัติ (CI ของ repo prototype — กันได้จริง ไม่ใช่แค่ขอร้อง AI)

| check | fail เมื่อ |
|---|---|
| `tokens` | เจอ `zinc-*` / `indigo-*` / `bg-white` / hex / `dark:` |
| `ds-readonly` | ไฟล์ใต้ `src/components/ui/`, `icons.tsx`, `src/design-system/` ถูกแก้ |
| `no-duplicates` | เจอไฟล์ชื่อ `*V2*`, `*New*`, `*copy*` หรือ component ใหม่ที่ชื่อชนกับ primitive |
| `no-raw-primitives` | เจอ `<button`, `<select`, `<dialog` ดิบใน feature code |
| `build` | หน้าไม่ build |

CI fail → AI อ่านผลแล้วแก้เอง PO ไม่ต้องรู้กติกา

> หมายเหตุ: ChatGPT Codex อ่าน `AGENTS.md` แต่ไม่รู้จัก Claude skill — จึงต้องเขียนกติกาข้างบนลง `AGENTS.md` ตรงๆ และใช้ CI เป็นตัวบังคับจริง

---

## แนวทางที่เสนอ

### ฐานร่วม (แนวทาง 1–3) — dev ตั้งครั้งเดียว

Repo `thunderone-prototypes`:

- primitive / icon / token ดึงจาก `thunder_one_prj` ด้วยสคริปต์ sync (ไม่ copy มือ กันเพี้ยน)
- `src/mocks/` ข้อมูลตัวอย่าง Media (Asset, Playlist, Program, Screen)
- ไม่มี login ไม่ต่อ backend
- `AGENTS.md` = รายการอ่านบังคับ (③) + กติกาแก้ไม่งอก (⑤)
- CI ตาม ⑥ · Vercel preview ต่อ PR

### แนวทาง 1 — ChatGPT Codex + GitHub ⭐ แนะนำเป็นหลัก

PO ใช้ ChatGPT อยู่แล้ว ไม่ต้องเปลี่ยนเครื่องมือ

| ขั้น | ทำยังไง |
|---|---|
| ②③ | เปิด Codex ใน ChatGPT เลือก repo prototype พิมพ์ brief → Codex ตอบแผน → PO ok |
| ④ | Codex เปิด PR → Vercel สร้าง preview URL |
| ⑤ | สั่งแก้ต่อใน task เดิม ด้วย template |
| ⑥ | CI รันทุก push · fail → สั่ง Codex "แก้ตาม CI" |
| ⑦⑧ | ส่ง PR + preview URL ให้ dev · dev ทำใน repo จริง แล้วปิด PR prototype |

- ข้อดี: dev ได้ JSX ที่ใช้ component ชื่อเดียวกับของจริง · ประวัติการแก้ครบใน PR
- ข้อเสีย: PO ต้องมีบัญชี GitHub และดูหน้า PR เป็น
- ต้องเช็ก: แพลน ChatGPT ของ PO ใช้ Codex ได้หรือไม่

### แนวทาง 1c — Grok Bot ต่อ GitHub (แทน Codex ในลูปแนวทาง 1)

ใช้ฐานร่วมและลูปเดียวกับแนวทาง 1 ทุกอย่าง (repo prototype + mock data + CI + Vercel preview ต่อ PR) แต่ใช้ Grok Bot ที่ต่อ GitHub เป็นตัวสั่ง coding agent แทน ChatGPT Codex · เหมาะกับ PO ที่ใช้ Grok เป็นหลัก

| ขั้น | ทำยังไง |
|---|---|
| ②③ | PO (หรือ Piyapat) พิมพ์ brief ในแชต Grok Bot → Grok Bot ส่งงานให้ coding agent บน repo prototype · agent อ่าน `AGENTS.md` (③ ⑤) ก่อนลงมือ |
| ④ | agent สร้าง branch → แก้โค้ด → รันเทสต์ → เปิด PR (ไม่ merge) · Vercel GitHub app สร้าง preview URL ให้เอง |
| ⑤ | สั่งแก้ต่อในแชต → Grok Bot ส่งต่อให้ agent ตัวเดิม แก้บน branch และ PR เดิม (ไม่เปิดใหม่ ไม่งอกซ้ำ) |
| ⑥ | GitHub Actions รันอัตโนมัติบน PR · Grok Bot อ่านผล check และลิงก์ Vercel preview กลับมาแจ้งในแชต · fail → สั่ง "แก้ตาม CI" |
| ⑦⑧ | ส่ง PR + preview URL ให้ dev · dev ทำใน repo จริง แล้วปิด PR prototype |

- ข้อดี: PO สั่งงานผ่านแชตได้เลย ไม่ต้องเปิดหน้า Codex · แก้ต่อบน PR เดิมเสมอ · ไม่มีอะไรรันบนเครื่อง (laptop) ของใคร จึงไม่มีความเสี่ยงแบบ Grok Build ที่มีรายงานว่าอัปโหลดข้อมูล repo รวม SSH key ขึ้น cloud
- ข้อเสีย / gap:
  - การตั้งค่าครั้งแรกยังต้องทำเอง: สร้าง repo `thunderone-prototypes`, ผูก Vercel (บัญชี rdThunderThailand), CI check และสคริปต์ sync design system · coding agent เขียน CI check และสคริปต์ sync ใน repo ให้ได้ แต่สร้าง GitHub repo หรือ Vercel project ให้ไม่ได้
  - PO ต้องมี Grok Bot ของตัวเองที่ต่อ GitHub แล้ว หรือสั่งผ่าน Piyapat
  - agent ทำตาม `AGENTS.md` แต่บังคับจริงได้ด้วย CI เท่านั้น (เหมือนแนวทาง 1)
  - ค่าใช้จ่ายคิดจาก usage ของแพลนที่มีอยู่ ไม่ใช่ subscription แยก
- ต้องเช็ก: PO จะใช้ Grok Bot ของตัวเอง หรือสั่งผ่าน Piyapat

### แนวทาง 2 — Lovable (ถ้า PO ไม่อยากเห็น GitHub)

| ขั้น | ทำยังไง |
|---|---|
| ① | สร้าง Lovable project + เปิด GitHub sync · dev push primitive / token เข้า repo นั้น · ใส่ ③ ⑤ ลง Knowledge ของ project |
| ②–⑤ | PO แชตใน Lovable · preview สดในตัว |
| ⑥ | CI ชุดเดียวกันรันบน repo ที่ sync |
| ⑦⑧ | dev ดึงโค้ดจาก GitHub repo ที่ sync |

- ข้อดี: ง่ายสุดสำหรับ PO
- ข้อเสีย: ค่า credit เพิ่ม · stack เป็น Vite ไม่ใช่ Next.js (dev port routing/layout เอง)
- ต้องเช็ก: Lovable จะรักษา primitive ของเราไว้ หรือแทนด้วย shadcn ของมันเอง

### แนวทาง 3 — Claude Code บนเว็บ (คนที่มี Claude)

ลูปเหมือนแนวทาง 1 ใช้ claude.ai/code แทน Codex · อ่าน skill `thunderone-ui` ได้ตรงๆ · เหมาะกับ dev/lead เตรียม prototype ที่ซับซ้อน มากกว่าเป็นเครื่องมือหลักของ PO

### แนวทาง 4 — Starter kit HTML ไฟล์เดียว + ChatGPT Canvas / Grok (เริ่มได้ทันที)

| ขั้น | ทำยังไง |
|---|---|
| ① | dev ทำ `t1-prototype-kit.html`: token CSS + ตัวอย่าง component ด้วย class ของเรา + กติกา ③ ⑤ เป็น prompt หัวไฟล์ · แต่ละส่วนของหน้ามี `<!-- section: x -->` ให้อ้างถึง |
| ②–⑤ | PO แปะ kit ลง Canvas หรือ Grok แล้วสั่ง · กติกาบังคับให้ AI แก้เฉพาะ section ที่ระบุ |
| ⑥ | ไม่มี CI — ใช้ checklist ใน prompt (บังคับไม่ได้จริง) |
| ⑦⑧ | ส่งไฟล์ HTML · dev ใช้เป็นสเปกที่คลิกได้ แล้วเขียนใหม่ |

- ข้อดี: ไม่ต้องตั้งค่า · ใช้ Grok ได้
- ข้อเสีย: ไม่มี version ชัด · design system เพี้ยนได้ · ไม่ใช่ component จริง

## เทียบ

| | 1 Codex | 1c Grok Bot | 2 Lovable | 3 Claude Code | 4 HTML kit |
|---|---|---|---|---|---|
| เครื่องมือที่ PO มี | ✅ | Grok ✅ (ต้องมี Grok Bot ต่อ GitHub) | ต้องสมัครเพิ่ม | บางคน | ✅ |
| ใช้ component จริง | ✅ | ✅ | บางส่วน | ✅ | ❌ |
| กัน "แก้แล้วแตก / งอกซ้ำ" | AGENTS.md + CI | AGENTS.md + CI · แก้บน PR เดิม | Knowledge + CI | AGENTS.md + skill + CI | prompt เท่านั้น |
| PO ต้องรู้ GitHub | เล็กน้อย | น้อยมาก (สั่งผ่านแชต) | ไม่ต้อง | เล็กน้อย | ไม่ต้อง |
| ส่ง dev ได้ทันที | ✅ | ✅ | ต้อง port | ✅ | เป็นสเปก |
| เริ่มได้ | หลังตั้ง repo ฐาน | หลังตั้ง repo ฐาน | หลังตั้ง project | หลังตั้ง repo ฐาน | ทันที |

## คำแนะนำ

**เริ่มด้วยแนวทาง 4 ทันที (ครึ่งวัน) ระหว่างตั้งฐาน แล้วย้ายไปแนวทาง 1 เป็นหลัก** · ถ้า PO ถนัด Grok มากกว่า ChatGPT ให้ใช้แนวทาง 1c (Grok Bot ต่อ GitHub) ขับลูปเดียวกันแทน Codex — ฐานร่วม CI และ Vercel เหมือนเดิมทุกอย่าง · แนวทาง 2 สำรองถ้า PO ใช้ GitHub ไม่ไหว · กติกา ③ ⑤ เขียนครั้งเดียวใช้ได้ทุกแนวทาง

ไฟล์ AI ของ repo ฐาน (AGENTS.md, CLAUDE.md, PR template, คู่มือ PO, sync script, guard, CI) อยู่ที่ [`po-env/`](po-env/README.md)

## สิ่งที่ต้องได้คำตอบจาก PO

1. แพลน ChatGPT ที่ใช้อยู่ (Plus / Team / Enterprise) — มี Codex ไหม
2. มีบัญชี GitHub หรือยอมสมัครไหม
3. feature ไหนใน Media Workspace จะเป็น pilot ตัวแรก
4. ใครเป็นคนรับ handoff ฝั่ง dev และต้องการอะไรเพิ่มนอกจาก preview URL + โน้ต flow
5. ถ้าเลือกแนวทาง 1c: PO จะใช้ Grok Bot ของตัวเองที่ต่อ GitHub หรือสั่งงานผ่าน Piyapat
