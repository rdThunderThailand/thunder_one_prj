"use client";

import { useEffect, useState } from "react";
import {
  fetchCampaigns,
  fetchMediaAssets,
  fetchPublication,
  fetchScreens,
  fetchTags,
  saveBasicInfo,
  savePublicationContent,
} from "../services/publications-api";
import type {
  BasicInfoForm,
  Campaign,
  ContentItem,
  MediaAsset,
  PublicationTarget,
  Screen,
  Tag,
} from "../types";
import { BasicInfoStep } from "./BasicInfoStep";
import { ChannelsStep } from "./ChannelsStep";
import { ContentStep } from "./ContentStep";

const WIZARD_STEPS = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Content" },
  { id: 3, label: "Channels" },
  { id: 4, label: "Schedule" },
  { id: 5, label: "Review & Publish" },
] as const;

type CreatePublicationWizardProps = {
  initialPublicationId?: string;
};

export function CreatePublicationWizard({ initialPublicationId }: CreatePublicationWizardProps) {
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
  const [publicationId, setPublicationId] = useState<string | null>(initialPublicationId ?? null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [targets, setTargets] = useState<PublicationTarget[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(Boolean(initialPublicationId));
  const [loadingAssets, setLoadingAssets] = useState<boolean>(true);
  const [loadingScreens, setLoadingScreens] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [screensError, setScreensError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [fetchedCampaigns, fetchedTags, fetchedAssets, fetchedScreens] = await Promise.all([
          fetchCampaigns(),
          fetchTags(),
          fetchMediaAssets().catch((err) => {
            if (isMounted) {
              setAssetsError(err instanceof Error ? err.message : "Failed to load media assets.");
            }
            return [];
          }),
          fetchScreens().catch((err) => {
            if (isMounted) {
              setScreensError(err instanceof Error ? err.message : "Failed to load screens.");
            }
            return [];
          }),
        ]);

        if (isMounted) {
          setCampaigns(fetchedCampaigns);
          setTags(fetchedTags);
          setMediaAssets(fetchedAssets);
          setScreens(fetchedScreens);
          setLoadingAssets(false);
          setLoadingScreens(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load campaigns or tags.");
          setLoadingAssets(false);
          setLoadingScreens(false);
        }
      }

      if (initialPublicationId) {
        try {
          const detail = await fetchPublication(initialPublicationId);
          if (isMounted) {
            setForm({
              name: detail.name || "",
              description: detail.description || "",
              campaign_id: detail.campaign_id || "",
              publication_type: detail.publication_type || "playlist",
              priority: detail.priority || "normal",
              language: detail.language || "",
              tags: detail.tags || [],
            });
            setTargets(detail.publication_targets ?? []);
            setPublicationId(detail.id);
          }
        } catch (err) {
          if (isMounted) {
            setError(err instanceof Error ? err.message : "Failed to load draft publication details.");
          }
        } finally {
          if (isMounted) setLoadingInitial(false);
        }
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [initialPublicationId]);

  const handleFormChange = (updates: Partial<BasicInfoForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setSavedMessage(null);
  };

  const executeSave = async (targetsToSave?: PublicationTarget[]): Promise<string | null> => {
    if (!form.name.trim()) return null;
    setLoading(true);
    setError(null);
    setSavedMessage(null);

    try {
      const res = await saveBasicInfo(form, publicationId, targetsToSave);
      const newId = res.publication_id || res.id || publicationId;
      if (newId) setPublicationId(newId);
      return newId;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save publication.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    // Only send targets once the user has reached the step that edits them —
    // sending them earlier would overwrite saved targets with an empty array.
    const savedId = await executeSave(step >= 3 ? targets : undefined);
    if (savedId) setSavedMessage(`บันทึก draft แล้ว (ID: ${savedId})`);
  };

  const handleNext = async () => {
    setError(null);
    setSavedMessage(null);

    if (step === 1) {
      const savedId = await executeSave();
      if (savedId) setStep(2);
    } else if (step === 2) {
      const isNoAsset = form.publication_type === "html" || form.publication_type === "dynamic";
      if (isNoAsset) {
        setStep(3);
        return;
      }
      if (!publicationId) {
        setError("Publication ID is missing.");
        return;
      }
      setLoading(true);
      try {
        await savePublicationContent(publicationId, contentItems);
        setStep(3);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save publication content.");
      } finally {
        setLoading(false);
      }
    } else if (step === 3) {
      const savedId = await executeSave(targets);
      if (savedId) setStep(4);
    } else if (step < 5) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const isNameEmpty = !form.name.trim();
  const isNoAssetType = form.publication_type === "html" || form.publication_type === "dynamic";
  const isNextDisabled =
    loading ||
    isNameEmpty ||
    (step === 2 && !isNoAssetType && contentItems.length === 0) ||
    (step === 3 && targets.length === 0) ||
    step === 5;

  if (loadingInitial) {
    return <div className="p-8 text-center text-sm text-zinc-500">Loading draft details…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider block">Publication ID</span>
          <span className="font-mono text-sm font-medium text-zinc-800 dark:text-zinc-200">{publicationId ?? "Not saved yet"}</span>
        </div>
        {loading && <span className="text-xs font-medium text-amber-600 dark:text-amber-400 animate-pulse">Saving…</span>}
      </div>

      <nav aria-label="Progress">
        <ol className="flex items-center justify-between w-full text-xs font-medium">
          {WIZARD_STEPS.map((s, idx) => {
            const isCurrent = step === s.id;
            const isCompleted = step > s.id;
            return (
              <li key={s.id} className="flex items-center gap-2 flex-1 last:flex-initial">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                  isCurrent ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : isCompleted ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                  : "border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                }`}>
                  {isCompleted ? "✓" : s.id}
                </div>
                <span className={`hidden sm:inline ${isCurrent ? "text-zinc-900 font-semibold dark:text-zinc-100" : isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                  {s.label}
                </span>
                {idx < WIZARD_STEPS.length - 1 && <div className="flex-1 h-0.5 mx-2 bg-zinc-200 dark:bg-zinc-800 hidden md:block" />}
              </li>
            );
          })}
        </ol>
      </nav>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
        </div>
      )}
      {savedMessage && (
        <div className="rounded-md bg-emerald-50 p-4 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{savedMessage}</p>
        </div>
      )}

      <div>
        {step === 1 ? (
          <BasicInfoStep form={form} onChange={handleFormChange} campaigns={campaigns} existingTags={tags} />
        ) : step === 2 ? (
          <ContentStep publicationType={form.publication_type} items={contentItems} onChange={setContentItems} mediaAssets={mediaAssets} loadingAssets={loadingAssets} assetsError={assetsError} />
        ) : step === 3 ? (
          <ChannelsStep targets={targets} onChange={setTargets} screens={screens} loadingScreens={loadingScreens} screensError={screensError} />
        ) : (
          /* ponytail: intentionally a stub for steps 4-5 */
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Step {step}: {WIZARD_STEPS[step - 1].label}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">ยังไม่ implement — step {step}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          {step > 1 && (
            <button type="button" onClick={handleBack} disabled={loading} className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSaveDraft} disabled={loading || isNameEmpty} className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            {loading ? "Saving…" : "Save as Draft"}
          </button>
          <button type="button" onClick={handleNext} disabled={isNextDisabled} title={step === 5 ? "Publishing is not implemented yet" : undefined} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            {loading ? "Saving…" : step === 5 ? "Publish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
