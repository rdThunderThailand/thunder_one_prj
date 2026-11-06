import Image from "next/image";
import { useState, type ReactNode } from "react";
import { CategoryIcon, CheckCircleIcon } from "@/components/ui/icons";
import type { ReferenceItem } from "../../services/registration-selector-contract";
import { cn } from "@/lib/utils";

export function RegistrationCategoryGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 @min-xs/categories:grid-cols-2 @min-lg/categories:grid-cols-3 @min-2xl/categories:grid-cols-4">
      {children}
    </div>
  );
}

function categoryIconSource(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function RegistrationCategoryCard({ category, path, parentPath, selected, onSelect }: {
  category: ReferenceItem; path: string; parentPath: string;
  selected: boolean; onSelect: () => void;
}) {
  const source = categoryIconSource(category.icon_url);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <label
      className={cn(
        "relative flex min-h-24 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2 p-3 text-center text-xs has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-ring",
        selected ? "bg-accent text-accent-foreground" : "bg-card text-foreground hover:bg-muted",
      )}
    >
      <input
        type="radio"
        name="asset-category"
        value={category.id}
        aria-label={path}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      {source && failedSource !== source ? (
        <Image
          src={source}
          alt=""
          width={24}
          height={24}
          unoptimized
          referrerPolicy="no-referrer"
          className="size-6 object-contain"
          onError={() => setFailedSource(source)}
        />
      ) : (
        <CategoryIcon aria-hidden="true" className="size-6 shrink-0" />
      )}
      <span className="w-full break-words font-semibold leading-relaxed">
        {category.name?.trim() || category.code || "Unnamed category"}
      </span>
      {parentPath && (
        <span className="w-full break-words leading-relaxed text-muted-foreground">
          {parentPath}
        </span>
      )}
      {selected && (
        <CheckCircleIcon aria-hidden="true" className="absolute right-2 top-2 size-4 text-accent-foreground" />
      )}
    </label>
  );
}
