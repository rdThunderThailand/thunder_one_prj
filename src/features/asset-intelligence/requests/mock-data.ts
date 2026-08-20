// R&D placeholder data — no backend yet. Seeded so Employee's My Requests and
// Department Manager's Requests queue both read the same records.
import { CURRENT_EMPLOYEE_ID, CURRENT_EMPLOYEE_NAME } from "@/config/current-employee";
import type { AssetRequest } from "./types";

export const mockAssetRequests: AssetRequest[] = [
  {
    id: "req-1",
    requesterId: CURRENT_EMPLOYEE_ID,
    requesterName: CURRENT_EMPLOYEE_NAME,
    description: "Need a second monitor for the new desk setup.",
    status: "waiting_it",
    requestedAt: "2026-08-16",
  },
  {
    id: "req-2",
    requesterId: "emp-201",
    requesterName: "Somchai",
    description: "Requesting a loaner laptop while mine is under repair.",
    status: "waiting_it",
    requestedAt: "2026-08-17",
  },
  {
    id: "req-3",
    requesterId: CURRENT_EMPLOYEE_ID,
    requesterName: CURRENT_EMPLOYEE_NAME,
    description: "Requested a headset for client calls.",
    status: "completed",
    requestedAt: "2026-08-05",
  },
];

export function getMockAssetRequests(): AssetRequest[] {
  return mockAssetRequests;
}
