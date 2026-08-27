"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { InfoIcon, TrashIcon, UploadIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/api-error";
import { deleteAssetAttachment, uploadAssetAttachment } from "../services/assets-api";
import type { AssetAttachment } from "../services/asset-list-api";

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return "บัญชีนี้ไม่มีสิทธิ์แนบหรือลบเอกสาร (ต้องเป็น Asset Admin ขึ้นไป)";
    return err.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";
  }
  return err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
}

/**
 * P6 (Related Documents) — `GET`/`POST .../assets/{assetId}/attachments`,
 * `DELETE .../attachments/{attachmentId}`, per the asset-detail-page-api-
 * gap-analysis doc (2026-08-26). `docType` is accepted by Core but has no
 * input here — optional metadata, skipped to keep the upload flow to one
 * step (pick a file, it uploads). `fileUrl` is a signed URL that's already
 * fresh from this page load's server fetch, so it's safe to link directly
 * without re-signing client-side.
 */
export function AssetRelatedDocumentsCard({
  assetId,
  attachments,
}: {
  assetId: string;
  attachments: AssetAttachment[] | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await uploadAssetAttachment(assetId, file);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(attachmentId: string) {
    setError(null);
    setDeletingId(attachmentId);
    try {
      await deleteAssetAttachment(assetId, attachmentId);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Related Documents</h2>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
          <UploadIcon className="h-3.5 w-3.5" />
          {uploading ? "กำลังอัปโหลด..." : "แนบไฟล์"}
          <input ref={fileInputRef} type="file" className="hidden" disabled={uploading} onChange={handleFileChange} />
        </label>
      </div>

      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      {attachments === null ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center text-zinc-400">
          <InfoIcon className="h-5 w-5" />
          <p className="text-sm">ไม่สามารถโหลดเอกสารแนบได้ในขณะนี้</p>
        </div>
      ) : attachments.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center text-zinc-400">
          <InfoIcon className="h-5 w-5" />
          <p className="text-sm">ยังไม่มีเอกสารแนบสำหรับทรัพย์สินนี้</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {attachments.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                {doc.fileUrl ? (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {doc.fileName}
                  </a>
                ) : (
                  <p className="truncate font-medium text-zinc-700 dark:text-zinc-200">{doc.fileName}</p>
                )}
                <p className="text-xs text-zinc-400">
                  {doc.docType ? `${doc.docType} · ` : ""}
                  {formatDate(doc.uploadedAt)}
                  {doc.uploadedBy ? ` · ${doc.uploadedBy}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                title="ลบเอกสาร"
                className="shrink-0 text-zinc-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
