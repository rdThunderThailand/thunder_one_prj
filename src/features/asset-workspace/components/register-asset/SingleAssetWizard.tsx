"use client";

import { useState, useSyncExternalStore } from "react";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import type { ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationLoading } from "./RegistrationLoading";
import { SingleAssetRegistrationForm } from "./SingleAssetRegistrationForm";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
interface WizardProps {
  options: RegistrationOptions;
  tenantId: string;
  userId: string;
  initialCategory?: ReferenceItem;
  initialLocation?: ReferenceItem;
}

export function SingleAssetWizard(props: WizardProps) {
  // Read tab storage only after hydration, preserving the existing restore sequence.
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  return ready ? <RegistrationSession {...props} /> : <RegistrationLoading />;
}

function RegistrationSession(props: WizardProps) {
  const [generation, setGeneration] = useState(0);
  return (
    <SingleAssetRegistrationForm key={`${props.tenantId}:${props.userId}:${generation}`}
      {...props} onRestart={() => setGeneration((value) => value + 1)} />
  );
}
