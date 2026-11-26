"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { CalendarIcon, DownloadIcon, LocationIcon, UserIcon, WarrantyIcon } from "@/components/ui/icons";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { locationTrail } from "../../domain/asset-profile";
import { Fact, formatDate, formatDay, ProfileSection, SectionMessage, StatusValue } from "./ProfileParts";
import { DisabledHint, ProfileCustodyActions } from "./ProfileControls";
import { WarrantyValue } from "./ProfileValues";

function ProfileQr({ asset }: { asset: AssetDetail }) {
  const [result, setResult] = useState<{ value: string; url: string | null } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!asset.qrValue) return;
    let alive = true;
    const value = asset.qrValue;
    void import("qrcode").then((encoder) => encoder.toDataURL(value, { errorCorrectionLevel: "M", margin: 4, width: 384 }))
      .then((url) => { if (alive) setResult({ value, url }); })
      .catch(() => { if (alive) setResult({ value, url: null }); });
    return () => { alive = false; };
  }, [asset.qrValue, attempt]);
  const current = result?.value === asset.qrValue ? result : null;
  return (
    <ProfileSection title="QR Code">
      {!asset.qrValue ? <SectionMessage>QR code is unavailable for this asset.</SectionMessage> : !current ? (
        <p role="status" className="text-xs text-muted-foreground">Preparing QR code…</p>
      ) : !current.url ? (
        <div className="space-y-2">
          <SectionMessage tone="error">Couldn’t prepare the QR code.</SectionMessage>
          <Button variant="outline" size="sm" onClick={() => { setResult(null); setAttempt((value) => value + 1); }}>Retry</Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- locally encoded PNG, also used by Download. */}
          <img src={current.url} alt={`QR code for ${asset.assetTag}`} className="size-24 shrink-0" />
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">Asset Tag</p>
            <p className="text-xs font-semibold wrap-anywhere">{asset.assetTag}</p>
            <p className="text-xs text-muted-foreground">Scan to view this asset</p>
            <Button asChild variant="outline" size="sm" className="text-accent-foreground">
              <a href={current.url} download={`${asset.assetTag}-qr.png`}>
                <DownloadIcon aria-hidden="true" className="size-4" />
                Download
              </a>
            </Button>
          </div>
        </div>
      )}
    </ProfileSection>
  );
}

export function ProfileRail({ asset }: { asset: AssetDetail }) {
  return (
    <aside aria-label="Asset quick reference" className="grid min-w-0 gap-3 @min-xl/asset-profile:grid-cols-2 @min-6xl/asset-profile:grid-cols-1">
      <ProfileSection title="Quick Actions">
        <ProfileCustodyActions asset={asset} placement="rail" />
      </ProfileSection>
      <ProfileSection title="Status & Key Dates">
        <dl className="space-y-3">
          <Fact icon={WarrantyIcon} label="Status" value={<StatusValue status={asset.lifecycleStatus} />} />
          <Fact icon={CalendarIcon} label="Purchase Date" value={formatDate(asset.acquisitionDate)} />
          <Fact icon={UserIcon} label="Assigned Date" value={asset.custody ? formatDay(asset.custody.since) : "—"} />
          <Fact icon={WarrantyIcon} label="Warranty" value={<WarrantyValue warranty={asset.currentWarranty} />} />
        </dl>
      </ProfileSection>
      <ProfileSection title="Location">
        <div className="space-y-3">
          <p className="flex items-start gap-2 text-xs leading-relaxed font-medium wrap-anywhere text-foreground">
            <LocationIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            {locationTrail(asset.locationPath, asset.location) || "—"}
          </p>
          <div className="flex justify-end">
            <DisabledHint>
              <Button disabled variant="outline" size="sm">View Location</Button>
            </DisabledHint>
          </div>
        </div>
      </ProfileSection>
      <ProfileQr asset={asset} />
    </aside>
  );
}
