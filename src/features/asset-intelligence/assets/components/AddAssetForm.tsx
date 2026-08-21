"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/api-error";
import { createAsset } from "../services/assets-api";
import type { CreateAssetDeviceResult } from "../types";

const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

/** `undefined` for a blank field so the server's own default applies, rather
 *  than sending an empty string that would override it. */
function trimmedOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409) {
      return "Couldn't add this device — the tenant's device quota is full, or the serial number/MAC address is already registered.";
    }
    if (err.status === 403) {
      return "Your account doesn't have permission to add devices for this tenant (requires super_admin or company_admin).";
    }
    return err.message || "The server rejected this request.";
  }
  return err instanceof Error ? err.message : "Something went wrong adding this device.";
}

// AM-02: add an asset. Real POST to Thunder_Core (`services/assets-api.ts`),
// not the mock registry `mock-assets.ts` reads from — the two are genuinely
// disconnected right now (no list/read endpoint exists yet to fold this back
// into "All Assets" below), see that service file's header comment.
export function AddAssetForm({ onClose }: { onClose: () => void }) {
  const [deviceName, setDeviceName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [model, setModel] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [site, setSite] = useState("");
  const [zone, setZone] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateAssetDeviceResult | null>(null);

  if (result) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500" />
          <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-300">
            {result.asset.device_name} registered.
          </p>
          <button
            onClick={onClose}
            className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            Close
          </button>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-800/50">
          <p className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">
            Device credentials — save these now, they won&apos;t be shown again:
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono">
            <dt className="text-zinc-500 dark:text-zinc-400">mqtt_client_id</dt>
            <dd className="break-all text-zinc-900 dark:text-zinc-100">
              {result.credentials.mqtt_client_id}
            </dd>
            <dt className="text-zinc-500 dark:text-zinc-400">access_token</dt>
            <dd className="break-all text-zinc-900 dark:text-zinc-100">
              {result.credentials.access_token}
            </dd>
          </dl>
        </div>
      </Card>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = deviceName.trim();
    if (!trimmedName) {
      setError("Device name is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const created = await createAsset({
        device_name: trimmedName,
        serial_number: trimmedOrUndefined(serialNumber),
        mac_address: trimmedOrUndefined(macAddress),
        model: trimmedOrUndefined(model),
        device_type: trimmedOrUndefined(deviceType),
        site: trimmedOrUndefined(site),
        zone: trimmedOrUndefined(zone),
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });
      setResult(created);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Device Name
            <input
              required
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. Lobby Display 3"
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Device Type
            <input
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              placeholder="Other"
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Serial Number
            <input
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            MAC Address
            <input
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
              placeholder="e.g. AA:BB:CC:DD:EE:FF"
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Model
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Tags
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma-separated"
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Site
            <input
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Zone
            <input
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className={inputClasses}
            />
          </label>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Adding..." : "Add Asset"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
