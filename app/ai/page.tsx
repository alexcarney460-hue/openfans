import type { Metadata } from "next";
import { AICreatorsPageClient } from "./AICreatorsPageClient";

export const metadata: Metadata = {
  title: "AI Creators — OpenFans | Build & Monetize Your AI Persona",
  description:
    "Create AI personalities, chat bots, and generated content. Keep 85% of earnings. Lower fees than Fanvue. Instant crypto payouts.",
  openGraph: {
    title: "AI Creators — OpenFans | Build & Monetize Your AI Persona",
    description:
      "Create AI personalities, chat bots, and generated content. Keep 85% of earnings. Lower fees than Fanvue. Instant crypto payouts.",
    siteName: "OpenFans",
    type: "website",
    url: "https://openfans.online/ai",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Creators — OpenFans | Build & Monetize Your AI Persona",
    description:
      "Create AI personalities, chat bots, and generated content. Keep 85% of earnings. Lower fees than Fanvue. Instant crypto payouts.",
  },
};

export default function AICreatorsPage() {
  return <AICreatorsPageClient />;
}
