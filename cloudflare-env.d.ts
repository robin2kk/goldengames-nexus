declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ENVIRONMENT?: string;
    DEV_ADMIN_EMAIL?: string;
    ADMIN_EMAILS?: string;
    CF_ACCESS_TEAM_DOMAIN?: string;
    CF_ACCESS_AUD?: string;
  }
}
