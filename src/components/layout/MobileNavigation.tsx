"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { MenuIcon, XIcon } from "@/components/ui/icons";
import { Sidebar } from "./Sidebar";

export function MobileNavigation({ sidebarProps, children }: {
  sidebarProps: ComponentProps<typeof Sidebar>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  if (openPath !== null && openPath !== pathname) setOpenPath(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpenPath(null); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <Dialog open={openPath === pathname} onOpenChange={(open) => setOpenPath(open ? pathname : null)}>
      <div className="hidden h-full shrink-0 md:block">
        <Sidebar {...sidebarProps} />
      </div>
      <DialogContent
        aria-describedby={undefined}
        showCloseButton={false}
        overlayClassName="data-[state=closed]:animate-none!"
        className="inset-y-0 left-0 top-0 flex h-dvh w-72 max-w-full translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 data-[state=open]:animate-none data-[state=closed]:animate-none! sm:rounded-none"
      >
        <DialogTitle className="sr-only">Workspace navigation</DialogTitle>
        <DialogClose asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Close navigation" className="absolute right-2 top-2 z-10">
            <XIcon aria-hidden="true" className="h-4 w-4" />
          </Button>
        </DialogClose>
        <div
          className="h-full min-h-0 [&>aside]:w-full"
          onClickCapture={(event) => {
            if (event.target instanceof Element && event.target.closest("a[href]")) setOpenPath(null);
          }}
        >
          <Sidebar {...sidebarProps} isMobile />
        </div>
      </DialogContent>
      {children}
    </Dialog>
  );
}

export function MobileNavigationTrigger() {
  return (
    <DialogTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="Open navigation" className="shrink-0 md:hidden">
        <MenuIcon aria-hidden="true" className="h-5 w-5" />
      </Button>
    </DialogTrigger>
  );
}
