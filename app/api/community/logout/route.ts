import { assertCommunityOrigin, clearSessionCookie, deleteCommunitySession, sessionToken } from "../../../community-auth";

export async function POST(request: Request) {
  const originError = assertCommunityOrigin(request);
  if (originError) return originError;
  const token = sessionToken(request.headers);
  if (token) await deleteCommunitySession(token);
  return Response.json({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } });
}
