"use client";

import { SettingsIcon } from "@/components/ui/icons";

function greetingFor(hour: number): { text: string; emoji: string } {
  if (hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour < 18) return { text: "Good afternoon", emoji: "🌤️" };
  return { text: "Good evening", emoji: "🌙" };
}

export function StrategicHeader({ userName }: { userName: string }) {
  const { text, emoji } = greetingFor(new Date().getHours());

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {text}, {userName} <span aria-hidden="true">{emoji}</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Here&apos;s your strategic overview for today.
        </p>
      </div>
      <button
        type="button"
        className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Customize
        <SettingsIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
