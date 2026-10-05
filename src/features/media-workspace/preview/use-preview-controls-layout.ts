"use client";

import { useEffect, useRef, useState } from "react";
import { canOverlayPreviewControls } from "./preview-geometry";

export function usePreviewControlsLayout(isOverlayStage: boolean) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const controlsBodyRef = useRef<HTMLDivElement>(null);
  const [canOverlay, setCanOverlay] = useState(false);
  const [fullscreenContext, setFullscreenContext] = useState<{
    owner: HTMLElement | null;
    isStageFullscreen: boolean;
  }>({ owner: null, isStageFullscreen: false });

  useEffect(() => {
    let alive = true;
    const onChange = () => {
      if (!alive) return;
      const stage = stageRef.current;
      const element = document.fullscreenElement;
      const owner = element instanceof HTMLElement && stage && element.contains(stage) ? element : null;
      setFullscreenContext({ owner, isStageFullscreen: owner !== null && owner === stage });
    };
    Promise.resolve().then(onChange);
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      alive = false;
      document.removeEventListener("fullscreenchange", onChange);
    };
  }, []);

  useEffect(() => {
    if (!isOverlayStage) return;
    const frame = frameRef.current;
    const body = controlsBodyRef.current;
    if (!frame || !body) return;
    const measure = () => {
      // Same horizontal padding/border in both placements keeps this measurement invariant.
      const fits = canOverlayPreviewControls(frame.getBoundingClientRect().height, body.getBoundingClientRect().height);
      setCanOverlay((current) => current === fits ? current : fits);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(body);
    const initialMeasure = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(initialMeasure);
      observer.disconnect();
    };
  }, [isOverlayStage]);

  const toggleFullscreen = () => {
    if (fullscreenContext.owner) void document.exitFullscreen().catch(() => undefined);
    else void stageRef.current?.requestFullscreen?.().catch(() => undefined);
  };

  return { stageRef, frameRef, controlsBodyRef, canOverlay, fullscreenContext, toggleFullscreen };
}
