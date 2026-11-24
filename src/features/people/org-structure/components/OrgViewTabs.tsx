import { orgViewTabs, type OrgViewTabId } from "../mock-data";

interface OrgViewTabsProps {
  active: OrgViewTabId;
  onChange: (id: OrgViewTabId) => void;
}

export function OrgViewTabs({ active, onChange }: OrgViewTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border p-1">
      {orgViewTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            active === tab.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
