import type { OrgUnitNode } from "./mock-data";

// Real client-side CSV export (a Blob + temporary <a download>, no server
// round-trip or new dependency) — added 2026-09-15 for OrgStructureHeader's
// "Export" (whole tree) and OrgDetailPanel's "Export โครงสร้างนี้" (one
// unit's own subtree). Same six columns either way; the subtree version
// just starts the walk from a chosen unit instead of the root.
function collectSubtree(unit: OrgUnitNode, units: Record<string, OrgUnitNode>, rows: OrgUnitNode[]) {
  rows.push(unit);
  for (const childId of unit.childIds) {
    const child = units[childId];
    if (child) collectSubtree(child, units, rows);
  }
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function rowsToCsv(rows: OrgUnitNode[]): string {
  const header = ["รหัสหน่วยงาน", "ชื่อหน่วยงาน", "ประเภท", "หัวหน้าหน่วยงาน", "พนักงาน", "หน่วยงานย่อย"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [row.unitCode, row.name, row.unitType, row.headName ?? "", String(row.employeeCount), String(row.teamsCount)]
        .map(csvEscape)
        .join(",")
    );
  }
  return lines.join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportOrgTreeCsv(units: Record<string, OrgUnitNode>, rootUnitId: string) {
  const root = units[rootUnitId];
  if (!root) return;
  const rows: OrgUnitNode[] = [];
  collectSubtree(root, units, rows);
  downloadCsv(rowsToCsv(rows), `org-structure-${root.unitCode || root.id}.csv`);
}

export function exportUnitSubtreeCsv(unit: OrgUnitNode, units: Record<string, OrgUnitNode>) {
  const rows: OrgUnitNode[] = [];
  collectSubtree(unit, units, rows);
  downloadCsv(rowsToCsv(rows), `${unit.unitCode || unit.id}.csv`);
}
