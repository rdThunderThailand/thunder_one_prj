// AssetRequest — an employee asking their Department to use/borrow an asset
// (requirement doc EMP-03 / DM-03 flow). Read by both the Employee's own "My
// Requests" view and the Department Manager's incoming requests queue.
export type AssetRequestStatus = "waiting_it" | "approved" | "rejected" | "completed";

export interface AssetRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  description: string;
  status: AssetRequestStatus;
  requestedAt: string;
}
