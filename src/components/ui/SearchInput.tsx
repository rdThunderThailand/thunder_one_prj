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
      className={`flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 ${className}`}
    >
      <SearchIcon className="h-4 w-4 shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-transparent outline-none placeholder:text-zinc-400"
      />
    </div>
  );
}
