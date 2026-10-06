"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import {
  platformFromNavigator,
  shortcutLabel,
  type ShortcutOptions,
  type ShortcutPlatform,
} from "@/lib/keyboard-shortcut";

const ShortcutPlatformContext = createContext<ShortcutPlatform | null>(null);

/** Set once by the dashboard layout from the request (`platformFromHeaders`). */
export function ShortcutPlatformProvider({ platform, children }: { platform: ShortcutPlatform; children: React.ReactNode }) {
  return <ShortcutPlatformContext.Provider value={platform}>{children}</ShortcutPlatformContext.Provider>;
}

const noSubscribe = () => () => {};

/** ⌘ or Ctrl for this user. Outside the provider it falls back to the browser after hydration. */
export function useShortcutPlatform(): ShortcutPlatform {
  const fromServer = useContext(ShortcutPlatformContext);
  const fromBrowser = useSyncExternalStore(
    noSubscribe,
    () => platformFromNavigator(navigator as Navigator & { userAgentData?: { platform?: string } }),
    () => "other" as const,
  );
  return fromServer ?? fromBrowser;
}

/** A shortcut written the way this user's OS writes it: `<ShortcutKey letter="K" />` → ⌘K / Ctrl+K. */
export function ShortcutKey({ letter, shift, className }: { letter: string; className?: string } & ShortcutOptions) {
  const platform = useShortcutPlatform();
  return (
    <kbd className={className}>
      {shortcutLabel(platform, letter, { shift })}
    </kbd>
  );
}
