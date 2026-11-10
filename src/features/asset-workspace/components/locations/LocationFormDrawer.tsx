"use client";

// One drawer for Add Location, Add Child Location and Edit Location (05 §4.8). No Status field: status has its own
// actions. FE checks the obvious rules; Core checks all of them and its message lands on the matching field.
import "mapbox-gl/dist/mapbox-gl.css";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { env } from "@/config/env";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/lovable/sheet";
import { Textarea } from "@/components/ui/lovable/textarea";
import {
  LOCATION_TYPES,
  mapPin,
  parseCoordinate,
  selfAndDescendants,
  validateLocationForm,
  type Location,
  type LocationDetail,
  type LocationForm as Form,
  type LocationFormErrors as Errors,
  type LocationInput,
} from "../../domain/location";
import { createLocationAction, updateLocationAction, type LocationWriteResult } from "../../services/asset-locations-actions";

export type LocationFormMode =
  | { kind: "add" }
  | { kind: "add-child"; parent: { id: string; name: string } }
  | { kind: "edit"; location: LocationDetail | Location };

const NONE = "none";
const TITLES = { add: "Add Location", "add-child": "Add Child Location", edit: "Edit Location" } as const;

function initialForm(mode: LocationFormMode): Form {
  if (mode.kind !== "edit") {
    return {
      name: "",
      locationType: "",
      parentId: mode.kind === "add-child" ? mode.parent.id : "",
      address: "",
      latitude: "",
      longitude: "",
      notes: "",
    };
  }
  const l = mode.location;
  return {
    name: l.name,
    locationType: l.locationType ?? "",
    parentId: l.parentId ?? "",
    address: l.address ?? "",
    latitude: l.latitude === null ? "" : String(l.latitude),
    longitude: l.longitude === null ? "" : String(l.longitude),
    notes: l.notes ?? "",
  };
}

/** Core's code → the field its message belongs on. */
const FIELD_OF: Record<string, keyof Form> = { INVALID_PARENT: "parentId", HIERARCHY_LOOP: "parentId", VALIDATION: "name" };

