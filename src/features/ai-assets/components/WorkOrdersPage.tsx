import { getMockWorkOrders, WorkOrderCard, type WorkOrder, type WorkOrderStatus } from "@/features/ai-work-orders";

const SECTIONS: { status: WorkOrderStatus; label: string }[] = [
  { status: "in_progress", label: "In Progress" },
  { status: "overdue", label: "Overdue" },
  { status: "assigned", label: "Assigned" },
  { status: "completed", label: "Completed" },
];

function Section({ label, orders }: { label: string; orders: WorkOrder[] }) {
  if (orders.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label} ({orders.length})
      </h2>
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <WorkOrderCard key={order.id} workOrder={order} />
        ))}
      </div>
    </div>
  );
}

// Org-wide view (requirement doc AM-06) -- every work order across every
// technician, not scoped to "me" the way Technician's own Assigned page is.
// This mock world only has one implied technician's worth of data, so the
// content mirrors that page's grouping; a real version would filter/sort by
// assignee too.
export function WorkOrdersPage() {
  const workOrders = getMockWorkOrders();

  return (
    <div className="flex flex-col gap-6">
      {SECTIONS.map((section) => (
        <Section
          key={section.status}
          label={section.label}
          orders={workOrders.filter((w) => w.status === section.status)}
        />
      ))}
    </div>
  );
}
