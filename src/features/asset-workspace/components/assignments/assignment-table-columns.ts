export const assignmentTableColumns = [
  { key: "asset", label: "Asset", className: "w-1/4" },
  { key: "tag", label: "Asset Tag", className: "" },
  { key: "category", label: "Category", className: "hidden @4xl/assignments:table-cell" },
  { key: "custodian", label: "Current Custodian", className: "w-1/5" },
  { key: "location", label: "Location", className: "" },
  { key: "assigned", label: "Assigned Date", className: "hidden @5xl/assignments:table-cell" },
  { key: "actions", label: "Actions", className: "relative w-16 text-right" },
] as const;
