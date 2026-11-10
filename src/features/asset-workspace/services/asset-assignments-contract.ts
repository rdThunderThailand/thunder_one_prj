import { z } from "zod";

const reference = z.object({ id: z.guid(), name: z.string().nullable() });
export const currentAssignmentSchema = z.object({
  assignmentId: z.guid(), assignedAt: z.string(),
  custodian: reference.extend({
    type: z.enum(["person", "org_unit"]), avatarUrl: z.string().nullable(), department: reference.nullable(),
  }),
  location: reference.nullable(),
  asset: z.object({
    id: z.guid(), name: z.string(), assetTag: z.string(), serialNumber: z.string().nullable(),
    category: reference.nullable(), thumbnailUrl: z.string().nullable(),
    lifecycleStatus: z.string(), condition: z.string().nullable(), updatedAt: z.string(),
  }),
});
export type CurrentAssignment = z.infer<typeof currentAssignmentSchema>;
export const currentAssignmentsPageSchema = z.object({
  data: z.array(currentAssignmentSchema), page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(200), total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
}).refine((page) => page.totalPages === Math.ceil(page.total / page.pageSize)
  && page.data.length <= page.pageSize && new Set(page.data.map((row) => row.assignmentId)).size === page.data.length);

const target = z.object({ type: z.enum(["person", "org_unit"]), id: z.guid(), name: z.string().nullable(), avatarUrl: z.string().nullable() });
export const assignmentEventSchema = z.object({
  id: z.guid(), action: z.enum(["Assign", "Transfer", "Return"]), at: z.string(),
  from: target.nullable(), to: target.nullable(), location: reference.nullable(),
});
export type AssignmentEvent = z.infer<typeof assignmentEventSchema>;
export const assignmentEventsPageSchema = z.object({ data: z.array(assignmentEventSchema), total: z.number().int().nonnegative() });
export type AssignmentEventsPage = z.infer<typeof assignmentEventsPageSchema>;
