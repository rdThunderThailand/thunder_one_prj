const shortcuts = [
  { label: "Create Publication", key: "P" },
  { label: "Media Library", key: "M" },
  { label: "Calendar", key: "C" },
  { label: "Reports", key: "R" },
  { label: "Live View", key: "L" },
];

export function ShortcutsBar() {
  return (
    <footer className="flex items-center gap-5 border-t border-zinc-200 bg-white px-6 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <span className="font-medium text-zinc-400 dark:text-zinc-500">⌘ Shortcuts</span>
      {shortcuts.map((shortcut) => (
        <span key={shortcut.label} className="flex items-center gap-1.5">
          {shortcut.label}
          <kbd className="rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] dark:border-zinc-700">
            {shortcut.key}
          </kbd>
        </span>
      ))}
    </footer>
  );
}
