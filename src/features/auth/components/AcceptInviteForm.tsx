"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registerAndAcceptInvite } from "../services/auth.service";

const MIN_PASSWORD_LENGTH = 8;

interface AcceptInviteFormProps {
  token: string;
  /** From the invite itself, read-only — Core ties the new account to this
   *  exact email, so it isn't a field the visitor can change here. */
  email: string;
}

// The "brand-new invitee, no Core account yet" branch — collects name +
// password, then registers/logs in/accepts in one call. See the accept
// page's own comment for the full 3-way split this is one arm of.
export function AcceptInviteForm({ token, email }: AcceptInviteFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
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

    setPending(true);
    try {
      const result = await registerAndAcceptInvite({ token, email, password, firstName, lastName });
      if (!result.ok) {
        if (result.signedIn) {
          // A real account + session exists even though accept itself
          // failed — send them in rather than strand them on this form;
          // the dashboard's own "forbidden" state explains the rest if
          // membership genuinely didn't attach.
          router.push("/");
          router.refresh();
          return;
        }
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete registration.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input label="Email" name="email" type="email" value={email} disabled readOnly />
      <Input
        label="First name"
        name="firstName"
        type="text"
        autoComplete="given-name"
        required
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
      />
      <Input
        label="Last name"
        name="lastName"
        type="text"
        autoComplete="family-name"
        required
        value={lastName}
        onChange={(event) => setLastName(event.target.value)}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
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
        {pending ? "Creating account..." : "Create account & join"}
      </Button>
    </form>
  );
}
