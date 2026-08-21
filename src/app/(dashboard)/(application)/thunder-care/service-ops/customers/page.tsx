import { PageHeader } from "@/components/layout/PageHeader";
import { CustomersPage } from "@/features/thunder-care/service-ops";

// Thunder Care — "Customers" (requirement doc §4.6).
export default function CustomersRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customers" subtitle="Every customer and their open requests." />
      <CustomersPage />
    </div>
  );
}
