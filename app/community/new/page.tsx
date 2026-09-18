import { redirect } from "next/navigation";
import { getCommunityUser } from "../../community-auth";
import { NewPostForm } from "../community-actions";
import { CommunityHeader } from "../community-header";
export const dynamic="force-dynamic";
export default async function NewPost(){const user=await getCommunityUser();if(!user)redirect("/community/login");return <main className="community-page"><CommunityHeader user={user}/><section className="community-editor"><span className="eyebrow">NEW COMMUNITY POST</span><h1>Start a conversation.</h1><p>Questions and discussions are reviewed before they become public.</p><NewPostForm/></section></main>}
