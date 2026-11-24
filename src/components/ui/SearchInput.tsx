import * as React from "react";
import { SearchIcon } from "./icons";
import { Input } from "./Input";
import { cn } from "@/lib/utils";

export const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & { label?: string }
>(({ className, label, placeholder = "Search anything...", ...props }, ref) => {
  const accessibleName = label ?? (typeof placeholder === "string" ? placeholder : "Search");
  return (
    <div className={cn("relative w-full min-w-48", className)}>
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={ref}
        type="search"
        role="searchbox"
        aria-label={accessibleName}
        placeholder={placeholder}
        className="pl-9"
        {...props}
      />
    </div>
  );
});
SearchInput.displayName = "SearchInput";
