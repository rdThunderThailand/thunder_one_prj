// R&D placeholder reference data — locations and departments, read by
// AddAssetForm's selects, AssetsListPage's Pass to Department action, and
// LocationsPage. No backend yet; a real version would come from
// GET /api/v1/locations and a departments endpoint.
export interface LocationOption {
  id: string;
  name: string;
}

export const mockLocations: LocationOption[] = [
  { id: "bangkok-server-room", name: "Server Room · Bangkok HQ" },
  { id: "bangkok-floor-3", name: "Floor 3 · Bangkok HQ" },
  { id: "bangkok-floor-4", name: "Floor 4 · Bangkok HQ" },
  { id: "central-world-entrance", name: "Central World – Entrance" },
];

export interface DepartmentOption {
  id: string;
  name: string;
}

export const mockDepartments: DepartmentOption[] = [
  { id: "sales", name: "Sales Department" },
  { id: "it", name: "IT Department" },
  { id: "accounting", name: "Accounting Department" },
];
