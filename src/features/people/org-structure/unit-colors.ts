// Color-codes a unit's icon by its real `unitType` (Core's `department_type`
// — confirmed real values seen so far: "organization", "function"; nothing
// richer like a per-department-name taxonomy exists in Core's schema, so
// this keys off the type string that's actually there rather than
// hardcoding specific department names into frontend logic). Unknown/future
// type strings get a deterministic color from the same palette via a simple
// hash, so the chart stays visually differentiated without needing a code
// change every time Core's data introduces a new type value.
const PALETTE: { bg: string; text: string; darkBg: string; darkText: string }[] = [
  { bg: "bg-accent", text: "text-primary", darkBg: "", darkText: "" },
  { bg: "bg-success-muted", text: "text-t1-green-700", darkBg: "", darkText: "" },
  { bg: "bg-warning-muted", text: "text-t1-amber-700", darkBg: "", darkText: "" },
  { bg: "bg-info-muted", text: "text-t1-blue-700", darkBg: "", darkText: "" },
  { bg: "bg-error-muted", text: "text-t1-red-700", darkBg: "", darkText: "" },
  { bg: "bg-in-progress-muted", text: "text-t1-purple-700", darkBg: "", darkText: "" },
];

// Fixed assignments for the three type values actually observed in real
// data ("team" found live 2026-09-15, testing the list view — hashed to the
// same index as "function" by coincidence, making every leaf-level team
// visually identical to its parent function until pinned here explicitly)
// — keeps organization/function/team visually distinct from each other on
// the first load, before hash-based variety even matters.
const KNOWN_TYPE_INDEX: Record<string, number> = {
  organization: 0,
  function: 3,
  team: 1,
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export function unitTypeColorClasses(unitType: string): string {
  const index = unitType in KNOWN_TYPE_INDEX ? KNOWN_TYPE_INDEX[unitType] : hashString(unitType) % PALETTE.length;
  const c = PALETTE[index];
  return `${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`;
}
