import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoldenGames Nexus | Gaming Scene News & Homebrew",
  description: "Jailbreak scene news, homebrew releases and trusted downloads for PS6, PS5, PS4, PS3, Xbox, Nintendo Switch and retro systems.",
  icons: {
    icon: "/goldengames-logo.png",
    shortcut: "/goldengames-logo.png",
    apple: "/goldengames-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <aside className="education-notice" role="note">
          <b>Educational use only.</b> All news, guides, files and videos on this website are provided strictly for educational and research purposes. We do not promote piracy or copyright infringement.
        </aside>
        {children}
      </body>
    </html>
  );
}
