import { z } from "zod";

export const LOOKUP_TYPES = ["auto", "asset_tag", "barcode", "serial_number", "qr_reference"] as const;
export type LookupType = (typeof LOOKUP_TYPES)[number];

export const lookupQuerySchema = z.object({
  code: z.string().max(2048)
    .refine((value) => !/[\u0000-\u001f\u007f-\u009f]/.test(value), "Remove control characters from the identifier.")
    .transform((value) => value.trim())
    .pipe(z.string().min(1, "Enter an Asset Tag, serial number or Asset Profile QR reference.")),
  type: z.enum(LOOKUP_TYPES).default("auto"),
}).strict().refine(({ code, type }) => {
  const reference = type === "qr_reference" || (type === "auto" && /^https?:\/\//i.test(code));
  return reference || code.length <= 250;
}, "Plain identifiers must be no longer than 250 characters.");

export type LookupQuery = z.infer<typeof lookupQuerySchema>;

export const lookupDataSchema = z.object({
  outcome: z.literal("found"),
  identifier: z.object({ type: z.enum(LOOKUP_TYPES), value: z.string() }),
  asset: z.object({
    id: z.guid(),
    name: z.string().nullable(),
    asset_code: z.string().nullable(),
    serial_number: z.string().nullable(),
    category_name: z.string().nullable(),
    location_name: z.string().nullable(),
    status: z.string().nullable(),
    condition: z.string().nullable(),
  }),
});

export const lookupResponseSchema = z.object({ success: z.literal(true), data: lookupDataSchema });
export type LookupData = z.infer<typeof lookupDataSchema>;
export type LookupFailure = {
  kind: "invalid" | "unauthenticated" | "forbidden" | "not_found" | "ambiguous" | "error";
  status: number;
  message: string;
};
export type LookupResult = { kind: "found"; data: LookupData } | LookupFailure;

export function lookupFailure(status: number): LookupFailure {
  switch (status) {
    case 400:
      return { kind: "invalid", status, message: "This identifier or QR reference is invalid. Check it and try again." };
    case 401:
      return { kind: "unauthenticated", status, message: "Your session has expired. Sign in again to identify assets." };
    case 403:
      return { kind: "forbidden", status, message: "You don't have permission to identify assets in this organization." };
    case 404:
      // Unknown, foreign-organization and inaccessible records must be indistinguishable.
      return { kind: "not_found", status, message: "No asset matching this identifier was found in your authorized scope." };
    case 409:
      return { kind: "ambiguous", status, message: "More than one asset matches. Enter a specific Asset Tag or scan an Asset Profile QR code." };
    default:
      return { kind: "error", status, message: "The asset lookup service is unavailable. Please try again." };
  }
}
