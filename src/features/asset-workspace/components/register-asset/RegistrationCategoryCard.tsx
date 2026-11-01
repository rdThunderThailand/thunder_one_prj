import Image from "next/image";
import { useState } from "react";
import { CategoryIcon, CheckCircleIcon } from "@/components/ui/icons";
import type { ReferenceItem } from "../../services/registration-selector-contract";

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
    <label className={`relative flex min-h-20 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 p-2 text-center text-xs has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-ring ${selected ? "bg-info-muted text-primary" : "bg-card text-foreground hover:bg-muted"}`}>
      <input type="radio" name="asset-category" value={category.id} aria-label={path} checked={selected} onChange={onSelect} className="sr-only" />
      {source && failedSource !== source ? (
        <Image src={source} alt="" width={20} height={20} unoptimized referrerPolicy="no-referrer" className="h-5 w-5 object-contain" onError={() => setFailedSource(source)} />
      ) : (
        <CategoryIcon className="h-5 w-5" />
      )}
      <span className="w-full break-words font-medium">{category.name}</span>
      {parentPath && <span className="w-full truncate text-2xs text-muted-foreground" title={parentPath}>{parentPath}</span>}
      {selected && <CheckCircleIcon className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />}
    </label>
  );
}
