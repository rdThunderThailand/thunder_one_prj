import { HISTORY_COLUMNS } from "../../domain/assignment-history";

const widths = ["w-[4%]", "w-[14%]", "w-[10%]", "w-[11%]", "w-[11%]",
  "w-[11%]", "w-[9%]", "w-[9%]", "w-[10%]", "w-[11%]"];

export const assignmentHistoryColumns = HISTORY_COLUMNS.map((label, index) => ({ label, width: widths[index] }));
