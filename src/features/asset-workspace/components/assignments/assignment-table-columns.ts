export const assignmentTableColumns = [
  { key: "asset", label: "Asset", className: "w-[26%]" },
  { key: "tag", label: "Asset Tag", className: "w-[12%]" },
  { key: "category", label: "Category", className: "hidden w-[13%] @4xl/assignments:table-cell" },
  { key: "custodian", label: "Current Custodian", className: "w-[22%]" },
  { key: "location", label: "Location", className: "w-[15%]" },
  { key: "assigned", label: "Assigned Date", className: "hidden w-[12%] @5xl/assignments:table-cell" },
] as const;
