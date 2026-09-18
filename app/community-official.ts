export const OFFICIAL_COMMUNITY_USER_ID = "official:goldengames";
export const OFFICIAL_COMMUNITY_NAME = "Goldengames";

// This disabled system identity exists only to keep official replies in the
// existing community_comments relationship. It can never sign in.
export const OFFICIAL_COMMUNITY_USERNAME = "system:goldengames";
export const OFFICIAL_COMMUNITY_EMAIL = "community-official@internal.invalid";

export function isOfficialCommunityUser(userId: string): boolean {
  return userId === OFFICIAL_COMMUNITY_USER_ID;
}
