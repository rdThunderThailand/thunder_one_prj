// Real CSV parsing for AddBulkWizardPage's file-upload step. Hand-rolled
// rather than a library (papaparse etc.) — this app has no CSV dependency
// today and the shape we need (RFC4180 quoting, one header row, six known
// columns) is small enough to own directly rather than pull in a package for.
//
// Column contract matches AddBulkWizardPage's own REQUIRED_COLUMNS table and
// docs/people/add-contractor-and-bulk-field-requirements.md's "Expected input
// columns" section — first_name/last_name/email/mobile required,
// date_of_birth/id_card optional.
import { isValidThaiId } from "./schemas";

export interface BulkCsvRow {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  /** "YYYY-MM-DD", or `null` if the column was blank. */
  dateOfBirth: string | null;
  /** Digits only, or `null` if the column was blank. Not checksum-validated
   *  here — see parseBulkCsvText's per-row validation for that; by the time a
   *  row reaches `rows`, this is already a valid Thai ID. */
  idCard: string | null;
}

export interface BulkCsvRowError {
  /** 1-based, counting data rows only (matches the row numbers the wizard's
   *  own tables show), not raw file line numbers. */
  row: number;
  message: string;
}

export interface BulkCsvParseResult {
  rows: BulkCsvRow[];
  errors: BulkCsvRowError[];
}

const COLUMN_ALIASES: Record<string, keyof BulkCsvRow | undefined> = {
  first_name: "firstName",
  firstname: "firstName",
  last_name: "lastName",
  lastname: "lastName",
  email: "email",
  mobile: "mobile",
  phone: "mobile",
  date_of_birth: "dateOfBirth",
  dateofbirth: "dateOfBirth",
  id_card: "idCard",
  idcard: "idCard",
};

const THAI_MOBILE_PATTERN = /^0\d{8,9}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Excel (and Google Sheets' "Excel" export) stores a date cell as a plain
// day-count serial number under the hood; if the sheet's date formatting
// doesn't survive a CSV export, the raw serial (e.g. "37065") lands in the
// file instead of "2001-06-06" — a common real-world export artifact, not a
// malformed file. Detected and converted rather than rejecting the whole
// row, since the day-count itself is unambiguous once recognized.
const EXCEL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30); // day 0 in Excel's date system
const MIN_PLAUSIBLE_EXCEL_SERIAL = 1; // 1900-01-01
const MAX_PLAUSIBLE_EXCEL_SERIAL = 60000; // ~2064-05-31 — comfortably covers any real date_of_birth

function isPlausibleExcelSerial(value: string): boolean {
  if (!/^\d+$/.test(value)) return false;
  const serial = Number(value);
  return serial >= MIN_PLAUSIBLE_EXCEL_SERIAL && serial <= MAX_PLAUSIBLE_EXCEL_SERIAL;
}

function excelSerialToIsoDate(serial: number): string {
  return new Date(EXCEL_EPOCH_UTC_MS + serial * 86400000).toISOString().slice(0, 10);
}

/** Splits raw CSV text into records of raw string cells — handles quoted
 *  fields (commas/newlines inside `"..."`, `""` as an escaped quote),
 *  CRLF/LF, and a trailing blank line. Doesn't interpret column meaning; that
 *  happens in `parseBulkCsvText` once we know whether row 0 is a header. */
function tokenizeCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  function endField() {
    row.push(field);
    field = "";
  }
  function endRow() {
    endField();
    rows.push(row);
    row = [];
  }

  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      endField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }
  // Last record has no trailing newline to trigger endRow().
  if (field.length > 0 || row.length > 0) endRow();

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

/**
 * `hasHeaderRow` mirrors the wizard's "ข้ามแถวแรก (ใช้เป็นหัวตาราง)" checkbox:
 * when true, row 0 is a header used to map columns by name (order-independent,
 * extra columns ignored — the UI's own "คุณสามารถเพิ่มคอลัมน์อื่นๆ ได้"
 * hint); when false, every row is data, mapped positionally onto
 * first_name/last_name/email/mobile/date_of_birth/id_card in that order.
 */
