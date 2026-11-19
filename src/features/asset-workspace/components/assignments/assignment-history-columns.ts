import { HISTORY_COLUMNS } from "../../domain/assignment-history";

const widths = ["w-[12.5%]", "w-[8.5%]", "w-[13.5%]", "w-[14%]",
  "w-[9.5%]", "w-[11%]", "w-[8%]", "w-[12.5%]", "w-[8%]"];

/** The last column holds the row's "open details" arrow; its heading is for screen readers only. */
export const HISTORY_DETAILS_COLUMN = "Details";

export const assignmentHistoryColumns = [
  ...HISTORY_COLUMNS.map((label, index) => ({ label: label as string, width: widths[index] })),
  { label: HISTORY_DETAILS_COLUMN, width: "w-[2.5%]" },
];
