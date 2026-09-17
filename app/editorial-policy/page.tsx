import type { Metadata } from "next";
import { PolicyPage } from "../policy-page";

export const metadata: Metadata = {
  title: "Editorial Policy | GoldenGames Nexus",
  description: "How GoldenGames Nexus verifies, writes and corrects gaming-scene coverage.",
};

export default function EditorialPolicyPage() {
  return (
    <PolicyPage eyebrow="EDITORIAL STANDARDS" title="Clear sources. Original context. Honest corrections." intro="Our editorial policy explains how GoldenGames Nexus separates confirmed information from testing, rumor and opinion.">
      <section><h2>Original reporting and analysis</h2><p>Articles must add original explanation, testing context, compatibility notes or informed commentary. External reports and embedded videos are not republished as substitutes for original coverage.</p></section>
      <section><h2>Sources and attribution</h2><p>We credit developers, researchers and original publishers whenever their work is discussed. Claims that cannot be independently confirmed are identified as unverified, experimental or based on community reports.</p></section>
      <section><h2>Testing limits</h2><p>Compatibility statements describe the hardware and firmware actually tested. A successful result on one console or firmware is not presented as proof that every version will work.</p></section>
      <section><h2>Corrections</h2><p>Material errors are corrected promptly and transparently. Headlines, compatibility details and download notes may be updated when developers publish new information.</p></section>
      <section><h2>Advertising separation</h2><p>Advertising is visually identified and kept separate from navigation, editorial recommendations and download controls. Advertisers do not receive approval over editorial conclusions.</p></section>
    </PolicyPage>
  );
}
