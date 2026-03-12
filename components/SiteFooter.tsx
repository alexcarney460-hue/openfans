import Link from "next/link";

const FOOTER_LINKS = {
  Platform: [
    { label: "About", href: "#" },
    { label: "Creators", href: "#creators" },
    { label: "Pricing", href: "#how-it-works" },
    { label: "Blog", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
  ],
  Community: [
    { label: "Twitter / X", href: "#" },
    { label: "Discord", href: "#" },
    { label: "Telegram", href: "#" },
    { label: "GitHub", href: "#" },
  ],
} as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="inline-block" aria-label="OpenFans home">
              <span className="gradient-text text-xl font-bold tracking-tight">
                OpenFans
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/50">
              The crypto-native creator platform. Own your content, own your
              money.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Powered by Solana
              </span>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/30">
                {heading}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-white/30">
            &copy; 2026 OpenFans. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* Social icon placeholders */}
            {["Twitter", "Discord", "GitHub"].map((platform) => (
              <a
                key={platform}
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
                aria-label={platform}
              >
                <span className="text-xs font-bold">
                  {platform.charAt(0)}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
