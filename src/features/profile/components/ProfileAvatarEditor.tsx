"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { CameraIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/api-error";
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES, removeMyAvatar, uploadMyAvatar } from "../services/profile-api";

type Busy = "idle" | "uploading" | "removing";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 400) return err.message || "ไฟล์นี้ใช้เป็นรูปโปรไฟล์ไม่ได้";
  if (err instanceof ApiError && err.status === 401) return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
  return "บันทึกรูปโปรไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง";
}

/**
 * The profile header's picture: shows `users.avatar_url` (initials when
 * none) and uploads/removes it through Core's `/me/avatar`. The file is
 * checked client-side first (JPEG/PNG/WebP, ≤ 2 MB — Core re-checks by
 * sniffing the bytes), previewed immediately, and on success the page is
 * refreshed so the Topbar avatar (from the session) updates too.
 */
export function ProfileAvatarEditor({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  // `undefined` = show the server's avatarUrl; a string = local preview of
  // a just-picked file; `null` = just removed. Reset whenever the server
  // value changes (router.refresh() landed), so the page never shows a
  // stale picture in between.
  const [override, setOverride] = useState<string | null | undefined>(undefined);
  const [seenAvatarUrl, setSeenAvatarUrl] = useState(avatarUrl);
  if (avatarUrl !== seenAvatarUrl) {
    setSeenAvatarUrl(avatarUrl);
    setOverride(undefined);
  }
  const preview = typeof override === "string" ? override : null;
  const [busy, setBusy] = useState<Busy>("idle");
  const [menuOpen, setMenuOpen] = useState(false);

  // Free the object URL when the preview is replaced or the editor unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const shown = override === undefined ? avatarUrl : override;

  function pickFile() {
    setMenuOpen(false);
    inputRef.current?.click();
  }

  async function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!(AVATAR_MIME_TYPES as readonly string[]).includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("ไฟล์ใหญ่เกิน 2 MB");
      return;
    }

    setOverride(URL.createObjectURL(file));
    setBusy("uploading");
    try {
      await uploadMyAvatar(file);
      toast.success("อัปเดตรูปโปรไฟล์แล้ว");
      router.refresh();
    } catch (err) {
      setOverride(undefined);
      toast.error(errorMessage(err));
    } finally {
      setBusy("idle");
    }
  }

  async function remove() {
    setMenuOpen(false);
    setBusy("removing");
    try {
      await removeMyAvatar();
      setOverride(null);
      toast.success("ลบรูปโปรไฟล์แล้ว");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy("idle");
    }
  }

  return (
    <div className="relative shrink-0">
      <Avatar
        name={name}
        src={shown}
        size={96}
      />
      {busy !== "idle" && (
        <div
          className="absolute inset-0 grid place-items-center rounded-full bg-black/40"
          role="status"
          aria-label={busy === "uploading" ? "กำลังอัปโหลดรูป" : "กำลังลบรูป"}
        >
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_MIME_TYPES.join(",")}
        className="hidden"
        onChange={onFileChosen}
      />
      <button
        type="button"
        disabled={busy !== "idle"}
        onClick={() => (shown ? setMenuOpen((open) => !open) : pickFile())}
        aria-label={shown ? "จัดการรูปโปรไฟล์" : "อัปโหลดรูปโปรไฟล์"}
        aria-haspopup={shown ? "menu" : undefined}
        aria-expanded={shown ? menuOpen : undefined}
        title={shown ? "จัดการรูปโปรไฟล์" : "อัปโหลดรูปโปรไฟล์"}
        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-700 text-white hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-900"
      >
        <CameraIcon className="h-3.5 w-3.5" />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            className="absolute left-full top-full z-20 ml-1 mt-1 w-40 rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            <button
              type="button"
              role="menuitem"
              onClick={pickFile}
              className="block w-full px-3 py-2 text-left text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              เปลี่ยนรูป
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={remove}
              className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              ลบรูป
            </button>
          </div>
        </>
      )}
    </div>
  );
}
