import { getMockWorkOrders, type WorkOrder, type WorkOrderStatus } from "../mock-data";
import { WorkOrderCard } from "./WorkOrderCard";

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

// Every work order assigned to the technician, across all dates -- not just
// today (that's My Work's job). Grouped so in-progress/overdue work surfaces
// first.
export function AssignedPage() {
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
