import { ArrowLeft, MessageCircle } from "lucide-react";
import type { CommunityUser } from "../community-auth";
import { LogoutButton } from "./community-actions";

export function CommunityHeader({user}:{user:CommunityUser|null}){return <header className="community-header"><a className="brand" href="/"><span className="brand-mark"><img src="/goldengames-logo.png" alt=""/></span><span><b>GOLDENGAMES</b><em>NEXUS v1.0</em></span></a><nav><a href="/"><ArrowLeft size={15}/> News</a><a href="/community"><MessageCircle size={15}/> Community</a>{user?<><span>@{user.username}</span><LogoutButton/></>:<><a href="/community/login">Sign in</a><a className="community-signup" href="/community/register">Join</a></>}</nav></header>}
