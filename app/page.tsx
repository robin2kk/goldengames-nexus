import { env } from "cloudflare:workers";
import { ArrowUpRight, Download, MessageCircle, Play, Sparkles, Zap } from "lucide-react";
import { HomeFeed, type FeedPost } from "./home-feed";
import { HeaderSearch } from "./header-search";
import { AdSlot } from "./ad-slot";
import { SiteFooter } from "./site-footer";

export const dynamic = "force-dynamic";

const demoPosts: FeedPost[] = [
  { id: 1, title: "The homebrew scene never stops moving", excerpt: "Clear, verified coverage of tools, payloads and community releases — without the rumor fog.", platform: "PS5", kind: "Scene News", createdAt: "Today", featured: true, downloadName: null, imageName: null },
  { id: 2, title: "New homebrew releases and essential updates", excerpt: "Track version changes, compatibility notes and developer links from one place.", platform: "PS4", kind: "Homebrew", createdAt: "Latest", featured: false, downloadName: null, imageName: null },
  { id: 3, title: "Retro corner: classics meet modern hardware", excerpt: "Emulators, frontends, preservation projects and practical setup guides.", platform: "Retro", kind: "Guide", createdAt: "Weekly", featured: false, downloadName: null, imageName: null },
];

async function loadPosts(): Promise<FeedPost[]> {
  try {
    if (!env.DB) return demoPosts;
    const result = await env.DB.prepare(`SELECT id, title, excerpt, platform, kind, created_at AS createdAt, featured, download_name AS downloadName, image_name AS imageName FROM posts WHERE status = ? ORDER BY featured DESC, created_at DESC LIMIT 30`).bind("published").all<FeedPost>();
    return result.results.length ? result.results : demoPosts;
  } catch { return demoPosts; }
}

type VideoPost = { id:number; title:string; excerpt:string; platform:string; youtubeId:string };
async function loadVideos(): Promise<VideoPost[]> {
  try {
    if (!env.DB) return [];
    const result = await env.DB.prepare(`SELECT id, title, excerpt, platform, youtube_id AS youtubeId FROM posts WHERE status = ? AND youtube_id IS NOT NULL ORDER BY created_at DESC LIMIT 6`).bind("published").all<VideoPost>();
    return result.results;
  } catch { return []; }
}

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const posts = await loadPosts();
  const videos = await loadVideos();
  const { q = "" } = await searchParams;
  return <main className="min-h-screen">
    <header className="site-header">
      <a className="brand" href="/" aria-label="GoldenGames Nexus home"><span className="brand-mark"><img src="/goldengames-logo.png" alt=""/></span><span><b>GOLDENGAMES</b><em>NEXUS v1.0</em></span></a>
      <nav aria-label="Primary navigation"><a href="#latest">News</a><a href="#videos">Videos</a><a href="#downloads">Downloads</a><a href="#platforms">Platforms</a><a className="community-nav" href="/community"><MessageCircle size={15}/> Community</a></nav>
      <HeaderSearch initialQuery={q}/>
    </header>
    <section className="ticker" aria-label="Breaking updates"><Zap size={14}/><b>LIVE FEED</b><span>PS5 • PS4 • PS3 • XBOX • SWITCH • RETRO</span><span className="ticker-rule"/></section>
    <HomeFeed initialPosts={posts} initialQuery={q}/>
    <AdSlot placement="home-leaderboard" />
    <section className="hero homepage-intro" aria-labelledby="homepage-intro-title">
      <div className="hero-copy"><span className="eyebrow"><Sparkles size={15}/> INDEPENDENT GAMING SCENE</span><h1 id="homepage-intro-title">Everything happening<br/>beyond the <i>start screen.</i></h1><p>Jailbreak developments, homebrew releases, trusted downloads and retro discoveries — reported clearly for players who like to explore.</p><div className="hero-actions"><a className="primary-btn" href="#latest">Explore latest <ArrowUpRight size={18}/></a><a className="text-link" href="#downloads"><Download size={17}/> Browse downloads</a></div></div>
      <div className="hero-art" aria-label="Gaming platforms"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="console-card main-console"><span>PS5</span><small>SCENE INTEL</small></div><div className="console-card mini-card c1">PS4</div><div className="console-card mini-card c2">XBOX</div><div className="console-card mini-card c3">SWITCH</div><div className="console-card mini-card c4">16-BIT</div></div>
    </section>
    <section className="video-section" id="videos"><div className="section-heading"><div><span className="eyebrow"><Play size={14}/> GOLDENGAMES VIDEOS</span><h2>Watch the latest coverage</h2></div></div>{videos.length?<div className="video-grid">{videos.map(v=><article key={v.id} className="video-card"><div className="video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`} title={v.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/></div><div><span>{v.platform}</span><h3>{v.title}</h3><p>{v.excerpt}</p><a href={`/news/${v.id}`}>Read the full story <ArrowUpRight size={16}/></a></div></article>)}</div>:<div className="video-empty"><Play size={28}/><div><b>Your videos will appear here</b><span>Add a YouTube link when publishing a new update.</span></div></div>}</section>
    <AdSlot placement="home-footer" />
    <SiteFooter />
  </main>;
}
