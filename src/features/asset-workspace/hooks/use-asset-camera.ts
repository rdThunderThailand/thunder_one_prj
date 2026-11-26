"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";

type CameraStatus = "starting" | "ready" | "error";

function cameraError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Camera access was denied. Allow it in your browser settings, or enter the identifier manually.";
    }
    if (error.name === "NotFoundError") return "No camera was found. Enter the identifier manually.";
    if (error.name === "NotReadableError") return "The camera is busy. Close other apps using it and retry.";
  }
  return "The camera couldn't start. Try again or enter the identifier manually.";
}

export function useAssetCamera(onDecoded: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<CameraStatus>("starting");
  const [message, setMessage] = useState("");
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchPending, setTorchPending] = useState(false);
  const decoded = useEffectEvent(onDecoded);

  useEffect(() => {
    let disposed = false;
    let detected = false;
    let stream: MediaStream | null = null;
    let controls: IScannerControls | null = null;
    const video = videoRef.current;

    function stop() {
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
      if (controlsRef.current === controls) controlsRef.current = null;
      if (video && video.srcObject === stream) video.srcObject = null;
    }

    async function start() {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !video) {
          if (!disposed) {
            setStatus("error");
            setMessage("Camera scanning needs HTTPS and a supported browser. You can still enter the identifier manually.");
          }
          return;
        }
        const { BrowserMultiFormatReader, BarcodeFormat } = await import("@zxing/browser");
        if (disposed) return;
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }, audio: false,
        });
        // A permission prompt can finish after the dialog has already closed.
        if (disposed) { stop(); return; }
        const reader = new BrowserMultiFormatReader();
        reader.possibleFormats = [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128];
        controls = await reader.decodeFromStream(stream, video, (result, _error, activeControls) => {
          if (disposed || detected || !result) return;
          detected = true;
          activeControls.stop();
          stream?.getTracks().forEach((track) => track.stop());
          decoded(result.getText());
        });
        if (disposed || detected) { stop(); return; }
        controlsRef.current = controls;
        setTorchAvailable(typeof controls.switchTorch === "function");
        setStatus("ready");
      } catch (error) {
        stop();
        if (!disposed) { setStatus("error"); setMessage(cameraError(error)); }
      }
    }
    void start();
    return () => { disposed = true; stop(); };
  }, [attempt]);

  function retry() {
    setMessage("");
    setStatus("starting");
    setTorchAvailable(false);
    setTorchOn(false);
    setAttempt((previous) => previous + 1);
  }

  async function toggleTorch() {
    const controls = controlsRef.current;
    if (!controls?.switchTorch || torchPending) return;
    setTorchPending(true);
    try {
      await controls.switchTorch(!torchOn);
      if (controlsRef.current === controls) setTorchOn(!torchOn);
    } catch {
      if (controlsRef.current === controls) setTorchAvailable(false);
    } finally {
      if (controlsRef.current === controls) setTorchPending(false);
    }
  }

  return { videoRef, status, message, retry, torchAvailable, torchOn, torchPending, toggleTorch };
}
