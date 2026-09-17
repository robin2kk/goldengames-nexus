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
} from "../content-utils";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const user = await requireAdmin(request);
  if (user instanceof Response) return user;
  if (!env.DB || !env.BUCKET) {
    return Response.json({ error: "Publishing storage is unavailable" }, { status: 503 });
  }

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
    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      `INSERT INTO posts (
        title, excerpt, body, platform, kind, status, featured, author_id,
        image_key, image_name, image_type, image_size,
        download_key, download_name, download_type, download_size,
        youtube_id, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        title, excerpt, body, platform, kind, status, featured, user.userId,
        image?.key ?? null, image?.name ?? null, image?.type ?? null, image?.size ?? null,
        download?.key ?? null, download?.name ?? null, download?.type ?? null, download?.size ?? null,
        youtubeId, now, now,
      )
      .run();
    return Response.json({ ok: true, id: result.meta.last_row_id }, { status: 201 });
  } catch (error) {
    await Promise.all([deleteObject(image?.key), deleteObject(download?.key)]);
    if (error instanceof UploadError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "The update could not be published" }, { status: 500 });
  }
}
