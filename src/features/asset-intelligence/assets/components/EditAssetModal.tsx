"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/api-error";
import { updateAsset } from "../services/assets-api";
import type { AssetListRow } from "../services/asset-list-api";

const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) {
      return "Editing isn't available yet — Thunder_Core has no update endpoint for a single asset yet.";
    }
    if (err.status === 403) {
      return "Your account doesn't have permission to edit assets for this tenant (requires Asset Admin, company_admin, or super_admin).";
    }
    return err.message || "The server rejected this request.";
  }
  return err instanceof Error ? err.message : "Something went wrong updating this asset.";
}

/**
 * Opened from a row in AssetRegistryTable. Scoped to the six fields that
 * table/the List page display — not a device-provisioning form like
 * AddAssetForm. Calls `updateAsset()` (services/assets-api.ts), which 404s
 * today since Core hasn't built `PATCH .../assets/{assetId}` yet — see that
 * function's header comment. `router.refresh()` on success re-runs the
 * Server Component fetch in assets/all/page.tsx so the edited row reflects
 * immediately, same as any other Next.js mutation-then-refresh flow here.
 */
export function EditAssetModal({ asset, onClose }: { asset: AssetListRow; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(asset.name);
  const [serial, setSerial] = useState(asset.serial ?? "");
  const [category, setCategory] = useState(asset.category ?? "");
  const [owner, setOwner] = useState(asset.owner ?? "");
  const [valueTHB, setValueTHB] = useState(asset.valueTHB !== null ? String(asset.valueTHB) : "");
  const [receivedDate, setReceivedDate] = useState(asset.receivedDate ? asset.receivedDate.slice(0, 10) : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Asset name is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await updateAsset(asset.id, {
        name: trimmedName,
        serial_number: serial.trim() || undefined,
        asset_category: category.trim() || undefined,
        owner_name: owner.trim() || undefined,
        current_value: valueTHB.trim() ? Number(valueTHB.trim()) : undefined,
        purchase_date: receivedDate || undefined,
      });
      router.refresh();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`แก้ไขทรัพย์สิน — ${asset.name}`}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button type="submit" form="edit-asset-form" variant="primary" disabled={submitting}>
            {submitting ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </>
      }
    >
      <form id="edit-asset-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          ชื่อทรัพย์สิน
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Serial Number
          <input value={serial} onChange={(e) => setSerial(e.target.value)} className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          ประเภททรัพย์สิน
          <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          ผู้ใช้ / ผู้รับผิดชอบ
          <input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          มูลค่า (THB)
          <input
            type="number"
            min="0"
            step="0.01"
            value={valueTHB}
            onChange={(e) => setValueTHB(e.target.value)}
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          วันที่รับเข้า
          <input
            type="date"
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.target.value)}
            className={inputClasses}
          />
        </label>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </Modal>
  );
}
