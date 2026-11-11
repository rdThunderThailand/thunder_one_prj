import { useId, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";
import { searchTree, treePath, type ReferenceTree, type TreeNode } from "../../domain/registration-reference-tree";
import { RegistrationField } from "./RegistrationFields";
import { cn } from "@/lib/utils";

const SEARCH_LIMIT = 50;
const rowClass = "flex min-h-10 w-full min-w-0 items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none";

export interface TreeSelectCopy {
  /** Lower-case nouns, e.g. "category" / "categories". */
  one: string; many: string;
  /** Heading over a parent's children, e.g. "Subcategories" / "Inside". */
  children: string;
  /** Where an administrator adds new rows, e.g. "Categories". */
  adminPage: string;
}

/**
 * Select field + drill-in dropdown (Shopify product category, Linear, Stripe): one action per row.
 * A row with children opens them (count ›); a row without chooses; inside a level the parent comes first, labelled as
 * the parent, then its children indented under a guide line.
 */
export function RegistrationTreeSelect({ name, label, copy, tree, value, selectedLabel = "", required = true, error, maxLength, onChange }: {
  name: string; label: string; copy: TreeSelectCopy; tree: ReferenceTree; value: string;
  /** Shown when the value isn't in the active tree (e.g. an asset's current inactive category). */
  selectedLabel?: string; required?: boolean; error?: string; maxLength: number; onChange: (node: TreeNode) => void;
}) {
  const selectedPath = treePath(tree, value);
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const names = selectedPath.length ? selectedPath.map((id) => tree.byId.get(id)?.name ?? "") : value && selectedLabel ? [selectedLabel] : [];
  const parent = tree.byId.get(level);
  const results = searchTree(tree, search, SEARCH_LIMIT);
  const levelRows = tree.children.get(level) ?? [];

  function toggle(next: boolean) {
    // Reopen where the current choice lives, with a fresh search.
    if (next) { setLevel(selectedPath.at(-2) ?? ""); setSearch(""); }
    setOpen(next);
  }
  function choose(node: TreeNode) {
    onChange(node);
    setOpen(false);
  }
  const option = (node: TreeNode, extra: Partial<OptionProps> = {}) => (
    <Option key={node.id} tree={tree} node={node} selectedPath={selectedPath} onChoose={choose} onOpen={setLevel} {...extra} />
  );

  return (
    <RegistrationField name={name} label={label} required={required} error={error}>
      <Popover open={open} onOpenChange={toggle}>
        <PopoverTrigger asChild>
          <Button
            id={`registration-${name}`}
            variant="outline"
            className="h-auto min-h-10 w-full justify-between gap-3 py-2 text-start font-normal"
            aria-label={`${label}${required ? " (required)" : ""}: ${names.join(" › ") || "Not selected"}`}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `registration-${name}-error` : undefined}
          >
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1 whitespace-normal">
              {names.length ? names.map((part, index) => (
                <span key={`${index}-${part}`} className="flex min-w-0 items-center gap-1">
                  {index > 0 && <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />}
                  <span className={cn("wrap-anywhere", index === names.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {part}
                  </span>
                </span>
              )) : <span className="text-muted-foreground">Select a {copy.one}</span>}
            </span>
            <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={12}
          aria-label={`Choose a ${copy.one}`}
          className="flex max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-control p-0 motion-reduce:animate-none"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            input.current?.focus();
          }}
        >
          <div className="relative shrink-0 border-b border-border p-2">
            <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={input}
              type="search"
              aria-label={`Search ${copy.many}`}
              placeholder={`Search ${copy.many}…`}
              autoComplete="off"
              className="border-0 pl-9 shadow-none focus-visible:ring-0 max-sm:h-10"
              maxLength={maxLength}
              value={search}
              aria-controls={listId}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {!search.trim() && (parent ? (
            <button type="button" className={cn(rowClass, "shrink-0 rounded-none border-b border-border text-xs font-semibold text-muted-foreground")}
              onClick={() => setLevel(parent.parentId && tree.byId.has(parent.parentId) ? parent.parentId : "")}>
              <ChevronLeftIcon aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="min-w-0 flex-1 wrap-anywhere">{parent.name}</span>
            </button>
          ) : (
            <p className="shrink-0 px-4 pb-1 pt-3 text-2xs font-medium text-muted-foreground">All {copy.many}</p>
          ))}
          <ul id={listId} aria-label={label} className="min-h-0 max-h-80 space-y-0.5 overflow-y-auto overscroll-contain p-1.5">
            {search.trim() ? (
              results.length ? results.map((node) => option(node, {
                onOpen: undefined,
                hint: treePath(tree, node.parentId).map((id) => tree.byId.get(id)?.name).join(" › ") || undefined,
              })) : <Empty>No matching {copy.many}. Try another name.</Empty>
            ) : parent ? (
              <>
                {option(parent, { onOpen: undefined, hint: `Parent ${copy.one} · choose it as a whole`, emphasis: true })}
                <li className="px-3 pb-1 pt-2 text-2xs font-medium text-muted-foreground">{copy.children} ({levelRows.length})</li>
                <li>
                  {/* Indented under a guide line so children read as inside the parent. */}
                  <ul aria-label={`${copy.children} of ${parent.name}`} className="ml-4 space-y-0.5 border-l border-border pl-2">
                    {levelRows.map((node) => option(node))}
                  </ul>
                </li>
              </>
            ) : levelRows.length ? levelRows.map((node) => option(node))
              : <Empty>No active {copy.many} yet. An administrator can add one in {copy.adminPage}.</Empty>}
          </ul>
        </PopoverContent>
      </Popover>
    </RegistrationField>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <li className="px-3 py-6 text-center text-xs text-muted-foreground">{children}</li>;
}

interface OptionProps {
  tree: ReferenceTree; node: TreeNode; selectedPath: string[]; hint?: string; emphasis?: boolean;
  onChoose: (node: TreeNode) => void; onOpen?: (id: string) => void;
}

function Option({ tree, node, selectedPath, hint, emphasis = false, onChoose, onOpen }: OptionProps) {
  const count = tree.children.get(node.id)?.length ?? 0;
  const drills = Boolean(onOpen && count);
  const selected = selectedPath.at(-1) === node.id;
  const holdsSelection = drills && !selected && selectedPath.includes(node.id);
  return (
    <li>
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        aria-label={drills ? `${node.name}, ${count} inside` : undefined}
        className={cn(rowClass, selected && "bg-accent hover:bg-accent")}
        onClick={() => (drills ? onOpen?.(node.id) : onChoose(node))}
      >
        <span className="min-w-0 flex-1">
          <span className={cn("block wrap-anywhere text-foreground", (selected || emphasis) && "font-semibold")}>{node.name}</span>
          {(hint || holdsSelection) && (
            <span className={cn("block text-xs wrap-anywhere", holdsSelection ? "text-accent-foreground" : "text-muted-foreground")}>
              {holdsSelection ? "Contains your selection" : hint}
            </span>
          )}
        </span>
        {node.tag && <Badge color="zinc" variant="pill" className="shrink-0 whitespace-nowrap capitalize">{node.tag}</Badge>}
        {selected && <CheckIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />}
        {drills && (
          <span aria-hidden="true" className="flex shrink-0 items-center gap-0.5 text-xs tabular-nums text-muted-foreground">
            {count}
            <ChevronRightIcon className="size-3.5" />
          </span>
        )}
      </button>
    </li>
  );
}