/** Render it only while open (callers do `{open && …}`), so every open starts from a fresh form. */
export function LocationFormDrawer({
  mode,
  locations,
  open,
  onOpenChange,
}: {
  mode: LocationFormMode;
  /** Parent options. */
  locations: Location[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialForm(mode));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (key: keyof Form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const editing = mode.kind === "edit" ? mode.location : null;
  const blocked = editing ? selfAndDescendants(locations, editing.id) : new Set<string>();
  // A new parent must be active (Core INVALID_PARENT); an existing link stays selectable.
  const parents = locations
    .filter((l) => !blocked.has(l.id) && (l.status === "Active" || l.id === editing?.parentId))
    .sort((a, b) => a.name.localeCompare(b.name));

  function showResult(result: LocationWriteResult) {
    if (result.ok) {
      toast.success(mode.kind === "edit" ? "Location updated" : "Location added");
      onOpenChange(false);
      if (mode.kind !== "edit") router.push(`/asset-workspace/locations/${result.id}/overview`);
      return;
    }
    if (result.fieldErrors) {
      const fieldErrors: Errors = {};
      for (const [key, messages] of Object.entries(result.fieldErrors)) {
        if (key in form && messages[0]) fieldErrors[key as keyof Form] = messages[0];
      }
      if (Object.keys(fieldErrors).length) return setErrors(fieldErrors);
    }
    const field = FIELD_OF[result.code];
    if (field && result.code !== "VALIDATION") return setErrors({ [field]: result.message });
    setFormError(result.code === "STALE" ? "Someone else changed this location. Close and reopen to see the latest." : result.message);
  }

  function submit() {
    const { errors: found, input } = validateLocationForm(form);
    setErrors(found);
    setFormError(null);
    if (!input) return;
    startTransition(async () => {
      if (!editing) return showResult(await createLocationAction(input));
      const before = validateLocationForm(initialForm(mode)).input;
      const changes = Object.fromEntries(
        Object.entries(input).filter(([key, value]) => before?.[key as keyof LocationInput] !== value),
      ) as Partial<LocationInput>;
      if (Object.keys(changes).length === 0) return onOpenChange(false);
      showResult(await updateLocationAction(editing.id, editing.updatedAt, changes));
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{TITLES[mode.kind]}</SheetTitle>
          <SheetDescription>
            {mode.kind === "add-child" ? `Under ${mode.parent.name}.` : "Name and type are required."}
          </SheetDescription>
        </SheetHeader>
        <form
          id="location-form"
          noValidate
          className="flex-1 space-y-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field
            id="location-name"
            label="Name"
            required
            error={errors.name}
          >
            <Input
              id="location-name"
              value={form.name}
              maxLength={255}
              onChange={(e) => set("name")(e.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
          </Field>
          <Field
            id="location-type"
            label="Type"
            required
            error={errors.locationType}
          >
            <Select
              value={form.locationType}
              onValueChange={set("locationType")}
            >
              <SelectTrigger
                id="location-type"
                aria-invalid={Boolean(errors.locationType)}
              >
                <SelectValue placeholder="Choose a type" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map((type) => (
                  <SelectItem
                    key={type}
                    value={type}
                  >
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            id="location-parent"
            label="Parent"
            error={errors.parentId}
          >
            <Select
              value={form.parentId || NONE}
              onValueChange={(v) => set("parentId")(v === NONE ? "" : v)}
              disabled={mode.kind === "add-child"}
            >
              <SelectTrigger
                id="location-parent"
                aria-invalid={Boolean(errors.parentId)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None (top level)</SelectItem>
                {mode.kind === "add-child" && <SelectItem value={mode.parent.id}>{mode.parent.name}</SelectItem>}
                {mode.kind !== "add-child" &&
                  parents.map((l) => (
                    <SelectItem
                      key={l.id}
                      value={l.id}
                    >
                      {l.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            id="location-address"
            label="Address"
          >
            <Input
              id="location-address"
              value={form.address}
              onChange={(e) => set("address")(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="location-lat"
              label="Latitude"
              error={errors.latitude}
            >
              <Input
                id="location-lat"
                inputMode="decimal"
                value={form.latitude}
                onChange={(e) => set("latitude")(e.target.value)}
                aria-invalid={Boolean(errors.latitude)}
              />
            </Field>
            <Field
              id="location-lng"
              label="Longitude"
              error={errors.longitude}
            >
              <Input
                id="location-lng"
                inputMode="decimal"
                value={form.longitude}
                onChange={(e) => set("longitude")(e.target.value)}
                aria-invalid={Boolean(errors.longitude)}
              />
            </Field>
          </div>
          <LocationMapPicker
            latitude={parseCoordinate(form.latitude)}
            longitude={parseCoordinate(form.longitude)}
            onPick={(lat, lng) => setForm((f) => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }))}
            center={mapPin({ latitude: null, longitude: null, parentId: form.parentId || null }, locations)}
          />
          <Field
            id="location-notes"
            label="Notes"
            error={errors.notes}
            hint={`${form.notes.length}/500`}
          >
            <Textarea
              id="location-notes"
              value={form.notes}
              rows={3}
              onChange={(e) => set("notes")(e.target.value)}
              aria-invalid={Boolean(errors.notes)}
            />
          </Field>
          {formError && (
            <p
              role="alert"
              className="text-sm text-error"
            >
              {formError}
            </p>
          )}
        </form>
        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="location-form"
            disabled={pending}
          >
            {pending ? "Saving…" : mode.kind === "edit" ? "Save Changes" : "Add Location"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-error"> *</span>}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

const BANGKOK: [number, number] = [100.5018, 13.7563];
const valid = (lat: number | null, lng: number | null): lat is number =>
  lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/** Click the map to set the coordinates; typing them moves the pin. Without coordinates it opens on `center`
 *  (the parent's pin, never copied into the form: decided 2026-11-10), else Bangkok. */
function LocationMapPicker({
  latitude,
  longitude,
  onPick,
  center,
}: {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
  center: { latitude: number; longitude: number } | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const pick = useRef(onPick);
  useEffect(() => {
    pick.current = onPick;
  });
  const start = useRef({ latitude, longitude, center });

  useEffect(() => {
    if (!container.current || !env.mapboxToken) return;
    let cancelled = false;
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !container.current) return;
      const { latitude: lat, longitude: lng, center: fallback } = start.current;
      const has = valid(lat, lng);
      map.current = new mapboxgl.Map({
        container: container.current,
        accessToken: env.mapboxToken,
        style: "mapbox://styles/mapbox/light-v11",
        center: has ? [lng!, lat] : fallback ? [fallback.longitude, fallback.latitude] : BANGKOK,
        zoom: has || fallback ? 14 : 10,
        attributionControl: false,
      });
      map.current.addControl(new mapboxgl.AttributionControl({ compact: true }));
      marker.current = new mapboxgl.Marker();
      if (has) marker.current.setLngLat([lng!, lat]).addTo(map.current);
      map.current.on("click", (e) => pick.current(e.lngLat.lat, e.lngLat.lng));
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !marker.current) return;
    if (valid(latitude, longitude)) marker.current.setLngLat([longitude!, latitude]).addTo(map.current);
    else marker.current.remove();
  }, [latitude, longitude]);

  if (!env.mapboxToken) return null;
  return (
    <div className="space-y-1">
      <div
        ref={container}
        className="h-48 overflow-hidden rounded-lg bg-muted"
      />
      <p className="text-xs text-muted-foreground">Click the map to set the coordinates.</p>
    </div>
  );
}
