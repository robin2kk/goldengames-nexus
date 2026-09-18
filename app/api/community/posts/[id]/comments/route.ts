import { env } from "cloudflare:workers";
import { assertCommunityOrigin, getCommunityUser } from "../../../../../community-auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = assertCommunityOrigin(request);
  if (originError) return originError;
  const user = await getCommunityUser(request.headers);
  if (!user) return Response.json({ error: "Sign in to reply" }, { status: 401 });
  if (!env.DB) return Response.json({ error: "Community database unavailable" }, { status: 503 });
  const { id } = await params;
  const postId = Number(id);
  const input = await request.json().catch(() => ({})) as { body?: string };
  const body = input.body?.trim().slice(0, 3000) ?? "";
  if (!Number.isInteger(postId) || postId < 1 || body.length < 2) return Response.json({ error: "Enter a valid reply" }, { status: 400 });
  const post = await env.DB.prepare("SELECT id FROM community_posts WHERE id = ? AND status = 'approved'").bind(postId).first();
  if (!post) return Response.json({ error: "Conversation not found" }, { status: 404 });
  await env.DB.prepare(`INSERT INTO community_comments (post_id,user_id,body,status,created_at) VALUES (?,?,?,'pending',?)`)
    .bind(postId, user.id, body, new Date().toISOString()).run();
  return Response.json({ ok: true, status: "pending" }, { status: 201 });
}
