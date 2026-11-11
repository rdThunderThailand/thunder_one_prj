"use client";

// Write buttons for the Locations pages: Add / Add Child (drawer), Edit (drawer), Activate, Deactivate (confirm).
// Shown to everyone; Core refuses non–Asset Admins with 403 and the message says so.
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { EditIcon, MoreIcon, PlusIcon } from "@/components/ui/icons";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Button } from "@/components/ui/lovable/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import type { Location, LocationDetail } from "../../domain/location";
import { setLocationStatusAction, type LocationWriteResult } from "../../services/asset-locations-actions";
import { LocationFormDrawer, type LocationFormMode } from "./LocationFormDrawer";

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

function DrawerButton({
  mode,
  locations,
  label,
  variant = "default",
}: {
  mode: LocationFormMode;
  locations: Location[];
  label: string;
  variant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const Icon = mode.kind === "edit" ? EditIcon : PlusIcon;

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setOpen(true)}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
      {open && (
        <LocationFormDrawer
          mode={mode}
          locations={locations}
          open
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}

export function AddLocationButton({ locations }: { locations: Location[] }) {
  return (
    <DrawerButton
      mode={{ kind: "add" }}
      locations={locations}
      label="Add Location"
    />
  );
}

export function AddChildLocationButton({ parent, locations }: { parent: Location; locations: Location[] }) {
  if (parent.status !== "Active") return null;
  return (
    <DrawerButton
      mode={{ kind: "add-child", parent: { id: parent.id, name: parent.name } }}
      locations={locations}
      label="Add Child Location"
    />
  );
}

/** Location Detail header: Edit + Activate / Deactivate. */
export function LocationHeaderActions({ location, locations }: { location: LocationDetail; locations: Location[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {location.status === "Active" ? <DeactivateButton location={location} /> : <ActivateButton location={location} />}
      <DrawerButton
        mode={{ kind: "edit", location }}
        locations={locations}
        label="Edit Location"
        variant="outline"
      />
    </div>
  );
}

function ActivateButton({ location }: { location: Location }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setLocationStatusAction(location.id, "activate");
          if (result.ok) toast.success("Location activated");
          // Refused while the parent is inactive (INVALID_STATE); Core's message says so.
          else toast.error(result.message);
        })
      }
    >
      {pending ? "Activating…" : "Activate"}
    </Button>
  );
}

function DeactivateButton({ location }: { location: Location }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
      >
        Deactivate
      </Button>
      <DeactivateDialog
        location={location}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

/** Confirm, then show Core's blockers (active assets / children) when it refuses. Shared by the header and row menu. */
function DeactivateDialog({ location, open, onOpenChange }: { location: Location; open: boolean; onOpenChange: (open: boolean) => void }) {
  const setOpen = onOpenChange;
  const [refused, setRefused] = useState<Extract<LocationWriteResult, { ok: false }> | null>(null);
  const [pending, startTransition] = useTransition();
  const base = `/asset-workspace/locations/${encodeURIComponent(location.id)}`;

  function confirm() {
    startTransition(async () => {
      const result = await setLocationStatusAction(location.id, "deactivate");
      if (result.ok) {
        toast.success("Location deactivated");
        setOpen(false);
      } else setRefused(result);
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setRefused(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{refused?.blockers ? "Can't deactivate yet" : `Deactivate ${location.name}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {refused?.blockers
              ? "Move or deactivate these first:"
              : refused
                ? refused.message
                : "It can't be chosen for new assets or as a parent. Its assets and history stay."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {refused?.blockers && (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {refused.blockers.activeAssets > 0 && (
              <li>
                <Link
                  href={`${base}/assets`}
                  className="text-primary hover:underline"
                  onClick={() => setOpen(false)}
                >
                  {plural(refused.blockers.activeAssets, "active asset")}
                </Link>
              </li>
            )}
            {refused.blockers.activeChildren > 0 && (
              <li>
                <Link
                  href={`${base}/children`}
                  className="text-primary hover:underline"
                  onClick={() => setOpen(false)}
                >
                  {plural(refused.blockers.activeChildren, "active child location")}
                </Link>
              </li>
            )}
          </ul>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{refused ? "Close" : "Cancel"}</AlertDialogCancel>
          {!refused && (
            <Button
              variant="destructive"
              disabled={pending}
              onClick={confirm}
            >
              {pending ? "Deactivating…" : "Deactivate"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Row `⋮` on the All Locations and Child Locations tables: Edit · Add Child Location (active only) · Activate / Deactivate. */
export function LocationRowActions({ location, locations }: { location: Location; locations: Location[] }) {
  const [open, setOpen] = useState<"edit" | "add-child" | "deactivate" | null>(null);
  const [pending, startTransition] = useTransition();
  const active = location.status === "Active";
  const activate = () =>
    startTransition(async () => {
      const result = await setLocationStatusAction(location.id, "activate");
      if (result.ok) toast.success("Location activated");
      else toast.error(result.message);
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${location.name}`}
            disabled={pending}
          >
            <MoreIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpen("edit")}>
            <EditIcon className="size-4" />
            Edit
          </DropdownMenuItem>
          {active && (
            <DropdownMenuItem onSelect={() => setOpen("add-child")}>
              <PlusIcon className="size-4" />
              Add Child Location
            </DropdownMenuItem>
          )}
          {active ? (
            <DropdownMenuItem
              className="text-error"
              onSelect={() => setOpen("deactivate")}
            >
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={activate}>Activate</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {(open === "edit" || open === "add-child") && (
        <LocationFormDrawer
          mode={open === "edit" ? { kind: "edit", location } : { kind: "add-child", parent: { id: location.id, name: location.name } }}
          locations={locations}
          open
          onOpenChange={(next) => !next && setOpen(null)}
        />
      )}
      <DeactivateDialog
        location={location}
        open={open === "deactivate"}
        onOpenChange={(next) => setOpen(next ? "deactivate" : null)}
      />
    </>
  );
}
