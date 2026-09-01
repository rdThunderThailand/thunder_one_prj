import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { ChevronRightIcon, PlusIcon } from "@/components/ui/icons";

function Breadcrumb() {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
      <Link href="/people" className="hover:text-zinc-600 dark:hover:text-zinc-300">
        หน้าหลัก
      </Link>
      <ChevronRightIcon className="h-3 w-3" />
      <span className="text-zinc-600 dark:text-zinc-300">ผู้ปฏิบัติงานภายนอก</span>
    </nav>
  );
}

// "+ เพิ่มผู้ปฏิบัติงานภายนอก" is real — links to people/add-person's
// Contractor wizard (/people/add/contractor), already built.
export function ContractorsHeader() {
  return (
    <div className="flex flex-col gap-3">
      <Breadcrumb />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            ผู้ปฏิบัติงานภายนอก (Contractor)
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            บริหารจัดการผู้ปฏิบัติงานภายนอกและสัญญาจ้าง
          </p>
        </div>
        <Link href="/people/add/contractor" className={buttonClasses("primary")}>
          <PlusIcon className="h-4 w-4" />
          เพิ่มผู้ปฏิบัติงานภายนอก
        </Link>
      </div>
    </div>
  );
}
