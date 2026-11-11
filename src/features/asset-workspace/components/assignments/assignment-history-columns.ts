import { HISTORY_COLUMNS } from "../../domain/assignment-history";

const widths = ["w-[3.5%]", "w-[12.5%]", "w-[8.5%]", "w-[13.5%]", "w-[14%]",
  "w-[9.5%]", "w-[10.5%]", "w-[8%]", "w-[12.5%]", "w-[7.5%]"];

export const assignmentHistoryColumns = HISTORY_COLUMNS.map((label, index) => ({ label, width: widths[index] }));
