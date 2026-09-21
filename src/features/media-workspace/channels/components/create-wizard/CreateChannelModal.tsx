"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { classifyApiError, isDuplicateName } from "@/lib/api/api-error";
import {
  DEFAULT_CREATE_CHANNEL_DRAFT,
  step1Valid,
  step2Valid,
  toCreateChannelPayload,
  type CreateChannelDraft,
} from "../../create-wizard-state";
import { createChannelV2 } from "../../services/channel-write-api";
import { fetchChannelPlayerCandidates } from "../../services/player-candidates-api";
import { fetchChannelReferenceData } from "../../services/channels-api";
import type { ChannelPlayerCandidate } from "../../player-candidates";
import type { ChannelDetail, ChannelLocationOption } from "../../types";
import { CreateChannelSuccessCard } from "./CreateChannelSuccessCard";
import { Step1ChannelInfo } from "./Step1ChannelInfo";
import { Step2Setup } from "./Step2Setup";
import { Step3Review } from "./Step3Review";

type WizardStep = 1 | 2 | 3 | "success";

const WIZARD_STEPS = ["Channel", "Setup", "Review"];

function WizardProgress({ step }: { step: Exclude<WizardStep, "success"> }) {
  return (
    <ol className="mx-auto mb-6 flex w-full max-w-md items-center">
      {WIZARD_STEPS.map((label, index) => {
        const number = index + 1;
        const completed = number < step;
        const current = number === step;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none" aria-current={current ? "step" : undefined}>
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                completed || current
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-indigo-300 bg-white text-indigo-500"
              }`}
            >
              {completed ? "✓" : number}
            </span>
            <span className={`ml-2 text-sm font-medium ${current ? "text-indigo-600" : "text-zinc-500"}`}>{label}</span>
            {number < WIZARD_STEPS.length && (
              <span className={`mx-3 h-px flex-1 ${number < step ? "bg-indigo-300" : "bg-zinc-200"}`} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The parent mounts this only while the wizard should be open (`{isCreateOpen && <CreateChannelModal
 * .../>}`) rather than passing an `open` boolean through — that makes every re-open a fresh mount
 * with clean state for free, no reset-on-reopen effect needed (this repo's `set-state-in-effect`
 * lint rule forbids resetting state synchronously in an effect body anyway).
 */
export function CreateChannelModal({
  onClose,
  onCreated,
  onViewChannel,
}: {
  onClose: () => void;
  onCreated: (channel: ChannelDetail) => void;
  onViewChannel: (channelId: string) => void;
}) {
  const [step, setStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<CreateChannelDraft>(DEFAULT_CREATE_CHANNEL_DRAFT);
  const [nameError, setNameError] = useState<string | undefined>();
  const [locations, setLocations] = useState<ChannelLocationOption[]>([]);
  const [candidates, setCandidates] = useState<ChannelPlayerCandidate[]>([]);
  // Starts true: the mount effect below fetches immediately, and only flips this in a .then/.finally
  // callback — never synchronously in the effect body (this repo's set-state-in-effect lint rule).
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdChannel, setCreatedChannel] = useState<ChannelDetail | null>(null);

  // Only for the "Refresh" button (a click handler, not an effect body) — the mount fetch below
  // does not call this, so the effect never triggers a synchronous setState through a callee either.
  const refreshCandidates = () => {
    setCandidatesLoading(true);
    fetchChannelPlayerCandidates()
      .then(setCandidates)
      .catch(() => {})
      .finally(() => setCandidatesLoading(false));
  };

  useEffect(() => {
    fetchChannelReferenceData()
      .then((reference) => setLocations(reference.locations))
      .catch(() => {});
    fetchChannelPlayerCandidates()
      .then(setCandidates)
      .catch(() => {})
      .finally(() => setCandidatesLoading(false));
  }, []);

  const selectedPlayer = candidates.find((c) => c.id === draft.playerId) ?? null;

  const handleNext = () => {
    if (step === 1) {
      if (!step1Valid(draft)) {
        setNameError("Channel name is required");
        return;
      }
      setNameError(undefined);
      setStep(2);
    } else if (step === 2 && step2Valid(draft)) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const channel = await createChannelV2(toCreateChannelPayload(draft));
      onCreated(channel);
      setCreatedChannel(channel);
      setStep("success");
    } catch (caught) {
      if (caught instanceof Error && isDuplicateName(caught.message)) {
        setSubmitError("A Channel with this name already exists.");
        setStep(1);
      } else {
        setSubmitError(classifyApiError(caught, "Could not create Channel. Try again.").message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const footer = step === "success" ? null : (
    <div className="flex w-full items-center justify-between">
      <Button variant="secondary" onClick={step === 1 ? onClose : () => setStep((step === 3 ? 2 : 1) as WizardStep)}>
        {step === 1 ? "Cancel" : "← Back"}
      </Button>
      {step === 3 ? (
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? "Creating…" : "Create Channel"}
          </Button>
        </div>
      ) : (
        <Button onClick={handleNext} disabled={step === 2 && !step2Valid(draft)}>
          Next →
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="Create Channel"
      description="Register a new channel to manage your screens, TVs, or kiosks."
      titleClassName="text-2xl"
      footer={footer}
      size={step === 3 ? "xl" : "preview"}
      showCloseButton
      overflowVisible={step === 2}
    >
      {step !== "success" && <WizardProgress step={step} />}
      {step === 1 && (
        <Step1ChannelInfo draft={draft} locations={locations} nameError={nameError} onChange={setDraft} />
      )}
      {step === 2 && (
        <Step2Setup
          draft={draft}
          candidates={candidates}
          candidatesLoading={candidatesLoading}
          onChange={setDraft}
          onRefreshCandidates={refreshCandidates}
        />
      )}
      {step === 3 && (
        <Step3Review
          draft={draft}
          locations={locations}
          player={selectedPlayer}
          onEditChannel={() => setStep(1)}
          onEditSetup={() => setStep(2)}
        />
      )}
      {step === "success" && createdChannel && (
        <CreateChannelSuccessCard
          channelName={createdChannel.name}
          onViewChannel={() => {
            onViewChannel(createdChannel.id);
            onClose();
          }}
          onCreateAnother={() => {
            setDraft(DEFAULT_CREATE_CHANNEL_DRAFT);
            setStep(1);
          }}
        />
      )}
      {submitError && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {submitError}
        </p>
      )}
    </Modal>
  );
}
