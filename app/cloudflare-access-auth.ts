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

  const environment = getTextBinding(runtimeEnv, "ENVIRONMENT");
  const developmentEmail = getTextBinding(runtimeEnv, "DEV_ADMIN_EMAIL");

  if (environment === "development" && developmentEmail) {
    const email = developmentEmail.trim().toLowerCase();
    return { userId: `local:${email}`, email, displayName: email };
  }

  const token = requestHeaderList.get("cf-access-jwt-assertion");
  // The signed Access JWT is the only authoritative identity source. Do not
  // depend on convenience headers, which are not independently authenticated.
  const teamDomain = normalizeTeamDomain(getTextBinding(runtimeEnv, "CF_ACCESS_TEAM_DOMAIN"));
  const audience = getTextBinding(runtimeEnv, "CF_ACCESS_AUD")?.trim();

  if (!token || !teamDomain || !audience) return null;

  const payload = await verifyAccessToken(token, teamDomain, audience).catch(() => null);
  if (!payload) return null;

  const tokenEmail = payload.email?.trim().toLowerCase();
  if (!tokenEmail) return null;

  const allowlist = parseAdminEmails(getTextBinding(runtimeEnv, "ADMIN_EMAILS"));
  if (!allowlist.has(tokenEmail)) return null;

  return {
    userId: payload.sub || tokenEmail,
    email: tokenEmail,
    displayName: tokenEmail,
  };
}

export function isAdminConfigured(): boolean {
  const runtimeEnv = env as Cloudflare.Env;
  const environment = getTextBinding(runtimeEnv, "ENVIRONMENT");
  const developmentEmail = getTextBinding(runtimeEnv, "DEV_ADMIN_EMAIL");
  if (environment === "development" && developmentEmail) return true;
  return Boolean(
    getTextBinding(runtimeEnv, "CF_ACCESS_TEAM_DOMAIN") &&
      getTextBinding(runtimeEnv, "CF_ACCESS_AUD") &&
      parseAdminEmails(getTextBinding(runtimeEnv, "ADMIN_EMAILS")).size,
  );
}

function getTextBinding(runtimeEnv: Cloudflare.Env, name: keyof Cloudflare.Env): string | undefined {
  const binding = runtimeEnv[name];
  if (typeof binding === "string" && binding.trim()) return binding;

  // Cloudflare's Node.js compatibility layer also exposes text variables and
  // secrets through process.env. This fallback covers RSC builds where the
  // dashboard binding is not present on the imported env proxy.
  const nodeValue = process.env[name];
  return typeof nodeValue === "string" && nodeValue.trim() ? nodeValue : undefined;
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
