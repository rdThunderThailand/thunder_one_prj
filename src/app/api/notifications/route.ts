import { NextResponse } from "next/server";
import { resolveRole, resolveShellVariant } from "@/config/rbac";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { getDraftPublications, getPartnerApplications, getRoster } from "@/features/my-work/services/work-sources-api";
import { buildMyWork } from "@/features/my-work/work-items";

export const dynamic = "force-dynamic";

// Feed for the Topbar bell. Core has no notifications system, so the bell
// shows "things that need you" — exactly My Work's items (same sources,
// same employee/admin scoping via features/my-work/work-items.ts), so the
// two can never disagree. Read/unread lives per browser on the client.
//
// `available: false` means none of the sources could be read (no session,
// Core down) — the bell shows an error state rather than "all caught up".
export async function GET() {
  const session = await getSession();
  const token = await getAuthToken();
  if (session === "forbidden" || !token || !session.tenantId) {
    return NextResponse.json({ items: [], available: false }, { status: 401 });
  }

  const scope = resolveShellVariant(resolveRole(session)) === "employee" ? "personal" : "admin";
  const [partnerApplications, roster, drafts] = await Promise.all([
    getPartnerApplications(token),
    scope === "admin" ? getRoster(token, session.tenantId) : Promise.resolve(null),
    getDraftPublications(token),
  ]);
  const work = buildMyWork({ partnerApplications, roster, drafts }, session.userId, scope);

  return NextResponse.json({
    items: work.items.map(({ id, kind, title, dateNote, href }) => ({ id, kind, title, dateNote, href })),
    available: Object.values(work.available).some(Boolean),
  });
}
