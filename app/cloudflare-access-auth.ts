import { env } from "cloudflare:workers";
import { headers } from "next/headers";

export type AdminUser = {
  userId: string;
  email: string;
  displayName: string;
};

type AccessPayload = {
  aud?: string | string[];
  email?: string;
  exp?: number;
  iss?: string;
  nbf?: number;
  sub?: string;
};

type AccessHeader = { alg?: string; kid?: string };
type AccessJwk = JsonWebKey & { kid?: string };
type AccessCerts = { keys?: AccessJwk[] };

let cachedCerts: { domain: string; expiresAt: number; keys: AccessJwk[] } | null = null;

export async function getAdminUser(requestHeaders?: Headers): Promise<AdminUser | null> {
  const runtimeEnv = env as Cloudflare.Env;
  const requestHeaderList = requestHeaders ?? (await headers());

  if (runtimeEnv.ENVIRONMENT === "development" && runtimeEnv.DEV_ADMIN_EMAIL) {
    const email = runtimeEnv.DEV_ADMIN_EMAIL.trim().toLowerCase();
    return { userId: `local:${email}`, email, displayName: email };
  }

  const token = requestHeaderList.get("cf-access-jwt-assertion");
  const forwardedEmail = requestHeaderList
    .get("cf-access-authenticated-user-email")
    ?.trim()
    .toLowerCase();
  const teamDomain = normalizeTeamDomain(runtimeEnv.CF_ACCESS_TEAM_DOMAIN);
  const audience = runtimeEnv.CF_ACCESS_AUD?.trim();

  if (!token || !forwardedEmail || !teamDomain || !audience) return null;

  const payload = await verifyAccessToken(token, teamDomain, audience).catch(() => null);
  if (!payload) return null;

  const tokenEmail = payload.email?.trim().toLowerCase();
  if (!tokenEmail || tokenEmail !== forwardedEmail) return null;

  const allowlist = parseAdminEmails(runtimeEnv.ADMIN_EMAILS);
  if (!allowlist.has(tokenEmail)) return null;

  return {
    userId: payload.sub || tokenEmail,
    email: tokenEmail,
    displayName: tokenEmail,
  };
}

export function isAdminConfigured(): boolean {
  const runtimeEnv = env as Cloudflare.Env;
  if (runtimeEnv.ENVIRONMENT === "development" && runtimeEnv.DEV_ADMIN_EMAIL) return true;
  return Boolean(
    runtimeEnv.CF_ACCESS_TEAM_DOMAIN &&
      runtimeEnv.CF_ACCESS_AUD &&
      parseAdminEmails(runtimeEnv.ADMIN_EMAILS).size,
  );
}

async function verifyAccessToken(
  token: string,
  teamDomain: string,
  audience: string,
): Promise<AccessPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const jwtHeader = decodeJson<AccessHeader>(parts[0]);
  const payload = decodeJson<AccessPayload>(parts[1]);
  if (!jwtHeader || !payload || jwtHeader.alg !== "RS256" || !jwtHeader.kid) return null;

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= now || (payload.nbf && payload.nbf > now + 30)) return null;
  if (normalizeIssuer(payload.iss) !== normalizeIssuer(teamDomain)) return null;
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(audience)) return null;

  const keys = await getAccessCerts(teamDomain);
  const jwk = keys.find((key) => key.kid === jwtHeader.kid);
  if (!jwk) return null;

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  return valid ? payload : null;
}

async function getAccessCerts(teamDomain: string): Promise<AccessJwk[]> {
  if (cachedCerts && cachedCerts.domain === teamDomain && cachedCerts.expiresAt > Date.now()) {
    return cachedCerts.keys;
  }
  const response = await fetch(`${teamDomain}/cdn-cgi/access/certs`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error("Cloudflare Access certificates are unavailable");
  const body = (await response.json()) as AccessCerts;
  const keys = body.keys ?? [];
  cachedCerts = { domain: teamDomain, expiresAt: Date.now() + 10 * 60 * 1000, keys };
  return keys;
}

function parseAdminEmails(value?: string): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function normalizeTeamDomain(value?: string): string | null {
  if (!value) return null;
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
}

function normalizeIssuer(value?: string): string {
  return (value ?? "").replace(/\/$/, "");
}

function decodeJson<T>(value: string): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}
