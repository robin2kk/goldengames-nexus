import { redirect } from "next/navigation";
import { getCommunityUser } from "../../community-auth";
import { AuthForm } from "../community-actions";
import { CommunityHeader } from "../community-header";
export const dynamic="force-dynamic";
export default async function Login(){const user=await getCommunityUser();if(user)redirect("/community");return <main className="community-page"><CommunityHeader user={null}/><section className="community-auth"><span className="eyebrow">MEMBER ACCESS</span><h1>Welcome back.</h1><p>Sign in to ask questions, create posts and join conversations.</p><AuthForm mode="login"/><small>New here? <a href="/community/register">Create an account</a></small></section></main>}
