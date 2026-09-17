export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="brand footer-brand">
        <span className="brand-mark"><img src="/goldengames-logo.png" alt="" /></span>
        <span><b>GOLDENGAMES</b><em>NEXUS v1.0</em></span>
      </div>
      <nav className="footer-links" aria-label="Website information">
        <a href="/about">About</a>
        <a href="/editorial-policy">Editorial Policy</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </nav>
      <p>Independent gaming-scene news and community resources.</p>
      <small>GoldenGames Nexus v1.0 • Educational and research purposes only. Use homebrew responsibly and respect applicable laws, copyrights and platform terms.</small>
    </footer>
  );
}
