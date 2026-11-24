import type { PersonnelRow } from "./mock-data";

// Real client-side CSV export — same Blob + temporary <a download> pattern
// as org-structure's export-csv.ts, no new dependency.
function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function exportPersonnelCsv(rows: PersonnelRow[]) {
  const header = ["ชื่อ-นามสกุล", "อีเมล", "รหัสพนักงาน", "ประเภท", "ตำแหน่ง", "หน่วยงาน", "สถานะ", "วันที่เริ่มงาน"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [row.name, row.email, row.employeeCode, row.type, row.position, row.unit, row.workStatus, row.startDateLabel]
        .map(csvEscape)
        .join(",")
    );
  }
  const csv = lines.join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "personnel.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
