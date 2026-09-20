import { env } from "cloudflare:workers";
import { assertCommunityOrigin, getCommunityUser } from "../../../community-auth";

const platforms = ["PS5", "PS4", "PS3", "Xbox", "Switch", "Retro", "General"];
const kinds = ["Question", "Discussion"];
export async function POST(request: Request) {
  const originError = assertCommunityOrigin(request);
  if (originError) return originError;
  const user = await getCommunityUser(request.headers);
  if (!user) return Response.json({ error: "Sign in to create a post" }, { status: 401 });
  if (!env.DB) return Response.json({ error: "Community database unavailable" }, { status: 503 });
  const input = await request.json().catch(() => ({})) as { title?: string; body?: string; platform?: string; kind?: string };
  const title = input.title?.trim().slice(0, 120) ?? "";
  const body = input.body?.trim().slice(0, 5000) ?? "";
  const platform = input.platform ?? "General";
  const kind = input.kind ?? "Question";
  if (title.length < 6 || body.length < 20) return Response.json({ error: "Add a clear title and at least 20 characters of detail" }, { status: 400 });
  if (!platforms.includes(platform) || !kinds.includes(kind)) return Response.json({ error: "Invalid category" }, { status: 400 });
  const now = new Date().toISOString();
  const result = await env.DB.prepare(`INSERT INTO community_posts (user_id,title,body,platform,kind,status,created_at,updated_at)
    VALUES (?,?,?,?,?,'pending',?,?)`).bind(user.id, title, body, platform, kind, now, now).run();
  return Response.json({ ok: true, id: result.meta.last_row_id, status: "pending" }, { status: 201 });
}
