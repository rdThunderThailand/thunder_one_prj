import { z } from "zod";
import { ASSET_CONDITIONS, type AssetCondition } from "../domain/asset-condition";
import { ASSET_STATUSES, type AssetStatus } from "../domain/asset-status";

/** Unfiltered counts for the four tiles (`byCondition` already leaves Disposed out). */
export const lifecycleCountsSchema = z.object({
  byStatus: z.array(z.object({ status: z.enum(ASSET_STATUSES), count: z.number() })),
  byCondition: z.array(z.object({ condition: z.enum(ASSET_CONDITIONS), count: z.number() })),
}).transform(({ byStatus, byCondition }) => ({
  byStatus: Object.fromEntries(byStatus.map((entry) => [entry.status, entry.count])) as Partial<Record<AssetStatus, number>>,
  byCondition: Object.fromEntries(byCondition.map((entry) => [entry.condition, entry.count])) as Partial<Record<AssetCondition, number>>,
}));
export type LifecycleCounts = z.infer<typeof lifecycleCountsSchema>;
