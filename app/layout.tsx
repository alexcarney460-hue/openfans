import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import SolanaProvider from "@/components/SolanaProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "OpenFans — Own Your Content, Own Your Money",
  description:
    "The creator platform that pays more. Keep 95% of your earnings, get paid instantly in crypto. No restrictions. No gatekeepers.",
  metadataBase: new URL("https://openfans.online"),
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
  other: {
    "apple-mobile-web-app-title": "OpenFans",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}
      >
        <SolanaProvider>{children}</SolanaProvider>
      </body>
    </html>
  );
}
