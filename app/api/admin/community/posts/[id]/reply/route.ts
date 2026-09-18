import { env } from "cloudflare:workers";
import {
  OFFICIAL_COMMUNITY_EMAIL,
  OFFICIAL_COMMUNITY_USER_ID,
  OFFICIAL_COMMUNITY_USERNAME,
} from "../../../../../../community-official";
import { assertSameOrigin, requireAdmin } from "../../../../content-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  if (!env.DB) return Response.json({ error: "Database unavailable" }, { status: 503 });

  const { id } = await params;
  const postId = Number(id);
  const input = await request.json().catch(() => ({})) as { body?: string };
  const body = input.body?.trim().slice(0, 3000) ?? "";

  if (!Number.isInteger(postId) || postId < 1 || body.length < 2) {
    return Response.json({ error: "Enter a valid reply" }, { status: 400 });
  }

  const post = await env.DB.prepare(
    "SELECT id FROM community_posts WHERE id = ? AND status = 'approved'",
  ).bind(postId).first();
  if (!post) return Response.json({ error: "Approve the post before replying" }, { status: 404 });

  await env.DB.prepare(`INSERT OR IGNORE INTO community_users
    (id,username,email,password_hash,password_salt,status,created_at)
    VALUES (?,?,?,'disabled','disabled','system',?)`)
    .bind(
      OFFICIAL_COMMUNITY_USER_ID,
      OFFICIAL_COMMUNITY_USERNAME,
      OFFICIAL_COMMUNITY_EMAIL,
      new Date().toISOString(),
    ).run();

  const officialUser = await env.DB.prepare(
    "SELECT id FROM community_users WHERE id = ? AND status = 'system'",
  ).bind(OFFICIAL_COMMUNITY_USER_ID).first();
  if (!officialUser) {
    return Response.json({ error: "Official community identity is unavailable" }, { status: 500 });
  }

  await env.DB.prepare(`INSERT INTO community_comments
    (post_id,user_id,body,status,created_at) VALUES (?,?,?,'approved',?)`)
    .bind(postId, OFFICIAL_COMMUNITY_USER_ID, body, new Date().toISOString()).run();

  return Response.json({ ok: true, status: "approved" }, { status: 201 });
}
