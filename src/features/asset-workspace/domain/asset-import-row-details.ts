import { FIELD_LABELS, rowMessageText } from "./asset-import-messages.ts";
import { IMPORT_FIELD_KEYS, type ImportFieldKey, type ImportRow, type RowMessage } from "./asset-import-types.ts";

export type RowFieldCheck = {
  key: ImportFieldKey;
  label: string;
  value: string;
  status: "valid" | "warning" | "error" | "empty";
  message: string | null;
  messages: RowMessage[];
};

/** Core reports only problems, so a filled field without a message passed its checks. */
export function rowFieldChecks(row: ImportRow): RowFieldCheck[] {
  return IMPORT_FIELD_KEYS.map((key) => {
    const value = row.values[key]?.trim() ?? "";
    const messages = row.messages.filter((message) => message.field === key);
    const status = messages.some((message) => message.severity === "error") ? "error"
      : messages.length ? "warning"
        : value ? "valid" : "empty";
    return {
      key,
      label: FIELD_LABELS[key],
      value,
      status,
      message: messages.map((message) => rowMessageText(message, row.values)).join(" ") || null,
      messages,
    };
  });
}

export function rowIssueCounts(row: ImportRow) {
  const errors = row.messages.filter((message) => message.severity === "error").length;
  return { errors, warnings: row.messages.length - errors };
}

/** Field cells show their own messages and details; row-wide messages and Core's own text have no cell. */
export function rowHasExtraMessages(row: ImportRow): boolean {
  return row.messages.some((message) => message.field === "row")
    || Boolean(row.errorMessage && !row.messages.some((message) => message.message === row.errorMessage));
}
