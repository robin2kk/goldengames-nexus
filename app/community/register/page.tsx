import { redirect } from "next/navigation";
import { getCommunityUser } from "../../community-auth";
import { AuthForm } from "../community-actions";
import { CommunityHeader } from "../community-header";
import { env } from "cloudflare:workers";
export const dynamic="force-dynamic";
export default async function Register(){const user=await getCommunityUser();if(user)redirect("/community");return <main className="community-page"><CommunityHeader user={null}/><section className="community-auth"><span className="eyebrow">JOIN THE COMMUNITY</span><h1>Create your account.</h1><p>Your email remains private. Posts and replies are reviewed before publication.</p><AuthForm mode="register" turnstileSiteKey={(env as Cloudflare.Env).TURNSTILE_SITE_KEY}/><small>Already registered? <a href="/community/login">Sign in</a></small></section></main>}
