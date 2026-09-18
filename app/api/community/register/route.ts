import { env } from "cloudflare:workers";
import { assertCommunityOrigin, createCommunitySession, hashPassword, sessionCookie } from "../../../community-auth";

export async function POST(request: Request) {
  const originError = assertCommunityOrigin(request);
  if (originError) return originError;
  if (!env.DB) return Response.json({ error: "Community database unavailable" }, { status: 503 });
  const input = await request.json().catch(() => ({})) as { username?: string; email?: string; password?: string };
  const username = input.username?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const password = input.password ?? "";
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return Response.json({ error: "Username must be 3–24 characters using letters, numbers or underscores" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  if (password.length < 10 || password.length > 128) return Response.json({ error: "Password must contain at least 10 characters" }, { status: 400 });
  const id = crypto.randomUUID();
  const passwordData = await hashPassword(password);
  try {
    await env.DB.prepare(`INSERT INTO community_users (id,username,email,password_hash,password_salt,status,created_at)
      VALUES (?,?,?,?,?,'active',?)`).bind(id, username, email, passwordData.hash, passwordData.salt, new Date().toISOString()).run();
  } catch {
    return Response.json({ error: "That username or email is already registered" }, { status: 409 });
  }
  const token = await createCommunitySession(id);
  return Response.json({ ok: true }, { status: 201, headers: { "set-cookie": sessionCookie(token) } });
}
