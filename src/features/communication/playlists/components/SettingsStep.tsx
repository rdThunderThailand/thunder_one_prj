"use client";

import { Card } from "@/components/ui/Card";
import { Field, OptionGroup, Select, Toggle, inputClasses } from "./form";
import { usePlaylistDraftStore } from "../store/usePlaylistDraftStore";
import { TRANSITIONS, type FailureHandling, type MediaFit } from "../types";

export function SettingsStep() {
  const { playback, setPlayback } = usePlaylistDraftStore();

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          1. Playback Behavior
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Play Mode" hint="ลำดับการเล่นของ item ใน playlist">
            <Select
              value={playback.playMode ?? "sequential"}
              options={[
                { value: "sequential", label: "Sequential" },
                { value: "shuffle", label: "Shuffle" },
              ]}
              onChange={(e) =>
                setPlayback({ playMode: e.target.value as "sequential" | "shuffle" })
              }
            />
          </Field>
          <Field label="Repeat" hint="เล่นวนหลังจบ item สุดท้ายหรือไม่">
            <Select
              value={playback.repeat ?? "loop"}
              options={[
                { value: "loop", label: "Loop continuously" },
                { value: "once", label: "Play once" },
              ]}
              onChange={(e) => setPlayback({ repeat: e.target.value as "loop" | "once" })}
            />
          </Field>
          <Field label="Start Playback From" hint="ไม่มี state หรือ item เดิมถูกลบ ให้ fallback ไป First Item">
            <Select
              value={playback.startFrom ?? "first"}
              options={[
                { value: "first", label: "First item" },
                { value: "resume", label: "Resume last successful item" },
              ]}
              onChange={(e) => setPlayback({ startFrom: e.target.value as "first" | "resume" })}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          2. Default Media Settings
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Field
            label="Default Image Duration (sec)"
            hint="ใช้กับรูปที่เพิ่มเข้ามาใหม่และยังไม่ได้ตั้งเวลาเอง"
          >
            <input
              type="number"
              min={1}
              value={playback.defaultImageDuration ?? 10}
              onChange={(e) =>
                setPlayback({ defaultImageDuration: Math.max(1, Number(e.target.value) || 1) })
              }
              className={inputClasses}
            />
          </Field>

          <Field label="Media Fit">
            <OptionGroup<MediaFit>
              value={playback.mediaFit}
              onChange={(mediaFit) => setPlayback({ mediaFit })}
              options={[
                { value: "fit", label: "Fit" },
                { value: "fill", label: "Fill" },
                { value: "stretch", label: "Stretch" },
              ]}
            />
          </Field>

          <Field label="Video Audio">
            <Toggle
              checked={playback.audioEnabled ?? true}
              onChange={(audioEnabled) => setPlayback({ audioEnabled })}
              label="Play video audio"
            />
          </Field>

          <Field label="Default Volume">
            <Select
              value={String(playback.defaultVolume ?? 80)}
              options={[0, 20, 40, 60, 80, 100].map((v) => ({
                value: String(v),
                label: `${v}%`,
              }))}
              onChange={(e) => setPlayback({ defaultVolume: Number(e.target.value) })}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          3. Transition Settings
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Field
            label="Default Transition"
            hint="transition ที่ตั้งรายชิ้นใน Add Content จะทับค่านี้"
          >
            <Select
              value={playback.defaultTransition ?? "fade"}
              options={TRANSITIONS.map((t) => ({ value: t, label: t }))}
              onChange={(e) =>
                setPlayback({ defaultTransition: e.target.value as (typeof TRANSITIONS)[number] })
              }
            />
          </Field>
          <Field label="Transition Duration (sec)">
            <input
              type="number"
              min={0}
              step={0.5}
              value={playback.transitionDuration ?? 1}
              onChange={(e) =>
                setPlayback({ transitionDuration: Math.max(0, Number(e.target.value) || 0) })
              }
              className={inputClasses}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          4. Playback Failure Handling
        </h2>
        <OptionGroup<FailureHandling>
          value={playback.failureHandling}
          columns={2}
          onChange={(failureHandling) => setPlayback({ failureHandling })}
          options={[
            {
              value: "skip",
              label: "Skip unavailable item and continue",
              description: "ข้าม item ที่โหลดไม่ได้แล้วเล่นต่อ",
            },
            {
              value: "stop",
              label: "Stop playlist and report error",
              description: "หยุด playlist แล้วรายงานข้อผิดพลาด",
            },
          ]}
        />
        <div className="mt-4">
          <Toggle
            checked={playback.warnOnSkip ?? true}
            onChange={(warnOnSkip) => setPlayback({ warnOnSkip })}
            label="Show warning when an item is skipped"
          />
        </div>
      </Card>
    </div>
  );
}
