"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon } from "@/components/ui/icons";
import { getMockAssets } from "../services/mock-assets";
import { mockLocations } from "../mock-reference-data";
import type { AssetCategory } from "../types";

const CATEGORY_OPTIONS: { value: AssetCategory; label: string }[] = [
  { value: "laptop", label: "Laptop" },
  { value: "printer", label: "Printer" },
  { value: "nas", label: "NAS" },
  { value: "media_player_device", label: "Media Player Device" },
  { value: "other", label: "Other" },
];

const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

// AM-02: add an asset by hand. Real, working validation (tag must not
// already exist) and a real local success state -- doesn't write back to
// mock-assets.ts (see asset-intelligence/issues/components/ReportProblemForm.tsx's comment
// for why this sprint keeps such actions client-local).
export function AddAssetForm({ onClose }: { onClose: () => void }) {
  const [tag, setTag] = useState("");
  const [category, setCategory] = useState<AssetCategory>("laptop");
  const [locationId, setLocationId] = useState(mockLocations[0]?.id ?? "");
  const [vendorName, setVendorName] = useState("");
  const [purchaseValue, setPurchaseValue] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500" />
        <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-300">
          {tag} added to the registry.
        </p>
        <button
          onClick={onClose}
          className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500"
        >
          Close
        </button>
      </Card>
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const normalizedTag = tag.trim().toUpperCase();
    if (!normalizedTag) {
      setError("Tag is required.");
      return;
    }
    if (getMockAssets().some((a) => a.tag.toUpperCase() === normalizedTag)) {
      setError(`${normalizedTag} already exists.`);
      return;
    }
    setError(null);
    setSubmitted(true);
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Tag
            <input
              required
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. NB-070"
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AssetCategory)}
              className={inputClasses}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Location
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className={inputClasses}
            >
              {mockLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Vendor
            <input
              required
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g. Dell"
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Purchase Value (฿)
            <input
              required
              type="number"
              min={0}
              value={purchaseValue}
              onChange={(e) => setPurchaseValue(e.target.value)}
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Warranty Expiry
            <input
              required
              type="date"
              value={warrantyExpiry}
              onChange={(e) => setWarrantyExpiry(e.target.value)}
              className={inputClasses}
            />
          </label>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary">
            Add Asset
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
