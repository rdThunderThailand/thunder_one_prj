"use client";

import { useEffect, useState } from "react";
import {
  fetchCampaigns,
  fetchTags,
  saveBasicInfo,
} from "../services/publications-api";
import type { BasicInfoForm, Campaign, Tag } from "../types";
import { BasicInfoStep } from "./BasicInfoStep";

const WIZARD_STEPS = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Content" },
  { id: 3, label: "Channels" },
  { id: 4, label: "Schedule" },
  { id: 5, label: "Review & Publish" },
] as const;

export function CreatePublicationWizard() {
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<BasicInfoForm>({
    name: "",
    description: "",
    campaign_id: "",
    publication_type: "playlist",
    priority: "normal",
    language: "",
    tags: [],
  });
  const [publicationId, setPublicationId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [fetchedCampaigns, fetchedTags] = await Promise.all([
          fetchCampaigns(),
          fetchTags(),
        ]);
        if (isMounted) {
          setCampaigns(fetchedCampaigns);
          setTags(fetchedTags);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load campaigns or tags."
          );
        }
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFormChange = (updates: Partial<BasicInfoForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setSavedMessage(null);
  };

  const executeSave = async (): Promise<string | null> => {
    if (!form.name.trim()) return null;
    setLoading(true);
    setError(null);
    setSavedMessage(null);

    try {
      const res = await saveBasicInfo(form, publicationId);
      const newId = res.publication_id || res.id || publicationId;
      if (newId) {
        setPublicationId(newId);
      }
      return newId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save publication.";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    const savedId = await executeSave();
    if (savedId) {
      setSavedMessage(`บันทึก draft แล้ว (ID: ${savedId})`);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      const savedId = await executeSave();
      if (savedId) {
        setStep(2);
      }
    } else if (step < 5) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const isNameEmpty = !form.name.trim();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header / Monospace publicationId */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider block">
            Publication ID
          </span>
          <span className="font-mono text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {publicationId ?? "Not saved yet"}
          </span>
        </div>
        {loading && (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 animate-pulse">
            Saving…
          </span>
        )}
      </div>

      {/* Step Indicator (1 to 5) */}
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between w-full text-xs font-medium">
          {WIZARD_STEPS.map((s, idx) => {
            const isCurrent = step === s.id;
            const isCompleted = step > s.id;

            return (
              <li
                key={s.id}
                className="flex items-center gap-2 flex-1 last:flex-initial"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                    isCurrent
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                      : "border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {isCompleted ? "✓" : s.id}
                </div>
                <span
                  className={`hidden sm:inline ${
                    isCurrent
                      ? "text-zinc-900 font-semibold dark:text-zinc-100"
                      : isCompleted
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {s.label}
                </span>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Notification Banner (Errors / Saved messages) */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            {error}
          </p>
        </div>
      )}
      {savedMessage && (
        <div className="rounded-md bg-emerald-50 p-4 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            {savedMessage}
          </p>
        </div>
      )}

      {/* Step Body */}
      <div>
        {step === 1 ? (
          <BasicInfoStep
            form={form}
            onChange={handleFormChange}
            campaigns={campaigns}
            existingTags={tags}
          />
        ) : (
          /* ponytail: intentionally a stub for steps 2-5 */
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Step {step}: {WIZARD_STEPS[step - 1].label}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              ยังไม่ implement — step {step}
            </p>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Back
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading || isNameEmpty}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {loading ? "Saving…" : "Save as Draft"}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={loading || isNameEmpty || step === 5}
            title={step === 5 ? "Publishing is not implemented yet" : undefined}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Saving…" : step === 5 ? "Publish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
