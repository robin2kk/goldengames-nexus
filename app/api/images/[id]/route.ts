import { env } from "cloudflare:workers";

type ImageRow = { imageKey: string; imageType: string };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!env.DB || !env.BUCKET) return new Response("Storage unavailable", { status: 503 });
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId < 1) return new Response("Image not found", { status: 404 });

  const row = await env.DB.prepare(
    `SELECT image_key AS imageKey, image_type AS imageType
     FROM posts WHERE id = ? AND status = ?`,
  ).bind(postId, "published").first<ImageRow>();
  if (!row?.imageKey) return new Response("Image not found", { status: 404 });

  const object = await env.BUCKET.get(row.imageKey);
  if (!object) return new Response("Image not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": row.imageType || "application/octet-stream",
      "cache-control": "public, max-age=3600, s-maxage=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
