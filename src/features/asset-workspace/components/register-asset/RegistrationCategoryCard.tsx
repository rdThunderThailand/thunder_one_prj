import Image from "next/image";
import { useState } from "react";
import { CategoryIcon, CheckCircleIcon } from "@/components/ui/icons";
import type { RegistrationOptions } from "../../services/asset-registration-contract";

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
  category: RegistrationOptions["categories"][number]; path: string; parentPath: string;
  selected: boolean; onSelect: () => void;
}) {
  const source = categoryIconSource(category.icon_url);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <label className={`relative flex min-h-24 min-w-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-control border p-3 text-center text-xs has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${selected ? "border-primary bg-info-muted text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}>
      <input type="radio" name="asset-category" value={category.id} aria-label={path} checked={selected} onChange={onSelect} className="sr-only" />
      {source && failedSource !== source ? (
        <Image src={source} alt="" width={24} height={24} unoptimized referrerPolicy="no-referrer" className="h-6 w-6 object-contain" onError={() => setFailedSource(source)} />
      ) : (
        <CategoryIcon className="h-6 w-6" />
      )}
      <span className="w-full break-words font-medium">{category.name}</span>
      {parentPath && <span className="w-full break-words text-2xs text-muted-foreground">{parentPath}</span>}
      {selected && <CheckCircleIcon className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />}
    </label>
  );
}
