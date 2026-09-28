import { NextResponse } from "next/server";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { coreGet } from "@/lib/core/core-get";

export const dynamic = "force-dynamic";

// Server half of the Topbar's global search (components/layout/
// CommandPalette.tsx). Pages/Apps are matched client-side from the nav
// config; this route searches the Core data that actually supports it, all
// in parallel, each group failing independently (`null` = that source is
// unavailable to this user — e.g. no Media tenant — shown as nothing, not
// as an error for the whole search):
// - people: `GET /tenants/:id/members?search=` (Core's own name/email search)
// - media: `GET /media/videos?search=` (Media Library files)
// - channels: `GET /media/channels`, filtered by name here (no server-side
//   search param; the list is small)
// Assets aren't searchable yet: `/assets/list` has no text-search param.

export interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface SearchResponse {
  people: SearchHit[] | null;
  media: SearchHit[] | null;
  channels: SearchHit[] | null;
}

const LIMIT = 5;

interface MemberRow {
  id: string;
  job_title: string | null;
  user: { full_name?: string | null; email?: string | null } | null;
}

interface MediaRow {
  id: string;
  title?: string;
  kind?: "video" | "image";
}

interface ChannelRow {
  id: string;
  name: string;
  location?: { name?: string } | null;
}

async function searchPeople(token: string, tenantId: string, q: string): Promise<SearchHit[] | null> {
  const data = await coreGet<{ data: MemberRow[] }>(
    `/tenants/${tenantId}/members?search=${encodeURIComponent(q)}&limit=${LIMIT}`,
    token
  );
  if (!data) return null;
  return data.data.map((row) => {
    const name = row.user?.full_name?.trim() || row.user?.email || "ไม่ระบุชื่อ";
    return {
      id: row.id,
      title: name,
      subtitle: [row.job_title, row.user?.email].filter(Boolean).join(" · ") || "บุคลากร",
      href: `/people/personnel?search=${encodeURIComponent(name)}`,
    };
  });
}

async function searchMedia(token: string, q: string): Promise<SearchHit[] | null> {
  const data = await coreGet<{ items?: MediaRow[] }>(
    `/media/videos?search=${encodeURIComponent(q)}&page=1&page_size=${LIMIT}`,
    token
  );
  if (!data || !Array.isArray(data.items)) return null;
  return data.items.map((item) => ({
    id: item.id,
    title: item.title || "ไม่มีชื่อไฟล์",
    subtitle: item.kind === "image" ? "รูปภาพ · Media Library" : "วิดีโอ · Media Library",
    href: `/media-workspace/assets/${item.id}`,
  }));
}

async function searchChannels(token: string, q: string): Promise<SearchHit[] | null> {
  const data = await coreGet<unknown>("/media/channels", token);
  const rows: ChannelRow[] | null = Array.isArray(data)
    ? data
    : data !== null && typeof data === "object" && Array.isArray((data as { channels?: unknown }).channels)
      ? (data as { channels: ChannelRow[] }).channels
      : null;
  if (!rows) return null;
  const needle = q.toLowerCase();
  return rows
    .filter((row) => typeof row.name === "string" && row.name.toLowerCase().includes(needle))
    .slice(0, LIMIT)
    .map((row) => ({
      id: row.id,
      title: row.name,
      subtitle: row.location?.name ? `Channel · ${row.location.name}` : "Channel",
      href: `/media-workspace/channels?q=${encodeURIComponent(row.name)}`,
    }));
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ people: [], media: [], channels: [] } satisfies SearchResponse);
  }

  const session = await getSession();
  const token = await getAuthToken();
  if (session === "forbidden" || !token || !session.tenantId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const [people, media, channels] = await Promise.all([
    searchPeople(token, session.tenantId, q),
    searchMedia(token, q),
    searchChannels(token, q),
  ]);
  return NextResponse.json({ people, media, channels } satisfies SearchResponse);
}
