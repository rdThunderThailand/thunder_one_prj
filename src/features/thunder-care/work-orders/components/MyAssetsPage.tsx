"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterIcon, ImageIcon, RepeatIcon } from "@/components/ui/icons";
import { MY_ASSET_STATUS_COLOR, MY_ASSET_STATUS_LABEL, myAssetRows, myAssetSummary } from "../mock-data";

// "ทรัพย์สินของฉัน" — Asset ทั้งหมดที่ Technician รับผิดชอบและเคยให้บริการ
// (ผังหน้าจอที่ผู้ใช้ส่งมา 2569-09-08).
export function MyAssetsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">ทรัพย์สินของฉัน</h1>
          <p className="text-sm text-muted-foreground">ทรัพย์สินทั้งหมดที่คุณรับผิดชอบ และเคยให้บริการ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled title="ยังไม่เปิดใช้งาน">
            ส่งออก
          </Button>
          <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
            + เพิ่ม Asset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">ทั้งหมด</p>
          <span className="text-2xl font-semibold text-primary">{myAssetSummary.total}</span>
          <p className="text-xs text-t1-gray-400">Asset</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">ใช้งานอยู่</p>
          <span className="text-2xl font-semibold text-t1-green-700">{myAssetSummary.active}</span>
          <p className="text-xs text-t1-gray-400">Active</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">อยู่ระหว่างบำรุงรักษา</p>
          <span className="text-2xl font-semibold text-t1-blue-700">{myAssetSummary.maintenance}</span>
          <p className="text-xs text-t1-gray-400">Maintenance</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">หยุดใช้งาน</p>
          <span className="text-2xl font-semibold text-muted-foreground">{myAssetSummary.suspended}</span>
          <p className="text-xs text-t1-gray-400">Suspended</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">ยกเลิกใช้งาน</p>
          <span className="text-2xl font-semibold text-t1-gray-400">{myAssetSummary.retired}</span>
          <p className="text-xs text-t1-gray-400">Retired</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="ค้นหา Asset, Serial, ชื่อ, รุ่น..." className="max-w-sm" />
        {["ประเภท Asset: ทั้งหมด", "สถานะ: ทั้งหมด", "สถานที่: ทั้งหมด"].map((label) => (
          <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
            <option>{label}</option>
          </select>
        ))}
        <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
          <FilterIcon className="h-3.5 w-3.5" /> ตัวกรองเพิ่มเติม
        </button>
        <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed text-t1-gray-400">
          <RepeatIcon className="h-4 w-4" />
        </button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-2 py-2 font-medium">Asset / Serial</th>
              <th className="px-2 py-2 font-medium">ประเภท / รุ่น</th>
              <th className="px-2 py-2 font-medium">สถานที่ติดตั้ง</th>
              <th className="px-2 py-2 font-medium">สถานะ</th>
              <th className="px-2 py-2 font-medium">วันที่ติดตั้ง</th>
              <th className="px-2 py-2 font-medium">งานล่าสุด</th>
              <th className="px-2 py-2 font-medium">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {myAssetRows.map((asset) => (
              <tr key={asset.assetTag}>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-t1-gray-400">
                      <ImageIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{asset.assetTag}</p>
                      <p className="text-xs text-t1-gray-400">SN: {asset.serial}</p>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-2 text-foreground">
                  <p>{asset.category}</p>
                  <p className="text-xs text-t1-gray-400">{asset.model}</p>
                </td>
                <td className="px-2 py-2 text-muted-foreground">{asset.location}</td>
                <td className="px-2 py-2">
                  <Badge variant="pill" color={MY_ASSET_STATUS_COLOR[asset.status]}>
                    {MY_ASSET_STATUS_LABEL[asset.status]}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-xs text-muted-foreground">{asset.installedDateLabel}</td>
                <td className="px-2 py-2 text-xs text-muted-foreground">
                  {asset.lastWorkDateLabel}
                  <br />
                  {asset.lastWorkLabel}
                </td>
                <td className="px-2 py-2">
                  <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    ดูรายละเอียด
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="flex items-center justify-between text-xs text-t1-gray-400">
        <span>แสดง 1-{myAssetRows.length} จาก {myAssetSummary.total} รายการ</span>
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (
            <button key={n} type="button" disabled title="ยังไม่เปิดใช้งาน" className={`h-7 w-7 cursor-not-allowed rounded-lg ${n === 1 ? "bg-primary text-primary-foreground" : "border border-border"}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
