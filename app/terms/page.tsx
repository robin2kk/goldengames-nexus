import type { Metadata } from "next";
import { PolicyPage } from "../policy-page";

export const metadata: Metadata = {
  title: "Terms of Use | GoldenGames Nexus",
  description: "Terms governing use of GoldenGames Nexus articles, files and community resources.",
};

export default function TermsPage() {
  return (
    <PolicyPage eyebrow="TERMS OF USE" title="Use the information responsibly." intro="By using GoldenGames Nexus, you agree to use its news, guides, videos and files lawfully and at your own discretion.">
      <section><h2>Educational information</h2><p>Content is provided for news, education, research and preservation-related discussion. Nothing on this website is legal advice or a guarantee that a tool will work on a particular device or firmware.</p></section>
      <section><h2>No piracy or infringement</h2><p>You may not use this website to infringe copyrights, bypass lawful access controls for unauthorized purposes, distribute pirated material or violate applicable laws and platform terms.</p></section>
      <section><h2>Downloads and device risk</h2><p>Homebrew and experimental software can cause data loss, instability, account restrictions or device problems. Review compatibility information, maintain backups and verify files before use. You accept responsibility for your own device and data.</p></section>
      <section><h2>Third-party projects and links</h2><p>Developer projects, videos and external websites remain under their respective owners&apos; control and terms. A link or report does not imply endorsement, sponsorship or a guarantee of availability or safety.</p></section>
      <section><h2>Intellectual property</h2><p>GoldenGames Nexus branding and original editorial material may not be republished as another publication&apos;s work. Product names, trademarks and third-party materials belong to their respective owners.</p></section>
      <section><h2>Availability</h2><p>We may update, remove or correct content and downloads without notice when information changes, a security concern is identified or a rights holder raises a valid issue.</p></section>
    </PolicyPage>
  );
}
