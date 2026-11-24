import { personnelViewTabs, type PersonnelViewTab } from "../mock-data";

interface PersonnelTabsProps {
  active: PersonnelViewTab;
  onChange: (id: PersonnelViewTab) => void;
}

// Real, client-side — but unlike the old type-filter tabs, these select a
// *view* of the roster rather than filtering rows; only "roster" (the
// default) has any real content, see mock-data.ts's header comment.
export function PersonnelTabs({ active, onChange }: PersonnelTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border">
      {personnelViewTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
            active === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
