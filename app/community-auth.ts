import { env } from "cloudflare:workers";
import { headers } from "next/headers";

export type CommunityUser = { id: string; username: string; email: string };

const COOKIE_NAME = "ggn_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();

export async function getCommunityUser(requestHeaders?: Headers): Promise<CommunityUser | null> {
  if (!env.DB) return null;
  const list = requestHeaders ?? (await headers());
  const token = readCookie(list.get("cookie"), COOKIE_NAME);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const user = await env.DB.prepare(`SELECT u.id, u.username, u.email
    FROM community_sessions s JOIN community_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active'`)
    .bind(tokenHash, new Date().toISOString()).first<CommunityUser>();
  return user ?? null;
}

export async function createCommunitySession(userId: string): Promise<string> {
  if (!env.DB) throw new Error("Database unavailable");
  const token = randomToken(32);
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_SECONDS * 1000);
  await env.DB.prepare("INSERT INTO community_sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)")
    .bind(await sha256(token), userId, expires.toISOString(), now.toISOString()).run();
  return token;
}

export async function deleteCommunitySession(token: string): Promise<void> {
  if (env.DB) await env.DB.prepare("DELETE FROM community_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
}

export function sessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function sessionToken(headers: Headers): string | null {
  return readCookie(headers.get("cookie"), COOKIE_NAME);
}

export async function hashPassword(password: string, salt = randomToken(16)): Promise<{ hash: string; salt: string }> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 120_000 }, key, 256);
  return { hash: toBase64Url(new Uint8Array(bits)), salt };
}

export async function verifyPassword(password: string, salt: string, expected: string): Promise<boolean> {
  const actual = (await hashPassword(password, salt)).hash;
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}

export function assertCommunityOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  return null;
}

async function sha256(value: string): Promise<string> {
  return toBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

function randomToken(bytes: number): string {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return toBase64Url(value);
}

function toBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function readCookie(cookie: string | null, name: string): string | null {
  const item = cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}
