// Table columns, shared by the tables and their loading skeletons (plain module so the server loading screen can read it).
export const LIFECYCLE_COLUMNS = [
  { key: "photo", label: "Photo", className: "w-16" },
  { key: "name", label: "Asset Name", className: "w-[22%]" },
  { key: "tag", label: "Asset Tag", className: "w-[11%]" },
  { key: "category", label: "Category", className: "hidden w-[11%] @5xl/lw:table-cell" },
  { key: "location", label: "Location", className: "hidden w-[12%] @4xl/lw:table-cell" },
  { key: "custodian", label: "Custodian", className: "hidden w-[12%] @6xl/lw:table-cell" },
  { key: "status", label: "Lifecycle Status", className: "w-[13%]" },
  { key: "condition", label: "Condition", className: "w-[10%]" },
  { key: "changed", label: "Last Changed", className: "hidden w-[10%] @4xl/lw:table-cell" },
  { key: "menu", label: "Actions", className: "w-14 text-right" },
] as const;

export const WARRANTY_COLUMNS = [
  { key: "name", label: "Asset Name", className: "w-[22%]" },
  { key: "tag", label: "Asset Tag", className: "w-[12%]" },
  { key: "provider", label: "Provider", className: "w-[15%]" },
  { key: "type", label: "Warranty Type", className: "hidden w-[14%] @4xl/lw:table-cell" },
  { key: "start", label: "Start Date", className: "hidden w-[11%] @5xl/lw:table-cell" },
  { key: "end", label: "End Date", className: "w-[11%]" },
  { key: "status", label: "Status", className: "w-[13%]" },
  { key: "menu", label: "Actions", className: "w-14 text-right" },
] as const;
