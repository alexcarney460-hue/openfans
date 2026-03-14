import { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

export const metadata: Metadata = {
  title: "OpenFans — Own Your Content, Own Your Money",
  description:
    "The creator platform that pays more. Keep 95% of your earnings, get paid instantly in crypto. No restrictions. No gatekeepers.",
  openGraph: {
    title: "OpenFans — The Creator Platform That Pays More",
    description:
      "Keep 95% of your earnings. Get paid instantly in crypto. No restrictions. Join 10,000+ creators on OpenFans.",
    siteName: "OpenFans",
    type: "website",
    url: "https://openfans.online",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenFans — The Creator Platform That Pays More",
    description:
      "Keep 95% of your earnings. Get paid instantly in crypto. No restrictions. Join 10,000+ creators.",
  },
};

export default function HomePage() {
  return <LandingPageClient />;
}
