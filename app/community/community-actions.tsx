"use client";

import { useState } from "react";
import { LogIn, LogOut, MessageSquarePlus, Send, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { resetTurnstile, Turnstile } from "../turnstile";

export function AuthForm({ mode, turnstileSiteKey }: { mode: "login" | "register"; turnstileSiteKey?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const body = mode === "register"
      ? { username: form.get("username"), email: form.get("email"), password: form.get("password"), turnstileToken }
      : { identity: form.get("identity"), password: form.get("password"), turnstileToken };
    const response = await fetch(`/api/community/${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) { setError(data.error || "The request could not be completed"); setBusy(false); setTurnstileToken(""); resetTurnstile(); return; }
    router.push("/community");
    router.refresh();
  }
  return <form className="community-form" onSubmit={submit}>
    {mode === "register" && <><label>Username<input name="username" required minLength={3} maxLength={24} autoComplete="username" placeholder="GoldenPlayer"/></label><label>Email<input name="email" type="email" required autoComplete="email" placeholder="you@example.com"/></label></>}
    {mode === "login" && <label>Username or email<input name="identity" required autoComplete="username"/></label>}
    <label>Password<input name="password" type="password" required minLength={10} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"}/></label>
    <Turnstile siteKey={turnstileSiteKey} action={mode === "login" ? "community_login" : "community_register"} onToken={setTurnstileToken}/>
    <button className="primary-btn" disabled={busy || (Boolean(turnstileSiteKey) && !turnstileToken)}>{mode === "login" ? <LogIn size={17}/> : <UserPlus size={17}/>} {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
    {error && <p className="community-error">{error}</p>}
  </form>;
}

export function LogoutButton() {
  const router=useRouter();async function logout(){await fetch("/api/community/logout",{method:"POST"});router.push("/community");router.refresh()}
  return <button className="community-text-btn" onClick={logout}><LogOut size={15}/> Sign out</button>;
}

export function NewPostForm() {
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage("");setError(false);const form=new FormData(event.currentTarget);const response=await fetch("/api/community/posts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(form))});const data=await response.json().catch(()=>({})) as {error?:string};setBusy(false);if(!response.ok){setError(true);setMessage(data.error||"Post could not be submitted");return}setMessage("Submitted for review. It will appear after an administrator approves it.");event.currentTarget.reset()}
  return <form className="community-form" onSubmit={submit}>
    <label>Title<input name="title" required minLength={6} maxLength={120} placeholder="What would you like to ask or discuss?"/></label>
    <div className="community-field-row"><label>Platform<select name="platform" defaultValue="PS5"><option>PS5</option><option>PS4</option><option>Xbox</option><option>Switch</option><option>Retro</option><option>General</option></select></label><label>Post type<select name="kind"><option>Question</option><option>Discussion</option></select></label></div>
    <label>Details<textarea name="body" required minLength={20} maxLength={5000} rows={10} placeholder="Include enough information for the community to understand your post."/></label>
    <button className="primary-btn" disabled={busy}><MessageSquarePlus size={17}/> {busy?"Submitting...":"Submit for review"}</button>
    {message&&<p className={error?"community-error":"community-success"}>{message}</p>}
  </form>;
}

export function ReplyForm({postId}:{postId:number}){
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage("");const form=new FormData(event.currentTarget);const response=await fetch(`/api/community/posts/${postId}/comments`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({body:form.get("body")})});const data=await response.json().catch(()=>({})) as {error?:string};setBusy(false);if(!response.ok){setMessage(data.error||"Reply could not be submitted");return}setMessage("Reply submitted for review.");event.currentTarget.reset()}
  return <form className="reply-form" onSubmit={submit}><textarea name="body" required minLength={2} maxLength={3000} rows={4} placeholder="Write your reply..."/><button className="primary-btn" disabled={busy}><Send size={16}/> {busy?"Submitting...":"Submit reply"}</button>{message&&<p>{message}</p>}</form>
}
