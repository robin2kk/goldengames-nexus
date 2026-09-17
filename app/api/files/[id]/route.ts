import { env } from "cloudflare:workers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!env.DB || !env.BUCKET) return new Response("Storage unavailable", { status: 503 });
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId < 1) return new Response("File not found", { status: 404 });
  const row = await env.DB.prepare(
    `SELECT download_key AS downloadKey, download_name AS downloadName, download_type AS downloadType
     FROM posts WHERE id = ? AND status = ?`,
  ).bind(postId, "published").first<{ downloadKey: string; downloadName: string; downloadType: string }>();
  if (!row?.downloadKey) return new Response("File not found", { status: 404 });
  const object = await env.BUCKET.get(row.downloadKey);
  if (!object) return new Response("File not found", { status: 404 });
  const filename = row.downloadName.replace(/["\\\r\n]/g, "_");
  return new Response(object.body, {
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, max-age=60",
      "x-content-type-options": "nosniff",
    },
  });
}
