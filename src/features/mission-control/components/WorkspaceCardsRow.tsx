import Link from "next/link";
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

// Shortened English titles + a short Thai sub-line, matching the mockup's
// card header exactly — deliberately distinct from `APPS[].label` (used
// elsewhere as the sidebar tagline, e.g. "Asset Intelligence"), so this is
// its own local map rather than a change to the shared registry.
const TITLES: Record<string, string> = {
  people: "People",
  "asset-intelligence": "Asset",
  "media-workspace": "Media",
};

const SUBLABELS: Record<string, string> = {
  people: "บุคลากรและองค์กร",
  "asset-intelligence": "ทรัพย์สินและ Thunder Care",
  "media-workspace": "สื่อและจอแสดงผล",
};

// Exact tone hex values from the Figma mockup (node 396:4660) — each
// workspace gets its own tinted card, icon chip, and CTA button color.
// "Media"'s title deliberately stays navy (not purple) in the mockup even
// though its icon/button are purple — kept as-is rather than "fixed".
const TONES: Record<
  string,
  { cardTo: string; border: string; chipBg: string; iconColor: string; titleColor: string; buttonBg: string; buttonText: string }
> = {
  people: {
    cardTo: "to-[#f2f8ff] dark:to-zinc-900",
    border: "border-[#e5edf9] dark:border-zinc-800",
    chipBg: "bg-[#e7f2ff] dark:bg-blue-500/10",
    iconColor: "text-[#075df7] dark:text-blue-400",
    titleColor: "text-[#075df7] dark:text-blue-400",
    buttonBg: "bg-[#e4f1ff] hover:bg-[#d5e8ff] dark:bg-blue-500/10 dark:hover:bg-blue-500/20",
    buttonText: "text-[#0760ed] dark:text-blue-400",
  },
  "asset-intelligence": {
    cardTo: "to-[#eefdf7] dark:to-zinc-900",
    border: "border-[#e5edf9] dark:border-zinc-800",
    chipBg: "bg-[#e5faf0] dark:bg-emerald-500/10",
    iconColor: "text-[#09a96d] dark:text-emerald-400",
    titleColor: "text-[#09a96d] dark:text-emerald-400",
    buttonBg: "bg-[#def8ed] hover:bg-[#cdf3e2] dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20",
    buttonText: "text-[#08a96d] dark:text-emerald-400",
  },
  "media-workspace": {
    cardTo: "to-[#f9f2ff] dark:to-zinc-900",
    border: "border-[#e5edf9] dark:border-zinc-800",
    chipBg: "bg-[#f1e8ff] dark:bg-violet-500/10",
    iconColor: "text-[#7117df] dark:text-violet-400",
    titleColor: "text-[#071858] dark:text-zinc-50",
    buttonBg: "bg-[#f0e4ff] hover:bg-[#e6d2ff] dark:bg-violet-500/10 dark:hover:bg-violet-500/20",
    buttonText: "text-[#7117df] dark:text-violet-400",
  },
};

const ORDER = ["people", "asset-intelligence", "media-workspace"];

export function WorkspaceCardsRow() {
  const apps = ORDER.map((id) => APPS.find((app) => app.id === id)).filter((app): app is NonNullable<typeof app> => Boolean(app));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight text-[#071858] dark:text-zinc-50">พื้นที่ทำงานของคุณ</h2>
        <Link
          href="/work-space"
          className="flex items-center gap-1 text-sm font-bold text-[#0760ed] hover:text-[#0748c4] dark:text-blue-400"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {apps.map((app) => {
          const tone = TONES[app.id];
          return (
            <div
              key={app.id}
              className={`flex flex-col gap-3 rounded-[10px] border bg-gradient-to-br from-white p-[22px] dark:from-zinc-900 ${tone.border} ${tone.cardTo}`}
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${tone.chipBg} ${tone.iconColor} [&>svg]:h-6 [&>svg]:w-6`}>
                  {app.icon}
                </span>
                <div>
                  <p className={`text-lg font-black tracking-tight ${tone.titleColor}`}>{TITLES[app.id]}</p>
                  <p className="text-sm text-[#5e71a2] dark:text-zinc-400">{SUBLABELS[app.id]}</p>
                </div>
              </div>
              <p className="text-sm text-[#536a9c] dark:text-zinc-400">{DESCRIPTIONS[app.id]}</p>
              <Link
                href={app.basePath}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-auto flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-center text-sm font-bold ${tone.buttonBg} ${tone.buttonText}`}
              >
                เปิดใช้งาน
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
