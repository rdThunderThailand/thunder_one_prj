"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { setPassword } from "../services/auth.service";

const MIN_PASSWORD_LENGTH = 8;

/** Parses Supabase's invite-link redirect. Supabase's implicit-flow invite
 *  link lands here with `#access_token=...&refresh_token=...&type=invite`
 *  in the URL *fragment*, not a `?code=` query param — fragments never
 *  reach the server, so this must run client-side (confirmed empirically by
 *  Core against the actual Supabase project, 2026-09-01; a PKCE-configured
 *  project would use `?code=` instead — not this project today, but a
 *  known future risk Core flagged, not handled here). A rejected/expired
 *  link instead carries `#error=...&error_description=...`. Pure/read-only,
 *  so it's safe as a useState lazy initializer (runs once at mount, no
 *  external side effect to worry about under StrictMode double-invoke).
 */
function readInviteHash(): { accessToken: string | null; linkError: string | null } {
  if (typeof window === "undefined") return { accessToken: null, linkError: null };
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorDescription = params.get("error_description");
  return {
    accessToken: params.get("access_token"),
    linkError: errorDescription ? errorDescription.replace(/\+/g, " ") : null,
  };
}

// Completes a Supabase invite from the Add Employee flow (real as of
// 2026-09-01 — see services/auth.service.ts's setPassword). Reached via
// /set-password, which src/proxy.ts allow-lists alongside /login and
// /register since an invitee has no session cookie yet by definition.
export function SetPasswordForm() {
  const router = useRouter();
  const [{ accessToken, linkError }] = useState(readInviteHash);
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (!accessToken) {
      setError("This link is missing its access token.");
      return;
    }

    setPending(true);
    try {
      await setPassword({ accessToken, password });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set your password.");
    } finally {
      setPending(false);
    }
  }

  if (linkError || !accessToken) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-red-500">{linkError ?? "This link is missing its access token."}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ask whoever invited you to send a new invitation, or open the link directly from your
          invitation email rather than a copy or forward — or{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            sign in
          </Link>{" "}
          if you already have an account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        value={password}
        onChange={(event) => setPasswordValue(event.target.value)}
      />
      <Input
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Setting password..." : "Set password"}
      </Button>
    </form>
  );
}
