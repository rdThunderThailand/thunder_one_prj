import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { MyWorkPage } from "@/features/thunder-care/work-orders";

// Technician — "My Work" (requirement doc §4.4).
export default function WorkOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Work"
        subtitle="Tuesday, 11 August"
        actions={
          <Button variant="secondary">
            <SearchIcon className="h-4 w-4" /> Scan QR
          </Button>
        }
      />
      <MyWorkPage />
    </div>
  );
}
