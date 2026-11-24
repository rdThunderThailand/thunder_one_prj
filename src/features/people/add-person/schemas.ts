import { z } from "zod";

// Standard Thai national ID checksum (mod-11 on the first 12 digits,
// weighted 13..2, compared against the 13th digit) — catches typos (transposed
// or mistyped digits) that a plain "13 digits" length check would miss.
// Exported for bulk-csv.ts, which runs the same check on the CSV's optional
// `id_card` column.
export function isValidThaiId(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(digits[i]) * (13 - i);
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === Number(digits[12]);
}

const REQUIRED_MESSAGE = "กรุณากรอกข้อมูลนี้";

const requiredText = (message = REQUIRED_MESSAGE) => z.string().trim().min(1, message);

const emailSchema = requiredText("กรุณากรอกอีเมล").pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง"));

// Not every hire has their ID card/passport ready at intake time (e.g. a
// batch onboarded before HR has collected every document) — only validate
// the format when something was actually typed in, same pattern as
// optionalThaiPhoneSchema below.
const optionalThaiIdCardSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || isValidThaiId(value), {
    message: "เลขบัตรประชาชนไม่ถูกต้อง (ต้องเป็นตัวเลข 13 หลักและผ่านการตรวจสอบ)",
  });

const optionalIdOrPassportSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || isValidThaiId(value) || /^[A-Za-z0-9]{6,9}$/.test(value.replace(/\s/g, "")), {
    message: "เลขบัตรประชาชน หรือเลขที่หนังสือเดินทางไม่ถูกต้อง",
  });

// Optional field — only validated when the user actually types something in it.
const optionalThaiPhoneSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^0\d{8,9}$/.test(value.replace(/[\s-]/g, "")), {
    message: "เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก)",
  });

export const employeeStep0Schema = z.object({
  firstNameTh: requiredText("กรุณากรอกชื่อ (ภาษาไทย)"),
  lastNameTh: requiredText("กรุณากรอกนามสกุล (ภาษาไทย)"),
  idCardNumber: optionalThaiIdCardSchema,
  email: emailSchema,
  phone: optionalThaiPhoneSchema,
});

export const employeeStep1Schema = z.object({
  position: requiredText("กรุณากรอกตำแหน่งงาน"),
  roleCode: requiredText("ไม่พบบทบาท (Role) ที่ใช้ได้ในองค์กรนี้"),
  startDate: requiredText("กรุณาเลือกวันที่เริ่มงาน"),
});

export const contractorStep0Schema = z.object({
  firstNameTh: requiredText("กรุณากรอกชื่อ (ภาษาไทย)"),
  lastNameTh: requiredText("กรุณากรอกนามสกุล (ภาษาไทย)"),
  idOrPassportNumber: optionalIdOrPassportSchema,
  email: emailSchema,
  phone: optionalThaiPhoneSchema,
  secondaryPhone: optionalThaiPhoneSchema,
});

export const contractorStep1Schema = z.object({
  position: requiredText("กรุณากรอกตำแหน่งงาน"),
  roleCode: requiredText("ไม่พบบทบาท (Role) ที่ใช้ได้ในองค์กรนี้"),
});

export const bulkStep0Schema = z.object({
  fileName: requiredText("กรุณาอัปโหลดไฟล์ก่อนดำเนินการต่อ"),
});

export const bulkStep1Schema = z.object({
  unitId: requiredText("กรุณาเลือกหน่วยงาน"),
  position: requiredText("กรุณากรอกตำแหน่งงาน"),
  startDate: requiredText("กรุณาเลือกวันที่เริ่มงาน"),
});

/** Prefers the lowest-privilege role a tenant has (`operator_technician`).
 *  Deliberately does NOT fall back to "whatever role Core listed first" —
 *  that used to silently default new hires to admin-tier roles (observed:
 *  a tenant whose `/roles` list only contained super_admin/company_admin
 *  defaulted every new hire to Super Administrator). Returns "" when no
 *  operator_technician role exists, so the wizard shows an empty required
 *  select and forces HR to explicitly pick a role instead of guessing. */
export function pickDefaultRoleCode(roles: { code: string }[] | null | undefined): string {
  return roles?.find((r) => r.code === "operator_technician")?.code ?? "";
}

/** Flattens a ZodError into `{ fieldName: firstMessage }`, the shape every
 *  wizard's `errors` state and `<ErrorText>` expect. */
export function zodErrorsToFieldMap(error: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !map[key]) map[key] = issue.message;
  }
  return map;
}
