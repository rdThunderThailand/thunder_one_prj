import { SearchIcon } from "./icons";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  placeholder = "Search anything...",
  className = "",
}: SearchInputProps) {
  return (
    <div
      className={`flex w-full items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground ${className}`}
    >
      <SearchIcon className="h-4 w-4 shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-transparent outline-none placeholder:text-t1-gray-400"
      />
    </div>
  );
}
