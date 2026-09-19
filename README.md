# GoldenGames Nexus v1.0

Professional, responsive gaming-scene publication for PS5, PS4, Xbox, Nintendo Switch and retro gaming. The public site includes news, PS5 Jailbreak/Homebrew coverage, YouTube videos, searchable content, managed downloads, educational-use notices and reserved advertising placements.

## Architecture

- **Frontend and server:** Next.js 16 running through Vinext on Cloudflare Workers.
- **Database:** Cloudflare D1 for articles and publishing metadata.
- **Files:** Cloudflare R2 for cover images and downloadable files.
- **Authentication:** Cloudflare Access protects `/admin*` and `/api/admin/*`; the application also validates the Access JWT and an administrator email allowlist.
- **Source and deployment:** GitHub plus Cloudflare Workers Builds.
- **Initial address:** the free `goldengames-nexus.<account-subdomain>.workers.dev` URL. A custom domain can be connected later without changing the application.

Cloudflare recommends Workers rather than a static Pages export for dynamic Next.js applications. This project remains inside the same **Workers & Pages** dashboard while retaining server rendering, D1, R2 and the private Admin Panel.

## Admin Panel

The private `/admin` area supports:

- creating and immediately publishing an article or saving a draft;
- editing or deleting existing content;
- uploading, replacing and removing a cover image;
- attaching, replacing and removing a downloadable file;
- adding YouTube, Shorts, Live or `youtu.be` links;
- setting platform, content type and featured status.

No password, API token or private key belongs in this repository. Cloudflare Access handles sign-in, and production identity configuration stays in Cloudflare.

## Local development

Requirements: Node.js 22.13 or newer and pnpm 11.

1. Copy `.dev.vars.example` to `.dev.vars`.
2. Replace `DEV_ADMIN_EMAIL` with a local-only email.
3. Install dependencies with `pnpm install --frozen-lockfile`.
4. Apply local migrations with `pnpm db:migrate:local`.
5. Run `pnpm dev`.

The `.dev.vars` file is ignored by Git.

## First Cloudflare deployment

1. Create a D1 database named `goldengames-nexus-db`.
2. Replace the placeholder D1 `database_id` in `wrangler.jsonc`.
3. Create an R2 bucket named `goldengames-nexus-files`.
4. Apply the D1 migrations with `pnpm db:migrate:remote`.
5. Configure the three production variables listed below in Cloudflare.
6. Run `pnpm deploy`, or connect the GitHub repository to Workers Builds with build command `pnpm build` and deploy command `pnpm exec wrangler deploy`.

### Production identity variables

Configure these in Cloudflare, never in committed source:

| Variable | Purpose |
| --- | --- |
| `ADMIN_EMAILS` | Comma-separated emails allowed to publish. |
| `CF_ACCESS_TEAM_DOMAIN` | The Zero Trust team domain, for example `team.cloudflareaccess.com`. |
| `CF_ACCESS_AUD` | Audience tag of the Access application protecting the admin paths. |

Create Cloudflare Access self-hosted applications for both paths on every hostname that serves the application. For the custom domain, protect:

- `goldengamesnexus.com/admin*`
- `goldengamesnexus.com/api/admin/*`

If the free Workers hostname remains enabled, also protect:

- `goldengames-nexus.<account-subdomain>.workers.dev/admin*`
- `goldengames-nexus.<account-subdomain>.workers.dev/api/admin/*`

Use an Allow policy containing only the owner's email. Configure `ADMIN_EMAILS`, `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` on the `goldengames-nexus` Worker that serves the custom domain; variables on a separate admin-named Worker are not visible to this route. The public site, article images and published downloads must remain outside those protected paths.

## Security notes

- Admin requests require a valid Cloudflare Access JWT and the configured email allowlist.
- Write requests reject cross-origin submissions.
- Images are limited to JPG, PNG, WebP and GIF and to 8 MB.
- Downloads are limited to 25 MB; active web content such as HTML, SVG and JavaScript is rejected.
- Downloads are served as attachments with MIME sniffing disabled.
- Uploaded objects are removed from R2 when replaced or when an article is deleted.
- Public article queries only return records with `published` status.

## Content and advertising

Advertising placeholders are structural only; no ad network script or tracker is enabled in v1.0. Privacy, terms, about and editorial-policy pages are included for future monetization review. All jailbreak, homebrew, guides, videos and downloads are presented for educational and research purposes and must respect applicable laws, copyright and platform terms.
