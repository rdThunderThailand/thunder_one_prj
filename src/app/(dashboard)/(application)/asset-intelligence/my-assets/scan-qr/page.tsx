import { PageHeader } from "@/components/layout/PageHeader";
import { RegisterAssetPage } from "@/features/asset-intelligence/assets";

// Employee/User — "Scan QR" / register a received asset (requirement doc EMP-01).
export default function ScanQrRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Scan QR" subtitle="Register an asset you've received." />
      <RegisterAssetPage />
    </div>
  );
}
