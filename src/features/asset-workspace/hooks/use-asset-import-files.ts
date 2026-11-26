"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { requestErrorText } from "../domain/asset-import-messages";
import type { AssetImportFlow } from "./use-asset-import-flow";
import { ImportApiError } from "../services/asset-import-api";
import { setImportNotice } from "../services/asset-import-session";
import { downloadBlob } from "../services/asset-import-template";

export type ErrorFileFormat = "xlsx" | "csv";

export function useAssetImportFiles(flow: AssetImportFlow) {
  const batch = flow.batch;
  const router = useRouter();
  const [busy, setBusy] = useState<
    "source" | "result" | "error" | "reimport" | null
  >(null);
  const [sourceMissing, setSourceMissing] = useState(false);
  const [errorFileChoice, setErrorFileChoice] = useState<{ reimport: boolean } | null>(null);
  const alive = useRef(false);
  const locked = useRef(false);
  const pendingSourceWindow = useRef<Window | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      pendingSourceWindow.current?.close();
      pendingSourceWindow.current = null;
    };
  }, []);


  async function action(
    kind: NonNullable<typeof busy>,
    work: () => Promise<void>,
  ) {
    if (locked.current) return;
    locked.current = true;
    setBusy(kind);
    try {
      await work();
    } catch (failure) {
      if (alive.current) {
        toast.error(
          failure instanceof ImportApiError
            ? requestErrorText(failure.code, failure.status)
            : "The file could not be downloaded. Try again.",
        );
      }
    } finally {
      locked.current = false;
      if (alive.current) setBusy(null);
    }
  }

  function download(kind: "result" | "error", reimport = false, format: ErrorFileFormat = "csv") {
    if (!batch) return;
    void action(reimport ? "reimport" : kind, async () => {
      const core = await flow.api.downloadFile(batch.id, kind, batch.batchCode);
      const file = format === "xlsx"
        ? await (await import("../services/asset-import-error-xlsx")).errorFileAsXlsx(core)
        : core;
      if (!alive.current) return;
      downloadBlob(file.blob, file.filename);
      setErrorFileChoice(null);
      if (reimport) {
        setImportNotice(flow.context, `Save the Error file, fix its rows and upload it here. Keep the Import ID and Source Row columns. It will be linked to ${batch.batchCode}.`);
        router.push("/asset-workspace/assets/import");
        toast.info(
          `Save the Error file, fix its rows and upload it here. Keep the Import ID and Source Row columns. It will be linked to ${batch.batchCode}.`,
        );
      }
    });
  }

  function sourceFile() {
    if (!batch) return;
    void action("source", async () => {
      const target = window.open("about:blank", "_blank");
      if (!target) {
        toast.error(
          "The source file could not be opened. Allow pop-ups and try again.",
        );
        return;
      }
      target.opener = null;
      pendingSourceWindow.current = target;
      try {
        const source = await flow.api.sourceFileUrl(batch.id);
        if (!alive.current || target.closed) {
          target.close();
          return;
        }
        const protocol = new URL(source.url).protocol;
        if (!["https:", "http:"].includes(protocol)) {
          throw new Error("Unsupported source URL");
        }
        target.location.replace(source.url);
      } catch (failure) {
        target.close();
        if (failure instanceof ImportApiError && failure.status === 404) {
          if (alive.current) {
            setSourceMissing(true);
            toast.error("Source file is not available.");
          }
          return;
        }
        throw failure;
      } finally {
        if (pendingSourceWindow.current === target) {
          pendingSourceWindow.current = null;
        }
      }
    });
  }

  return { busy, sourceMissing, download, sourceFile, errorFileChoice, setErrorFileChoice };
}
