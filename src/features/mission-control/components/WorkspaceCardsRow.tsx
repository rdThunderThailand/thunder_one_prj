import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { APPS } from "@/config/apps";

// Descriptive copy for the 3 workspaces the homepage highlights — People/
// Asset/Media, matching the mockup. ThunderCare and the "coming soon" tiles
// the old compact WorkspacesRow showed are left to the full /work-space
// launcher ("ดูทั้งหมด →" below), not repeated here.
const DESCRIPTIONS: Record<string, string> = {
  people: "จัดการบุคลากร โครงสร้างองค์กร และการเข้าถึงระบบ",
  "asset-intelligence": "บริหารสินทรัพย์ คำขอ และการดูแล พร้อมบริการ Thunder Care",
  "media-workspace": "จัดการเนื้อหา เพลย์ลิสต์ และจอแสดงผลทั้งหมด",
};

const ORDER = ["people", "asset-intelligence", "media-workspace"];

export function WorkspaceCardsRow() {
  const apps = ORDER.map((id) => APPS.find((app) => app.id === id)).filter((app): app is NonNullable<typeof app> => Boolean(app));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">พื้นที่ทำงานของคุณ</h2>
        <Link
          href="/work-space"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {apps.map((app) => (
          <Card key={app.id} className="flex flex-col gap-3 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              {app.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{app.label}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{DESCRIPTIONS[app.id]}</p>
            </div>
            <Link
              href={app.basePath}
              className="mt-auto flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-500"
            >
              เปิดใช้งาน
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
