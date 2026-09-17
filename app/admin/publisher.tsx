"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  FileUp,
  ImageUp,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";

export type AdminPost = {
  id: number;
  title: string;
  excerpt: string;
  body: string;
  platform: string;
  kind: string;
  status: string;
  featured: boolean | number;
  youtubeId: string | null;
  imageName: string | null;
  downloadName: string | null;
  createdAt: string;
  updatedAt: string;
};

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

export function Publisher({ posts }: { posts: AdminPost[] }) {
  const [selected, setSelected] = useState<AdminPost | null>(null);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ctx = document.modelContext;
    if (!ctx?.registerTool) return;
    const controller = new AbortController();
    Promise.resolve(ctx.registerTool({
      name: "start_article_creation",
      title: "Start article",
      description: "Open the GoldenGames Nexus publisher and focus the article title field.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: () => {
        startNew();
        return { status: "ready" };
      },
    }, { signal: controller.signal })).catch(() => {});
    return () => controller.abort();
  }, []);

  function startNew() {
    setSelected(null);
    setMessage("");
    requestAnimationFrame(() => {
      titleRef.current?.focus();
      titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("save");
    setMessage("");
    setIsError(false);
    const response = await fetch(selected ? `/api/admin/posts/${selected.id}` : "/api/admin/posts", {
      method: selected ? "PUT" : "POST",
      body: new FormData(event.currentTarget),
      headers: { "x-goldengames-admin": "v1" },
    });
    const data = await response.json().catch(() => ({ error: "The server returned an invalid response" })) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setIsError(true);
      setMessage(data.error || "The update could not be saved");
      return;
    }
    setMessage(selected ? "Changes saved successfully." : "Published successfully.");
    setTimeout(() => location.reload(), 650);
  }

  async function removePost() {
    if (!selected || !window.confirm(`Delete “${selected.title}”? This also removes its uploaded files.`)) return;
    setBusy("delete");
    setMessage("");
    setIsError(false);
    const response = await fetch(`/api/admin/posts/${selected.id}`, {
      method: "DELETE",
      headers: { "x-goldengames-admin": "v1" },
    });
    const data = await response.json().catch(() => ({ error: "The server returned an invalid response" })) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setIsError(true);
      setMessage(data.error || "The article could not be deleted");
      return;
    }
    setMessage("Article deleted.");
    setTimeout(() => location.reload(), 500);
  }

  function edit(post: AdminPost) {
    setSelected(post);
    setMessage("");
    requestAnimationFrame(() => window.scrollTo({ top: 70, behavior: "smooth" }));
  }

  return <div className="admin-workspace">
    <section>
      <div className="publisher-heading">
        <div><span className="eyebrow">GOLDENGAMES NEXUS v1.0</span><h1>{selected ? "Edit update" : "Create a new update"}</h1></div>
        {selected && <button className="secondary-btn" type="button" onClick={startNew}><Plus size={17}/> New article</button>}
      </div>
      <p>Publish news, images, YouTube videos and downloads without modifying the website code.</p>
      <form key={selected?.id ?? "new"} onSubmit={submit} className="publisher-form">
        <label>Headline<input ref={titleRef} name="title" required maxLength={140} defaultValue={selected?.title} placeholder="What happened?"/></label>
        <div className="field-row">
          <label>Platform<select name="platform" defaultValue={selected?.platform ?? "PS5"}><option>PS5</option><option>PS4</option><option>Xbox</option><option>Switch</option><option>Retro</option></select></label>
          <label>Content type<select name="kind" defaultValue={selected?.kind ?? "Scene News"}><option>Scene News</option><option>Homebrew</option><option>Release</option><option>Video</option><option>Guide</option><option>Opinion</option></select></label>
        </div>
        <label>Short summary<textarea name="excerpt" required maxLength={280} rows={3} defaultValue={selected?.excerpt} placeholder="A clear summary for the homepage"/></label>
        <label>Full article<textarea name="body" required rows={12} defaultValue={selected?.body} placeholder="Write the complete update here..."/></label>
        <label className="video-link-label"><span><Link2 size={17}/> YouTube video link (optional)</span><input name="youtubeUrl" type="url" defaultValue={selected?.youtubeId ? `https://www.youtube.com/watch?v=${selected.youtubeId}` : ""} placeholder="https://www.youtube.com/watch?v=..."/><small>YouTube, Shorts, Live and youtu.be links are accepted.</small></label>
        <div className="upload-grid">
          <label className="file-drop"><ImageUp size={25}/><b>Cover image</b><span>JPG, PNG, WebP or GIF — max 8 MB</span>{selected?.imageName && <small>Current: {selected.imageName}</small>}<input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif"/></label>
          <label className="file-drop"><FileUp size={25}/><b>Download file</b><span>Homebrew, archive or document — max 25 MB</span>{selected?.downloadName && <small>Current: {selected.downloadName}</small>}<input type="file" name="file"/></label>
        </div>
        {selected && (selected.imageName || selected.downloadName) && <div className="remove-assets">
          {selected.imageName && <label><input type="checkbox" name="removeImage" value="1"/> Remove current image</label>}
          {selected.downloadName && <label><input type="checkbox" name="removeDownload" value="1"/> Remove current download</label>}
        </div>}
        <div className="field-row">
          <label>Status<select name="status" defaultValue={selected?.status ?? "published"}><option value="published">Publish now</option><option value="draft">Save as draft</option></select></label>
          <label className="check-label"><input type="checkbox" name="featured" defaultChecked={Boolean(selected?.featured)}/> Feature this story</label>
        </div>
        <div className="form-actions">
          <button className="primary-btn submit-btn" disabled={Boolean(busy)}>{busy === "save" ? <Loader2 className="spin" size={18}/> : selected ? <Save size={18}/> : <Send size={18}/>} {busy === "save" ? "Saving..." : selected ? "Save changes" : "Publish update"}</button>
          {selected && <button className="danger-btn" type="button" disabled={Boolean(busy)} onClick={removePost}>{busy === "delete" ? <Loader2 className="spin" size={17}/> : <Trash2 size={17}/>} Delete</button>}
          {selected && <button className="secondary-btn" type="button" disabled={Boolean(busy)} onClick={startNew}><X size={17}/> Cancel</button>}
        </div>
        {message && <p className={`form-message ${isError ? "form-error" : ""}`}>{isError ? <X size={17}/> : <CheckCircle2 size={17}/>} {message}</p>}
      </form>
    </section>
    <aside className="recent-panel">
      <div className="recent-heading"><div><span className="eyebrow">CONTENT MANAGER</span><h2>Your newsroom</h2></div><button type="button" onClick={startNew} aria-label="Create a new article"><Plus size={18}/></button></div>
      {posts.length ? posts.map((post) => <button className={`post-row ${selected?.id === post.id ? "selected" : ""}`} key={post.id} type="button" onClick={() => edit(post)}>
        <span>{post.platform}</span><div><b>{post.title}</b><small>{post.status} • {new Date(post.updatedAt).toLocaleDateString()}</small><em>{post.imageName ? "Image" : ""}{post.imageName && post.downloadName ? " + " : ""}{post.downloadName ? "Download" : ""}</em></div><Pencil size={15}/>
      </button>) : <p className="muted-copy">Your published updates and drafts will appear here.</p>}
    </aside>
  </div>;
}
