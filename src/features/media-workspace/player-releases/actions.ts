"use server";

import { env } from "@/config/env";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

type Selection = { name: string; version: string; files: { name: string; size: number }[] };
type Command =
  | (Selection & { action: "prepare" })
  | (Selection & { action: "register"; id: string })
  | { action: "download"; id: string; file: string };

type Release = {
  id: string;
  display_name: string;
  version: string;
  files: { name: string; size: number; sha256: string }[];
};

type Result<T> = { data: T } | { error: string };

async function request<T>(command?: Command): Promise<Result<T>> {
  const session = await getSession();
  if (session === "forbidden" || !session.isSuperAdmin) return { error: "Player releases require platform administrator access." };
  const token = await getAuthToken();
  if (!token || !env.coreApiUrl || !env.coreApiKey) return { error: "Could not connect to Player releases." };
  try {
    const response = await fetch(`${env.coreApiUrl}/api/core/v1/media/player-releases`, {
      method: command ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": env.coreApiKey,
        "Content-Type": "application/json",
      },
      body: command ? JSON.stringify(command) : undefined,
      cache: "no-store",
    });
    const payload = await response.json();
    if (response.ok && payload.success) return { data: payload.data as T };
    if (response.status === 409) return { error: "This version is already registered." };
    if (response.status === 400) return { error: "Check the release details and upload all selected files." };
    if (response.status === 401 || response.status === 403) return { error: "Player releases require platform administrator access." };
    return { error: "Could not complete the Player release request. Try again." };
  } catch {
    return { error: "Could not connect to Player releases. Try again." };
  }
}

export async function listPlayerReleases() {
  return request<Release[]>();
}

export async function preparePlayerRelease(selection: Selection) {
  return request<{ id: string; uploads: { name: string; url: string }[] }>({ ...selection, action: "prepare" });
}

export async function registerPlayerRelease(id: string, selection: Selection) {
  return request<{ id: string }>({ ...selection, action: "register", id });
}

export async function downloadPlayerRelease(id: string, file: string) {
  return request<{ url: string }>({ action: "download", id, file });
}
