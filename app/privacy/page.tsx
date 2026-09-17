import type { Metadata } from "next";
import { PolicyPage } from "../policy-page";

export const metadata: Metadata = {
  title: "Privacy Policy | GoldenGames Nexus",
  description: "Privacy information for visitors to GoldenGames Nexus.",
};

export default function PrivacyPage() {
  return (
    <PolicyPage eyebrow="PRIVACY" title="How visitor information is handled." intro="GoldenGames Nexus is designed to collect as little personal information as reasonably possible while operating a secure publishing website.">
      <section><h2>Information processed automatically</h2><p>Like most websites, our hosting provider may process technical information such as IP address, browser type, device information, requested pages, timestamps and security logs. This information supports delivery, reliability, abuse prevention and troubleshooting.</p></section>
      <section><h2>Searches and downloads</h2><p>Search terms may appear in the page address when you use site search. Download requests may be recorded in standard server logs. We do not ask public visitors to create an account to read articles or access public downloads.</p></section>
      <section><h2>Embedded media</h2><p>Videos are embedded using YouTube&apos;s privacy-enhanced domain when available. Playing an embedded video may allow YouTube or Google to process device information and set cookies according to their own policies.</p></section>
      <section><h2>Advertising and cookies</h2><p>If advertising is activated, third-party vendors including Google may use cookies or similar technologies to serve, measure and personalize ads. Where legally required, visitors will be offered consent choices before personalized advertising technologies are used.</p></section>
      <section><h2>Your choices</h2><p>You can control cookies through your browser and review Google&apos;s advertising controls. Blocking some technologies may affect embedded media or advertising, but the core news content should remain accessible.</p></section>
      <section><h2>Policy changes</h2><p>This policy may be updated when the website adds a new service, advertising partner or privacy control. The date shown on this page identifies the latest revision.</p></section>
    </PolicyPage>
  );
}
