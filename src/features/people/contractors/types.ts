// Row shapes for the Contractor roster (`/people/contractors`), filled from
// `GET /tenants/:id/members` filtered to `member_type === "contractor"` by
// `./core-mapper.ts`. `company`/`coordinatorName`/`coordinatorRole`/
// `contractStartLabel`/`contractEndLabel` have no list-level data in Core
// (`membership_contract` is per member and has no company or end date), so
// they stay `null` and render "-".
export type ContractorStatus = "active" | "expiring-soon" | "expired" | "pending-approval";

export interface ContractorRow {
  id: string;
  name: string;
  code: string;
  company: string | null;
  role: string;
  unit: string;
  coordinatorName: string | null;
  coordinatorRole: string | null;
  contractStartLabel: string | null;
  contractEndLabel: string | null;
  status: ContractorStatus;
}

export interface ContractorTab {
  id: ContractorStatus | "all";
  label: string;
  count: number;
}
