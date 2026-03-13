import Link from "next/link";

const FOOTER_SECTIONS = [
  {
    title: "Platform",
    links: [
      { label: "Home", href: "/" },
      { label: "Explore", href: "/explore" },
      { label: "Pricing", href: "/pricing" },
      { label: "Help", href: "/help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "DMCA", href: "/dmca" },
      { label: "USC 2257", href: "/usc2257" },
    ],
  },
  {
    title: "Compliance",
    links: [
      { label: "Anti-Slavery Statement", href: "/anti-slavery" },
      { label: "Complaints", href: "/complaints" },
      { label: "Acceptable Use", href: "/acceptable-use" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "Contact Us", href: "/contact" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-gray-400 transition-colors hover:text-gray-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3 border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-400">
            &copy; 2026 OpenFans
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-400">
            <span className="inline-block h-1 w-1 rounded-full bg-emerald-500/60" />
            Solana
          </span>
        </div>
      </div>
    </footer>
  );
}
