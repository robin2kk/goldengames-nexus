import { env } from "cloudflare:workers";
import { assertCommunityOrigin, createCommunitySession, sessionCookie, verifyPassword, verifyTurnstile } from "../../../community-auth";

type StoredUser = { id: string; passwordHash: string; passwordSalt: string; status: string };
export async function POST(request: Request) {
  const originError = assertCommunityOrigin(request);
  if (originError) return originError;
  if (!env.DB) return Response.json({ error: "Community database unavailable" }, { status: 503 });
  const input = await request.json().catch(() => ({})) as { identity?: string; password?: string; turnstileToken?: string };
  if (!(await verifyTurnstile(request, input.turnstileToken ?? "", "community_login"))) {
    return Response.json({ error: "Verification expired or failed. Please try again." }, { status: 400 });
  }
  const identity = input.identity?.trim().toLowerCase() ?? "";
  const password = input.password ?? "";
  const user = await env.DB.prepare(`SELECT id,password_hash AS passwordHash,password_salt AS passwordSalt,status
    FROM community_users WHERE lower(email) = ? OR lower(username) = ? LIMIT 1`).bind(identity, identity).first<StoredUser>();
  if (!user || user.status !== "active" || !(await verifyPassword(password, user.passwordSalt, user.passwordHash))) {
    return Response.json({ error: "Incorrect username, email or password" }, { status: 401 });
  }
  const token = await createCommunitySession(user.id);
  return Response.json({ ok: true }, { headers: { "set-cookie": sessionCookie(token) } });
}
