import { env } from "cloudflare:workers";
import { getAdminUser, type AdminUser } from "../../cloudflare-access-auth";

export const ALLOWED_PLATFORMS = ["PS5", "PS4", "PS3", "Xbox", "Switch", "Retro"];
export const ALLOWED_KINDS = ["Scene News", "Homebrew", "Release", "Video", "Guide", "Opinion"];

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const BLOCKED_DOWNLOAD_TYPES = new Set([
  "text/html",
  "image/svg+xml",
  "application/javascript",
  "text/javascript",
]);

export type StoredUpload = {
  key: string;
  name: string;
  type: string;
  size: number;
};

export async function requireAdmin(request: Request): Promise<AdminUser | Response> {
  const user = await getAdminUser(request.headers);
  if (!user) return Response.json({ error: "Private administrator access required" }, { status: 401 });
  return user;
}

export function assertSameOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }
  if (fetchSite && fetchSite !== "same-origin") {
    return Response.json({ error: "Cross-site requests are not allowed" }, { status: 403 });
  }
  return null;
}

export async function storeUpload(
  value: FormDataEntryValue | null,
  kind: "image" | "download",
): Promise<StoredUpload | null> {
  if (!(value instanceof File) || !value.size) return null;
  if (!env.BUCKET) throw new Error("File storage is unavailable");

  const limit = kind === "image" ? 8 * 1024 * 1024 : 25 * 1024 * 1024;
  if (value.size > limit) {
    throw new UploadError(`${kind === "image" ? "Image" : "File"} must be smaller than ${kind === "image" ? "8" : "25"} MB`);
  }

  const type = (value.type || "application/octet-stream").toLowerCase();
  if (kind === "image" && !IMAGE_TYPES.has(type)) {
    throw new UploadError("Images must be JPG, PNG, WebP or GIF");
  }
  if (kind === "download" && BLOCKED_DOWNLOAD_TYPES.has(type)) {
    throw new UploadError("This file type cannot be offered as a download");
  }

  const name = safeFilename(value.name);
  const key = `${kind === "image" ? "images" : "downloads"}/${crypto.randomUUID()}-${name}`;
  await env.BUCKET.put(key, value.stream(), {
    httpMetadata: { contentType: type },
    customMetadata: { originalName: name },
  });
  return { key, name, type, size: value.size };
}

export async function deleteObject(key?: string | null): Promise<void> {
  if (key && env.BUCKET) await env.BUCKET.delete(key);
}

export function clean(value: FormDataEntryValue | null, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function getYouTubeId(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return validId(url.pathname.slice(1));
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") return validId(url.searchParams.get("v") || "");
      const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/);
      return match ? validId(match[1]) : null;
    }
    return null;
  } catch {
    return null;
  }
}

export class UploadError extends Error {}

function validId(value: string): string | null {
  return /^[\w-]{11}$/.test(value) ? value : null;
}

function safeFilename(value: string): string {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .replace(/\.{2,}/g, ".")
    .trim()
    .slice(0, 160);
  return cleaned || "upload.bin";
}
