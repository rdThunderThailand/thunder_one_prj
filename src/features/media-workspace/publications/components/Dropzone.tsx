"use client";

import type { DragEvent, RefObject } from "react";
import { UploadIcon } from "@/components/ui/icons";
import { MAX_UPLOAD_SIZE_LABEL, UPLOAD_ACCEPT_ATTR, UPLOAD_ACCEPT_LABEL } from "../upload-limits";

export function Dropzone({
  fileInputRef,
  onFileSelected,
  disabled,
  progress,
  error,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSelected: (file: File) => void;
  disabled: boolean;
  progress: number | null;
  error: string | null;
}) {
  const selectFile = (file: File | undefined) => file && !disabled && onFileSelected(file);
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    selectFile(event.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className="flex min-h-44 flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-6 text-center"
    >
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100"><UploadIcon className="h-6 w-6" /></span>
      <p className="text-sm font-semibold text-zinc-900">ลากและวางไฟล์ที่นี่</p>
      <p className="mt-1 text-xs text-zinc-500">หรือ</p>
      <input
        ref={fileInputRef}
        type="file"
        accept={UPLOAD_ACCEPT_ATTR}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          selectFile(file);
        }}
      />
      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled} className="mt-3 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
        {progress === null ? "อัปโหลดไฟล์จากเครื่อง" : `Uploading ${progress}%`}
      </button>
      <p className={`mt-3 text-xs ${error ? "text-red-600" : "text-zinc-500"}`}>{error ?? `${UPLOAD_ACCEPT_LABEL} · สูงสุด ${MAX_UPLOAD_SIZE_LABEL} ต่อไฟล์`}</p>
    </div>
  );
}
