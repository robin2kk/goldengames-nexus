import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "./site-footer";

type PolicyPageProps = { eyebrow: string; title: string; intro: string; children: ReactNode };

export function PolicyPage({ eyebrow, title, intro, children }: PolicyPageProps) {
  return (
    <main className="policy-page">
      <header className="sub-header">
        <a className="brand" href="/" aria-label="GoldenGames Nexus home">
          <span className="brand-mark"><img src="/goldengames-logo.png" alt="" /></span>
          <span><b>GOLDENGAMES</b><em>NEXUS v1.0</em></span>
        </a>
        <a href="/"><ArrowLeft size={17} /> Back to news</a>
      </header>
      <article className="policy-content">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="policy-intro">{intro}</p>
        <div className="policy-sections">{children}</div>
        <p className="policy-updated">Last updated: September 17, 2026</p>
      </article>
      <SiteFooter />
    </main>
  );
}
