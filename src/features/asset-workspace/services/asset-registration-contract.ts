import { z } from "zod";

// Existing reference IDs can be PostgreSQL UUIDs without RFC version/variant bits.
// Keep the hexadecimal UUID shape check without rejecting those returned records.
const reference = z.object({ id: z.guid(), name: z.string().nullable() });
export const registrationOptionsSchema = z.object({
  categories: z.array(reference.extend({ name: z.string(), is_serial_required: z.boolean() })),
  locations: z.array(reference.extend({ parent_location_id: z.guid().nullable(), location_type: z.string().nullable() })),
  persons: z.array(reference),
  orgUnits: z.array(reference.extend({ parent_department_id: z.guid().nullable() })),
  initialConditions: z.array(z.enum(["Good", "Fair"])).min(1),
  canOverrideSerial: z.boolean(),
  tagGeneration: z.object({ modes: z.array(z.enum(["manual", "automatic"])).min(1), allocatedOn: z.literal("creation") }),
  submission: z.object({ method: z.literal("POST"), path: z.string(), canSubmit: z.boolean(), reason: z.string().nullable().optional() }),
});

export type RegistrationOptions = z.infer<typeof registrationOptionsSchema>;
export type RegistrationReadResult =
  | { ok: true; data: RegistrationOptions }
  | { ok: false; status: number; message: string };
