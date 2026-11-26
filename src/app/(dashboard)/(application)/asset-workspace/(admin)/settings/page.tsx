import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { AccessDeniedState, EmptyState } from "@/features/asset-workspace/components/states/states";
import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";
import { SettingsView } from "@/features/asset-workspace/components/settings/SettingsView";
import { getAssetSettings, getSettingsCategoryOptions } from "@/features/asset-workspace/services/asset-settings-api";

// Asset Admin only (02 §3.4): Core answers 403 to anyone else, and the page shows no-access instead of an error.
export default async function SettingsPage() {
  const [read, categories] = await Promise.all([getAssetSettings(), getSettingsCategoryOptions()]);
  if (!read.ok) {
    return (
      <div className="p-6">
        {read.reason === "forbidden" ? (
          <AccessDeniedState
            title="Settings are for Asset Admins"
            body="Your role can't open Settings. Ask an Asset Admin if you need a change."
          />
        ) : read.reason === "unauthenticated" ? (
          <EmptyState
            title="Sign in to view settings"
            body="Sign in again to view settings."
            action={
              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState
            title="Couldn't load settings"
            body="Settings could not be loaded. Try again in a moment."
          />
        )}
      </div>
    );
  }
  return (
    <SettingsView
      initial={read.data}
      categories={categories}
    />
  );
}
