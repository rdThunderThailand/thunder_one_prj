import { redirect } from "next/navigation";
import { AcceptInviteButton, AcceptInviteForm } from "@/features/auth";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { getAuthToken } from "@/features/auth/services/get-session";
import { getCurrentUserEmail, getInviteDetails } from "@/features/auth/services/invites.service";
import type { InviteStatus } from "@/features/auth/types/auth.types";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

const STATUS_MESSAGE: Partial<Record<InviteStatus, string>> = {
  expired: "This invitation has expired. Ask whoever invited you to send a new one.",
  accepted: "This invitation has already been accepted.",
  cancelled: "This invitation was cancelled.",
};

function Message({ text }: { text: string }) {
  return <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">{text}</p>;
}

// Core's pre-existing /members invite mechanism (SHA-256 token,
// unrelated to /set-password's newer Supabase-based flow) — the one
// actually exercised today, since /employees isn't deployed yet. Ported
// from thundercore-prj-frontend-55's own working /invites/accept page
// (contract confirmed 2026-09-01), adapted to this app's server-component-
// first convention: the GET lookup and current-session check both happen
// here server-side (people/personnel/page.tsx's own "fetch server-side,
// hand resolved data to a client component" shape) rather than as a
// client-side fetch-on-mount the way the reference implementation does it,
// since this app doesn't expose a client-facing "who am I" endpoint the
// way that one does.
//
// The 3-way (really 4-way) split below mirrors AcceptInviteClient.tsx
// exactly: not pending -> message only; logged in as the invited email ->
// confirm-and-join button; logged in as someone else -> refuse, force
// logout; not logged in with an existing account -> send to /login?next=;
// not logged in with no account -> full registration form.
export default async function AcceptInvitePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <>
        <h1 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Invitation</h1>
        <Message text="This link is missing its invitation code." />
      </>
    );
  }

  const invite = await getInviteDetails(token);
  if (!invite) {
    return (
      <>
        <h1 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Invitation</h1>
        <Message text="Could not load this invitation. It may be invalid." />
      </>
    );
  }

  if (invite.status !== "pending") {
    return (
      <>
        <h1 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Invitation</h1>
        <Message text={STATUS_MESSAGE[invite.status] ?? "This invitation is no longer valid."} />
      </>
    );
  }

  const sessionToken = await getAuthToken();
  const currentEmail = sessionToken ? await getCurrentUserEmail(sessionToken) : null;

  if (currentEmail) {
    if (currentEmail.toLowerCase() === invite.email.toLowerCase()) {
      return (
        <>
          <h1 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            You&apos;re invited{invite.tenantName ? ` to ${invite.tenantName}` : ""}
          </h1>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Join as {invite.email}
            {invite.roleName ? ` (${invite.roleName})` : ""}.
          </p>
          <AcceptInviteButton token={token} />
        </>
      );
    }

    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-red-500">
          This invitation was sent to {invite.email}, but you&apos;re signed in as {currentEmail}.
        </p>
        <Message text="Sign out and open this link again to accept it." />
        <SignOutButton />
      </div>
    );
  }

  if (invite.hasAccount) {
    redirect(`/login?next=${encodeURIComponent(`/invites/accept?token=${token}`)}`);
  }

  return (
    <>
      <h1 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        You&apos;re invited{invite.tenantName ? ` to ${invite.tenantName}` : ""}
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Create your account to join{invite.roleName ? ` as ${invite.roleName}` : ""}.
      </p>
      <AcceptInviteForm token={token} email={invite.email} />
    </>
  );
}
