"use client";

import { useState } from "react";
import { Check, Loader2, MessageCircleReply, Send, Trash2, X } from "lucide-react";

export type ModerationItem = {
  id: number;
  itemType: "posts" | "comments";
  title: string | null;
  body: string;
  platform: string | null;
  kind: string | null;
  username: string;
  email: string;
  createdAt: string;
  parentTitle: string | null;
};

export type PublishedPost = {
  id: number;
  title: string;
  platform: string;
  username: string;
  createdAt: string;
  replyCount: number;
};

export function ModerationQueue({
  items,
  publishedPosts,
}: {
  items: ModerationItem[];
  publishedPosts: PublishedPost[];
}) {
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  async function act(item: ModerationItem, action: "approved" | "rejected" | "delete") {
    const key = `${item.itemType}-${item.id}-${action}`;
    setBusy(key);
    setMessage("");
    const response = await fetch(`/api/admin/community/${item.itemType}/${item.id}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: { "content-type": "application/json", "x-goldengames-admin": "v1" },
      body: action === "delete" ? undefined : JSON.stringify({ status: action }),
    });
    setBusy("");
    if (!response.ok) {
      setMessage("Moderation action failed.");
      return;
    }
    location.reload();
  }

  return <section className="moderation-queue">
    <div className="moderation-heading">
      <span className="eyebrow">COMMUNITY MODERATION</span>
      <h1>Pending review</h1>
      <p>Approve only respectful, relevant questions and replies. Member emails remain private.</p>
    </div>
    {message && <p className="community-error">{message}</p>}
    {items.length ? items.map((item) => <article className="moderation-card" key={`${item.itemType}-${item.id}`}>
      <div className="moderation-meta">
        <b>{item.itemType === "posts" ? "POST" : "REPLY"}</b>
        {item.platform && <span>{item.platform}</span>}
        {item.kind && <span>{item.kind}</span>}
        <time>{new Date(item.createdAt).toLocaleString()}</time>
      </div>
      {item.parentTitle && <small>Reply to: {item.parentTitle}</small>}
      {item.title && <h2>{item.title}</h2>}
      <p>{item.body}</p>
      <div className="moderation-member"><b>@{item.username}</b><span>{item.email}</span></div>
      <div className="moderation-actions">
        <button className="approve-btn" disabled={Boolean(busy)} onClick={() => act(item, "approved")}>
          {busy === `${item.itemType}-${item.id}-approved` ? <Loader2 className="spin" size={16}/> : <Check size={16}/>} Approve
        </button>
        <button disabled={Boolean(busy)} onClick={() => act(item, "rejected")}><X size={16}/> Reject</button>
        <button className="danger-btn" disabled={Boolean(busy)} onClick={() => act(item, "delete")}><Trash2 size={16}/> Delete</button>
      </div>
    </article>) : <div className="community-empty"><Check size={30}/><h3>Moderation queue is clear</h3><p>New community posts and replies will appear here.</p></div>}

    <div className="moderation-heading published-heading">
      <span className="eyebrow">OFFICIAL RESPONSES</span>
      <h2>Published conversations</h2>
      <p>Reply as @Goldengames. Official replies publish immediately.</p>
    </div>
    {publishedPosts.length ? publishedPosts.map((post) => <article className="moderation-card published-post" key={post.id}>
      <div className="moderation-meta">
        <b>{post.platform}</b><span>@{post.username}</span>
        <span>{post.replyCount} {post.replyCount === 1 ? "reply" : "replies"}</span>
        <time>{new Date(post.createdAt).toLocaleString()}</time>
      </div>
      <h2>{post.title}</h2>
      <div className="moderation-actions">
        <button className="official-reply-btn" onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}>
          <MessageCircleReply size={16}/> Reply
        </button>
        <a className="view-thread-link" href={`/community/${post.id}`} target="_blank" rel="noreferrer">View conversation</a>
      </div>
      {replyingTo === post.id && <AdminReplyForm postId={post.id} onCancel={() => setReplyingTo(null)}/>}
    </article>) : <div className="community-empty"><MessageCircleReply size={30}/><h3>No published conversations</h3><p>Approve a community post before sending an official reply.</p></div>}
  </section>;
}

function AdminReplyForm({ postId, onCancel }: { postId: number; onCancel: () => void }) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const response = await fetch(`/api/admin/community/posts/${postId}/reply`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goldengames-admin": "v1" },
      body: JSON.stringify({ body }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      setSubmitting(false);
      setError(result.error || "The official reply could not be published.");
      return;
    }
    location.reload();
  }

  return <form className="admin-reply-form" onSubmit={submit}>
    <label htmlFor={`admin-reply-${postId}`}>Reply publicly as <b>@Goldengames</b> <span className="official-badge">OFFICIAL</span></label>
    <textarea
      id={`admin-reply-${postId}`}
      value={body}
      onChange={(event) => setBody(event.target.value)}
      minLength={2}
      maxLength={3000}
      rows={5}
      required
      placeholder="Write the official response..."
    />
    {error && <p className="community-error">{error}</p>}
    <div>
      <button className="approve-btn" disabled={submitting || body.trim().length < 2} type="submit">
        {submitting ? <Loader2 className="spin" size={16}/> : <Send size={16}/>} Publish reply
      </button>
      <button disabled={submitting} type="button" onClick={onCancel}>Cancel</button>
    </div>
  </form>;
}
