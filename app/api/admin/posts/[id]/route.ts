import { env } from "cloudflare:workers";
import {
  ALLOWED_KINDS,
  ALLOWED_PLATFORMS,
  UploadError,
  assertSameOrigin,
  clean,
  deleteObject,
  getYouTubeId,
  requireAdmin,
  storeUpload,
} from "../../content-utils";

type ExistingPost = { downloadKey: string | null; imageKey: string | null };

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const user = await requireAdmin(request);
  if (user instanceof Response) return user;
  if (!env.DB || !env.BUCKET) {
    return Response.json({ error: "Publishing storage is unavailable" }, { status: 503 });
  }

  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId < 1) {
    return Response.json({ error: "Invalid article" }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    "SELECT image_key AS imageKey, download_key AS downloadKey FROM posts WHERE id = ?",
  ).bind(postId).first<ExistingPost>();
  if (!existing) return Response.json({ error: "Article not found" }, { status: 404 });

  const form = await request.formData();
  const title = clean(form.get("title"), 140);
  const excerpt = clean(form.get("excerpt"), 280);
  const body = clean(form.get("body"), 20_000);
  const platform = clean(form.get("platform"), 20);
  const kind = clean(form.get("kind"), 30);
  const status = form.get("status") === "draft" ? "draft" : "published";
  const featured = form.get("featured") ? 1 : 0;
  const youtubeUrl = clean(form.get("youtubeUrl"), 300);
  const youtubeId = youtubeUrl ? getYouTubeId(youtubeUrl) : null;

  if (!title || !excerpt || !body) {
    return Response.json({ error: "Headline, summary and article are required" }, { status: 400 });
  }
  if (!ALLOWED_PLATFORMS.includes(platform) || !ALLOWED_KINDS.includes(kind)) {
    return Response.json({ error: "Invalid platform or content type" }, { status: 400 });
  }
  if (youtubeUrl && !youtubeId) {
    return Response.json({ error: "Please enter a valid YouTube video link" }, { status: 400 });
  }

  let image = null;
  let download = null;
  try {
    image = await storeUpload(form.get("image"), "image");
    download = await storeUpload(form.get("file"), "download");
    const removeImage = form.get("removeImage") === "1";
    const removeDownload = form.get("removeDownload") === "1";
    const imageKey = image?.key ?? (removeImage ? null : existing.imageKey);
    const downloadKey = download?.key ?? (removeDownload ? null : existing.downloadKey);

    await env.DB.prepare(
      `UPDATE posts SET
        title = ?, excerpt = ?, body = ?, platform = ?, kind = ?, status = ?, featured = ?,
        image_key = ?,
        image_name = CASE WHEN ? IS NOT NULL THEN ? WHEN ? = 1 THEN NULL ELSE image_name END,
        image_type = CASE WHEN ? IS NOT NULL THEN ? WHEN ? = 1 THEN NULL ELSE image_type END,
        image_size = CASE WHEN ? IS NOT NULL THEN ? WHEN ? = 1 THEN NULL ELSE image_size END,
        download_key = ?,
        download_name = CASE WHEN ? IS NOT NULL THEN ? WHEN ? = 1 THEN NULL ELSE download_name END,
        download_type = CASE WHEN ? IS NOT NULL THEN ? WHEN ? = 1 THEN NULL ELSE download_type END,
        download_size = CASE WHEN ? IS NOT NULL THEN ? WHEN ? = 1 THEN NULL ELSE download_size END,
        youtube_id = ?, author_id = ?, updated_at = ?
      WHERE id = ?`,
    ).bind(
      title, excerpt, body, platform, kind, status, featured,
      imageKey,
      image?.key ?? null, image?.name ?? null, removeImage ? 1 : 0,
      image?.key ?? null, image?.type ?? null, removeImage ? 1 : 0,
      image?.key ?? null, image?.size ?? null, removeImage ? 1 : 0,
      downloadKey,
      download?.key ?? null, download?.name ?? null, removeDownload ? 1 : 0,
      download?.key ?? null, download?.type ?? null, removeDownload ? 1 : 0,
      download?.key ?? null, download?.size ?? null, removeDownload ? 1 : 0,
      youtubeId, user.userId, new Date().toISOString(), postId,
    ).run();

    const staleObjects = [];
    if ((image || removeImage) && existing.imageKey && existing.imageKey !== image?.key) staleObjects.push(existing.imageKey);
    if ((download || removeDownload) && existing.downloadKey && existing.downloadKey !== download?.key) staleObjects.push(existing.downloadKey);
    await Promise.allSettled(staleObjects.map((key) => deleteObject(key)));
    return Response.json({ ok: true, id: postId });
  } catch (error) {
    await Promise.all([deleteObject(image?.key), deleteObject(download?.key)]);
    if (error instanceof UploadError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "The update could not be saved" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const user = await requireAdmin(request);
  if (user instanceof Response) return user;
  if (!env.DB) return Response.json({ error: "Database unavailable" }, { status: 503 });

  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId < 1) {
    return Response.json({ error: "Invalid article" }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    "SELECT image_key AS imageKey, download_key AS downloadKey FROM posts WHERE id = ?",
  ).bind(postId).first<ExistingPost>();
  if (!existing) return Response.json({ error: "Article not found" }, { status: 404 });

  await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(postId).run();
  await Promise.allSettled([deleteObject(existing.imageKey), deleteObject(existing.downloadKey)]);
  return Response.json({ ok: true });
}
