import { useId, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/lovable/button";
import { CategoryIcon, ChevronDownIcon, LightbulbIcon } from "@/components/ui/icons";
import type { CategoryDraft } from "../../domain/category-form";
import { CategoryStatusBadge } from "./CategoryStatusBadge";

const guidance = [
  { title: "Use a clear, reusable name", body: "Choose a name that describes a group of similar assets and is easy for your team to recognize." },
  { title: "Add a parent only when needed", body: "Choose an active parent to organize related categories, or keep this category at Top level." },
  { title: "Choose a lasting category code", body: "Leave the code blank to generate one. Custom codes are saved in uppercase and cannot be changed later." },
];

/** Preview only supported fields; it never generates a code or changes the draft. */
export function CategoryFormPreview({ draft, parentName }: { draft: CategoryDraft; parentName: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();
  const helpId = useId();
  const name = draft.name.trim();
  const details = [
    ["Code", draft.code.trim().toUpperCase() || "Generated on creation"],
    ["Parent Category", parentName],
    ["Description", draft.description.trim() || "—"],
    ["Serial Number", draft.isSerialRequired ? "Required" : "Optional"],
  ];

  return (
    <aside aria-label="Category preview and guidance" className="min-w-0 space-y-3">
      <Button
        variant="outline"
        className="h-10 w-full justify-between @min-4xl/category-form:hidden"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        Preview and guidelines
        <ChevronDownIcon aria-hidden="true" className={`size-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </Button>
      <div id={panelId} className={`space-y-3 @min-4xl/category-form:block ${open ? "block" : "hidden"}`}>
        <Card role="region" aria-labelledby={titleId} className="min-w-0 space-y-4 p-4">
          <div className="space-y-1">
            <h2 id={titleId} className="text-sm font-semibold text-foreground">Preview</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">See how your category information will appear.</p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-3 border-b border-border pb-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-control bg-accent text-accent-foreground">
              <CategoryIcon aria-hidden="true" className="size-5" />
            </span>
            <h3 className={`min-w-0 flex-1 text-sm font-semibold wrap-anywhere ${name ? "text-foreground" : "text-muted-foreground"}`}>
              {name || "Category name"}
            </h3>
            <CategoryStatusBadge status="Active" />
          </div>
          <dl className="divide-y divide-border text-xs">
            {details.map(([label, value]) => (
              <div key={label} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3 py-3 first:pt-0 last:pb-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="min-w-0 leading-relaxed text-foreground wrap-anywhere">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card role="region" aria-labelledby={helpId} className="space-y-4 p-4">
          <h2 id={helpId} className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <LightbulbIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
            Guidelines
          </h2>
          <ul className="space-y-4">
            {guidance.map((item) => (
              <li key={item.title} className="space-y-1">
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </aside>
  );
}