export function parseBulkCsvText(text: string, hasHeaderRow: boolean): BulkCsvParseResult {
  const records = tokenizeCsv(text.replace(/^﻿/, ""));
  if (records.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "ไฟล์ว่างเปล่า ไม่มีข้อมูล" }] };
  }

  let columnOrder: (keyof BulkCsvRow | undefined)[];
  let dataRecords: string[][];

  if (hasHeaderRow) {
    columnOrder = records[0].map((cell) => COLUMN_ALIASES[cell.trim().toLowerCase()]);
    dataRecords = records.slice(1);
    const missing = (["firstName", "lastName", "email", "mobile"] as const).filter(
      (key) => !columnOrder.includes(key)
    );
    if (missing.length > 0) {
      return {
        rows: [],
        errors: [{ row: 0, message: `ไม่พบคอลัมน์ที่จำเป็นในไฟล์: ${missing.join(", ")}` }],
      };
    }
  } else {
    columnOrder = ["firstName", "lastName", "email", "mobile", "dateOfBirth", "idCard"];
    dataRecords = records;
  }

  const rows: BulkCsvRow[] = [];
  const errors: BulkCsvRowError[] = [];
  const seenEmails = new Set<string>();

  dataRecords.forEach((record, i) => {
    const rowNumber = i + 1;
    if (record.every((cell) => cell.trim() === "")) return; // blank line, not a data row

    const cells: Partial<Record<keyof BulkCsvRow, string>> = {};
    columnOrder.forEach((key, col) => {
      if (key) cells[key] = (record[col] ?? "").trim();
    });

    const firstName = cells.firstName ?? "";
    const lastName = cells.lastName ?? "";
    const email = cells.email ?? "";
    const mobile = cells.mobile ?? "";
    const rawDob = cells.dateOfBirth ?? "";
    const rawIdCard = cells.idCard ?? "";

    if (!firstName || !lastName) {
      errors.push({ row: rowNumber, message: "ไม่มีชื่อหรือนามสกุล" });
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      errors.push({ row: rowNumber, message: `อีเมลไม่ถูกต้อง: "${email}"` });
      return;
    }
    const emailKey = email.toLowerCase();
    if (seenEmails.has(emailKey)) {
      errors.push({ row: rowNumber, message: `อีเมลซ้ำในไฟล์: ${email}` });
      return;
    }
    const normalizedMobile = mobile.replace(/[\s-]/g, "");
    if (!THAI_MOBILE_PATTERN.test(normalizedMobile)) {
      errors.push({ row: rowNumber, message: `เบอร์โทรศัพท์ไม่ถูกต้อง: "${mobile}"` });
      return;
    }
    let dateOfBirth: string | null = null;
    if (rawDob) {
      if (DATE_PATTERN.test(rawDob)) {
        dateOfBirth = rawDob;
      } else if (isPlausibleExcelSerial(rawDob)) {
        dateOfBirth = excelSerialToIsoDate(Number(rawDob));
      } else {
        errors.push({ row: rowNumber, message: `วันเกิดต้องอยู่ในรูปแบบ YYYY-MM-DD: "${rawDob}"` });
        return;
      }
    }
    const digitsOnlyId = rawIdCard.replace(/\D/g, "");
    if (rawIdCard && !isValidThaiId(digitsOnlyId)) {
      errors.push({ row: rowNumber, message: `เลขบัตรประชาชนไม่ถูกต้อง: "${rawIdCard}"` });
      return;
    }

    seenEmails.add(emailKey);
    rows.push({
      firstName,
      lastName,
      email,
      mobile: normalizedMobile,
      dateOfBirth,
      idCard: digitsOnlyId || null,
    });
  });

  return { rows, errors };
}
