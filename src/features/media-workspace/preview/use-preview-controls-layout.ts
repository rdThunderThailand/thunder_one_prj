"use client";

import { useEffect, useRef, useState } from "react";

export function usePreviewControlsLayout() {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
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

  const toggleFullscreen = () => {
    if (fullscreenContext.owner) void document.exitFullscreen().catch(() => undefined);
    else void stageRef.current?.requestFullscreen?.().catch(() => undefined);
  };

  return { stageRef, frameRef, fullscreenContext, toggleFullscreen };
}
