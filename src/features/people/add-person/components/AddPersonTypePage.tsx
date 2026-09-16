import Link from "next/link";
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  InfoIcon,
  RepeatIcon,
  UploadIcon,
  UsersIcon,
} from "@/components/ui/icons";

function Breadcrumb() {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
      <Link href="/people" className="hover:text-zinc-600 dark:hover:text-zinc-300">
        ภาพรวม
      </Link>
      <ChevronRightIcon className="h-3 w-3" />
      <span className="text-zinc-600 dark:text-zinc-300">เพิ่มคน</span>
    </nav>
  );
}

interface TypeCard {
  id: "employee" | "contractor" | "bulk";
  label: string;
  description: string;
  badge: string;
  href: string | null;
}

const TYPE_CARDS: TypeCard[] = [
  {
    id: "employee",
    label: "พนักงานใหม่ (Employee)",
    description: "เพิ่มพนักงานประจำหรือพนักงานทดลองงาน และเริ่มกระบวนการ Onboarding",
    badge: "รวมอยู่ใน Workforce",
    href: "/people/add/employee",
  },
  {
    id: "contractor",
    label: "ผู้รับเหมา / Contractor",
    description: "เพิ่มผู้รับเหมาหรือผู้ปฏิบัติงานภายนอกตามสัญญาจ้าง กำหนดระยะเวลาและสิทธิการเข้าถึง",
    badge: "รวมอยู่ใน Workforce",
    href: "/people/add/contractor",
  },
  {
    id: "bulk",
    label: "เพิ่มหลายคน (Bulk)",
    description: "นำเข้าข้อมูลบุคคลหลายคนพร้อมกันจากไฟล์ Excel หรือ CSV",
    badge: "แนะนำสำหรับจำนวนมาก",
    href: "/people/add/bulk",
  },
];

const COMPARISON_ROWS: { label: string; values: [string, string, string] }[] = [
  {
    label: "รวมใน Workforce (นับเป็นบุคลากรขององค์กร)",
    values: ["✓", "✓", "ขึ้นอยู่กับประเภทที่เลือก"],
  },
  { label: "กระบวนการ Onboarding", values: ["มี (เต็มรูปแบบ)", "มี (แบบย่อ)", "มี (ตามประเภทที่เลือก)"] },
  { label: "กำหนดระยะเวลาเริ่ม - สิ้นสุด", values: ["ตามสถานะการจ้างงาน", "กำหนดได้", "กำหนดได้ (ตามข้อมูลที่นำเข้า)"] },
  { label: "สิทธิการเข้าถึงระบบ", values: ["เต็มตามบทบาท", "จำกัดตามบทบาท", "ตามประเภทที่เลือก"] },
  { label: "เหมาะสำหรับ", values: ["พนักงานประจำ / ทดลองงาน", "ผู้รับจ้าง, ที่ปรึกษา, ผู้ปฏิบัติงานภายนอก", "จำนวนมาก, ระยะเวลาสั้น"] },
];

const RELATED_ACTIONS = [
  { label: "เชิญผู้ใช้งานที่มีอยู่แล้ว", sublabel: "เชิญบุคคลที่มีข้อมูลอยู่ในระบบแต่ยังไม่มีบัญชีผู้ใช้", href: null },
  { label: "นำเข้าหลายคน", sublabel: "เพิ่มข้อมูลบุคลากรจำนวนมากจากไฟล์ Excel หรือ CSV", href: null },
  { label: "โอนย้ายพนักงาน", sublabel: "เปลี่ยนทีม / แผนก", href: null },
  { label: "ดูโครงสร้างองค์กร", sublabel: "ดูแผนผังองค์กรและตำแหน่งงานก่อนเพิ่มบุคลากร", href: "/people/org-structure" },
];

const CARD_ICON: Record<TypeCard["id"], typeof UsersIcon> = {
  employee: UsersIcon,
  contractor: BuildingIcon,
  bulk: UploadIcon,
};

const ACTION_ICON = [EnvelopeIcon, UploadIcon, RepeatIcon, BuildingIcon];

// "เพิ่มคนเข้าองค์กร" — the entry point for every way of adding a person to
// the organization, reached from Overview's "เพิ่มคน / เชิญคน" button,
// Personnel's "เพิ่มบุคลากร" button, or New Hires' "เพิ่มพนักงานใหม่" button.
// Replaces the old AddPersonModal (people/personnel) — all three cards
// (Employee, Contractor, Bulk) now lead somewhere real; only the three
// "related actions" below besides ดูโครงสร้างองค์กร stay inert, same
// "renders inert, not built yet" convention as every other unbuilt
// affordance in this app (see e.g. QuickActionsRow).
export function AddPersonTypePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Breadcrumb />
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">เพิ่มคนเข้าองค์กร</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              เลือกประเภทของบุคคลที่ต้องการเพิ่ม เพื่อเริ่มกระบวนการที่เหมาะสม
            </p>
          </div>
        </div>
        <div className="flex max-w-sm items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-medium">เลือกประเภทที่ถูกต้อง</span>
            <br />
            การเลือกประเภทบุคคลที่เหมาะสม จะช่วยให้ระบบทำงานและสิทธิ์การเข้าถึงที่เหมาะสมอัตโนมัติ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TYPE_CARDS.map((card) => {
          const Icon = CARD_ICON[card.id];
          const body = (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{card.label}</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{card.description}</span>
              <span className="mt-auto inline-flex w-fit items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {card.badge}
              </span>
            </>
          );

          return card.href ? (
            <Link
              key={card.id}
              href={card.href}
              className="group flex flex-col items-start gap-2 rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-400 dark:border-indigo-500/40 dark:bg-zinc-900"
            >
              {body}
              <ArrowRightIcon className="h-4 w-4 self-end text-indigo-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <div
              key={card.id}
              title="ยังไม่เปิดใช้งาน"
              className="flex cursor-not-allowed flex-col items-start gap-2 rounded-2xl border border-zinc-200 bg-white p-5 opacity-70 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              {body}
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="border-b border-zinc-100 px-5 py-4 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
          เปรียบเทียบประเภทบุคคลในระบบ
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-400 dark:border-zinc-800">
                <th className="px-5 py-3 font-medium">หัวข้อ</th>
                {TYPE_CARDS.map((card) => (
                  <th key={card.id} className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-300">
                    {card.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-zinc-50 last:border-0 dark:border-zinc-800/60">
                  <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{row.label}</td>
                  {row.values.map((value, i) => (
                    <td key={i} className="px-5 py-3 text-zinc-700 dark:text-zinc-200">
                      {value === "✓" ? <CheckIcon className="h-4 w-4 text-emerald-500" /> : value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">การดำเนินการที่เกี่ยวข้อง</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED_ACTIONS.map((action, i) => {
            const Icon = ACTION_ICON[i];
            const body = (
              <>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {action.label}
                  </span>
                  <span className="block truncate text-[11px] text-zinc-400">{action.sublabel}</span>
                </span>
              </>
            );
            return action.href ? (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border border-zinc-100 p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-500/5"
              >
                {body}
              </Link>
            ) : (
              <div
                key={action.label}
                title="ยังไม่เปิดใช้งาน"
                className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-zinc-100 p-3 opacity-70 dark:border-zinc-800"
              >
                {body}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
