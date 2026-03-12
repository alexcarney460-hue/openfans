import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Contact", href: "/contact" },
  { label: "Help", href: "/help" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <p className="text-xs text-white/30">
            &copy; 2026 OpenFans
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-medium text-white/25">
            <span className="inline-block h-1 w-1 rounded-full bg-emerald-500/60" />
            Solana
          </span>
        </div>
        <nav className="flex items-center gap-5" aria-label="Footer navigation">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs text-white/30 transition-colors hover:text-white/60"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
