import { departureTabs, type DepartureTab } from "../mock-data";

interface DeparturesTabsProps {
  active: DepartureTab["id"];
  onChange: (id: DepartureTab["id"]) => void;
}

// Real, client-side — same pattern as people/personnel's PersonnelTabs.
export function DeparturesTabs({ active, onChange }: DeparturesTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border">
      {departureTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
            active === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
          <span
            className={`rounded-full px-1.5 py-0.5 text-[11px] ${
              active === tab.id
                ? "bg-accent text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
