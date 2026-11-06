import type { ReactNode } from "react";
import {
  CheckIcon,
  FileTextIcon,
  MonitorIcon,
  PlusIcon,
  UploadIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type RegistrationMethod = "single" | "bulk";

const METHODS = {
  single: {
    title: "Single Asset",
    icon: MonitorIcon,
    badge: PlusIcon,
    circle: "bg-info-muted text-primary",
    bullet: "bg-primary text-primary-foreground",
    description: "Register one asset with detailed information",
    features: [
      "Fill in asset information step by step",
      "Set location, custody, warranty and more",
      "Suitable for new or unique assets",
    ],
  },
  bulk: {
    title: "Bulk Assets",
    icon: FileTextIcon,
    badge: UploadIcon,
    circle: "bg-success-muted text-success",
    bullet: "bg-success text-success-foreground",
    description: "Register multiple assets using file import or template",
    features: [
      "Upload Excel or CSV file",
      "Use a template with required fields",
      "Validate before creating assets",
      "Suitable for bulk registration or similar assets",
    ],
  },
};

export function RegistrationMethodCard({
  method,
  selected,
  onSelect,
  children,
}: {
  method: RegistrationMethod;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  const { title, icon: Icon, badge: Badge, circle, bullet, description, features } = METHODS[method];
  return (
    <section
      aria-label={title}
      onClick={onSelect}
      className={cn(
        "relative grid cursor-pointer gap-4 rounded-card border bg-card p-4 sm:grid-cols-[auto_1fr]",
        selected ? "border-primary" : "border-border",
      )}
    >
      <label className="absolute right-2 top-2 flex size-10 cursor-pointer items-center justify-center">
        <input
          type="radio"
          name="registration-method"
          value={method}
          checked={selected}
          onChange={onSelect}
          aria-label={title}
          className="peer sr-only"
        />
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full border peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
          )}
        >
          {selected && <CheckIcon className="h-3 w-3" />}
        </span>
      </label>
      <div className={cn("relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full lg:h-28 lg:w-28", circle)}>
        <Icon className="h-12 w-12 lg:h-16 lg:w-16" />
        <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
          <Badge className="h-4 w-4" />
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="pr-8">
          <h2 className="text-sm font-bold">{title}</h2>
          <p className="mt-1 max-w-64 text-xs text-muted-foreground">
            {description}
          </p>
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2"
            >
              <span className={cn("mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full", bullet)}>
                <CheckIcon className="h-2 w-2" />
              </span>
              <span className="min-w-0">{feature}</span>
            </li>
          ))}
        </ul>
        {children}
      </div>
    </section>
  );
}
