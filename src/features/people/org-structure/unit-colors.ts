// Color-codes a unit's icon by its real `unitType` (Core's `department_type`
// — confirmed real values seen so far: "organization", "function"; nothing
// richer like a per-department-name taxonomy exists in Core's schema, so
// this keys off the type string that's actually there rather than
// hardcoding specific department names into frontend logic). Unknown/future
// type strings get a deterministic color from the same palette via a simple
// hash, so the chart stays visually differentiated without needing a code
// change every time Core's data introduces a new type value.
const PALETTE: { bg: string; text: string; darkBg: string; darkText: string }[] = [
  { bg: "bg-indigo-50", text: "text-indigo-600", darkBg: "dark:bg-indigo-500/10", darkText: "dark:text-indigo-400" },
  { bg: "bg-emerald-50", text: "text-emerald-600", darkBg: "dark:bg-emerald-500/10", darkText: "dark:text-emerald-400" },
  { bg: "bg-amber-50", text: "text-amber-600", darkBg: "dark:bg-amber-500/10", darkText: "dark:text-amber-400" },
  { bg: "bg-sky-50", text: "text-sky-600", darkBg: "dark:bg-sky-500/10", darkText: "dark:text-sky-400" },
  { bg: "bg-rose-50", text: "text-rose-600", darkBg: "dark:bg-rose-500/10", darkText: "dark:text-rose-400" },
  { bg: "bg-purple-50", text: "text-purple-600", darkBg: "dark:bg-purple-500/10", darkText: "dark:text-purple-400" },
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
