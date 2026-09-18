"use client";

import { useState, type ReactNode } from "react";
import { Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/lovable/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { cn } from "@/lib/utils";

// Lovable `MediaFolderSidebar` tab: underline, no pill.
const railTabClass =
  "h-10 flex-1 rounded-none text-[10px] shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none";

export type LibraryRail = {
  /** Folder rail; the function form learns whether it renders in the fixed aside (true) or
   *  in the drawer (false) — a page that controls the folder-create modal from its header
   *  must only control the aside instance, since a <dialog> inside a display:none aside
   *  cannot open. */
  folders: ReactNode | ((inAside: boolean) => ReactNode);
  tags?: ReactNode;
  defaultTab?: "folders" | "tags";
};

function Rail({ rail, inAside }: { rail: LibraryRail; inAside: boolean }) {
  const folders = typeof rail.folders === "function" ? rail.folders(inAside) : rail.folders;
  if (!rail.tags) return <div className="flex min-h-0 flex-1 flex-col p-2">{folders}</div>;
  return (
    <Tabs defaultValue={rail.defaultTab ?? "folders"} className="flex min-h-0 flex-1 flex-col">
      <TabsList className="h-10 w-full shrink-0 rounded-none border-b border-border bg-transparent p-0">
        <TabsTrigger value="folders" className={railTabClass}>Folders</TabsTrigger>
        <TabsTrigger value="tags" className={railTabClass}>Tags</TabsTrigger>
      </TabsList>
      <TabsContent value="folders" className="m-0 flex min-h-0 flex-1 flex-col p-2 data-[state=inactive]:hidden">{folders}</TabsContent>
      <TabsContent value="tags" className="m-0 flex min-h-0 flex-1 flex-col p-2 data-[state=inactive]:hidden">{rail.tags}</TabsContent>
    </Tabs>
  );
}

/** Lovable Media Library panel: toolbar → selection bar → [rail | content header + body] → footer.
 *  Below `xl` the rail moves into a left drawer opened from the toolbar. */
export function LibraryShell({ toolbar, selection, rail, title, meta, headerActions, footer, children, className }: {
  toolbar: ReactNode;
  selection?: ReactNode;
  rail?: LibraryRail;
  title: ReactNode;
  meta?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [railOpen, setRailOpen] = useState(false);
  return (
    <section className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-panel", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        {rail && (
          <Button variant="outline" size="sm" className="xl:hidden" onClick={() => setRailOpen(true)}>
            <Menu className="h-3.5 w-3.5" />
            Folders
          </Button>
        )}
        {toolbar}
      </div>
      {selection}
      <div className={cn("grid min-h-155", rail && "xl:grid-cols-[180px_minmax(0,1fr)]")}>
        {rail && <aside className="hidden border-r border-border xl:flex xl:flex-col"><Rail rail={rail} inAside /></aside>}
        <div className="flex min-w-0 flex-col p-4">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">{title}</h2>
              {meta && <p className="mt-1 text-[9px] text-muted-foreground">{meta}</p>}
            </div>
            {headerActions && <div className="flex gap-2">{headerActions}</div>}
          </div>
          {children}
        </div>
      </div>
      {footer}
      {rail && (
        <Sheet open={railOpen} onOpenChange={setRailOpen}>
          <SheetContent side="left" className="flex w-72 flex-col p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle>Library navigation</SheetTitle>
              <SheetDescription>Browse folders and tags.</SheetDescription>
            </SheetHeader>
            <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("button[data-rail-item]")) setRailOpen(false); }} className="flex min-h-0 flex-1 flex-col">
              <Rail rail={rail} inAside={false} />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </section>
  );
}

/** Lovable `BulkActionBar`. */
export function LibrarySelectionBar({ count, onClear, children }: { count: number; onClear: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-primary/20 bg-primary-soft px-3 py-2">
      <strong className="mr-2 text-[10px] text-primary">{count} selected</strong>
      {children}
      <Button variant="ghost" size="sm" className="ml-auto" onClick={onClear}><X className="h-3.5 w-3.5" />Clear Selection</Button>
    </div>
  );
}

/** Lovable toolbar search field. */
export function LibrarySearch({ value, onChange, placeholder, className }: { value: string; onChange: (value: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={cn("relative min-w-48 flex-1 sm:max-w-60", className)}>
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-9 text-[10px] shadow-none" />
    </label>
  );
}
