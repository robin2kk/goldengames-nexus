import { env } from "cloudflare:workers";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { cookies, headers } from "next/headers";

export type AdminUser = {
  userId: string;
  email: string;
  displayName: string;
};

type AccessPayload = JWTPayload & { email?: string };

const accessKeySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function getAdminUser(requestHeaders?: Headers): Promise<AdminUser | null> {
  const runtimeEnv = env as Cloudflare.Env;
  const requestHeaderList = requestHeaders ?? (await headers());

  const environment = getTextBinding(runtimeEnv, "ENVIRONMENT");
  const developmentEmail = getTextBinding(runtimeEnv, "DEV_ADMIN_EMAIL");

  if (environment === "development" && developmentEmail) {
    const email = developmentEmail.trim().toLowerCase();
    return { userId: `local:${email}`, email, displayName: email };
  }

  const token =
    requestHeaderList.get("cf-access-jwt-assertion") ??
    getCookieValue(requestHeaderList.get("cookie"), "CF_Authorization") ??
    (requestHeaders ? null : (await cookies()).get("CF_Authorization")?.value);
  // The signed Access JWT is the only authoritative identity source. Do not
  // depend on convenience headers, which are not independently authenticated.
  const teamDomain = normalizeTeamDomain(getTextBinding(runtimeEnv, "CF_ACCESS_TEAM_DOMAIN"));
  const audience = getTextBinding(runtimeEnv, "CF_ACCESS_AUD")?.trim();

  if (!token || !teamDomain || !audience) return null;

  const payload = await verifyAccessToken(token, teamDomain, audience).catch((error) => {
    // Keep authentication failures useful in Worker logs without exposing the
    // JWT, email address, or other identity data to the public response.
    console.warn(
      "Cloudflare Access JWT validation failed",
      error instanceof Error ? error.code ?? error.name : "unknown_error",
    );
    return null;
  });
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
  let keySet = accessKeySets.get(teamDomain);
  if (!keySet) {
    keySet = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
    accessKeySets.set(teamDomain, keySet);
  }

  const { payload } = await jwtVerify(token, keySet, {
    algorithms: ["RS256"],
    issuer: teamDomain,
    audience,
    clockTolerance: 30,
  });
  return payload as AccessPayload;
}

function parseAdminEmails(value?: string): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    return value || null;
  }
  return null;
}

function normalizeTeamDomain(value?: string): string | null {
  if (!value) return null;
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
}
