import type { Metadata } from "next";
import { PolicyPage } from "../policy-page";

export const metadata: Metadata = {
  title: "About | GoldenGames Nexus",
  description: "Learn about GoldenGames Nexus and its independent coverage of the gaming and homebrew community.",
};

export default function AboutPage() {
  return (
    <PolicyPage eyebrow="ABOUT GOLDENGAMES" title="Independent coverage for curious players." intro="GoldenGames Nexus follows the console scene with a focus on clear explanations, responsible experimentation and practical information.">
      <section><h2>What we cover</h2><p>Our coverage includes PS6, PS5, PS4, PS3, Xbox, Nintendo Switch and retro gaming, with breaking news about homebrew applications, scene developments, preservation projects, compatibility updates and community tools.</p></section>
      <section><h2>Our purpose</h2><p>We help readers understand what a release does, who created it, what systems it supports and what risks or limitations should be considered before use. The goal is useful context—not hype, piracy or misleading promises.</p></section>
      <section><h2>Independence</h2><p>GoldenGames Nexus is an independent publication. Console manufacturers and platform owners do not sponsor, operate or endorse this website.</p></section>
      <section><h2>Educational use</h2><p>All news, guides, files and videos are provided for educational and research purposes. Readers are responsible for following applicable laws, copyright rules and platform terms.</p></section>
    </PolicyPage>
  );
}
