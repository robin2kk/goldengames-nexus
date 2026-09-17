import { env } from "cloudflare:workers";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { getAdminUser, isAdminConfigured } from "../cloudflare-access-auth";
import { Publisher, type AdminPost } from "./publisher";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getAdminUser();
  if (!user) {
    return <AdminShell><div className="admin-card access-card"><LockKeyhole size={30}/><h1>Private Admin Panel</h1><p>{isAdminConfigured() ? "Your authenticated account is not authorized to manage GoldenGames Nexus." : "Cloudflare Access must be configured before this area can be used in production."}</p><a className="primary-btn" href="/">Return to the website</a></div></AdminShell>;
  }
  if (!env.DB || !env.BUCKET) {
    return <AdminShell email={user.email}><div className="admin-card"><h2>Publishing is temporarily unavailable</h2><p>The content database or file bucket is not connected yet.</p></div></AdminShell>;
  }
  const result = await env.DB.prepare(
    `SELECT id, title, excerpt, body, platform, kind, status, featured,
      youtube_id AS youtubeId, image_name AS imageName,
      download_name AS downloadName, created_at AS createdAt, updated_at AS updatedAt
     FROM posts ORDER BY updated_at DESC LIMIT 100`,
  ).all<AdminPost>();
  return <AdminShell email={user.email}><Publisher posts={result.results}/></AdminShell>;
}
function AdminShell({children,email}:{children:React.ReactNode;email?:string}){return <main className="admin-page"><header className="admin-header"><a className="brand" href="/"><span className="brand-mark"><img src="/goldengames-logo.png" alt=""/></span><span><b>GOLDENGAMES</b><em>NEXUS v1.0</em></span></a><div><span><ShieldCheck size={15}/>{email||"Protected by Cloudflare Access"}</span><a href="/">View website</a></div></header>{children}</main>}
