import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import SolanaProvider from "@/components/SolanaProvider";
import { LanguageProvider } from "@/utils/i18n/context";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#00AFF0",
};

export const metadata: Metadata = {
  title: "OpenFans — Own Your Content, Own Your Money",
  description:
    "The creator platform that pays more. Keep 95% of your earnings, get paid instantly in crypto. No restrictions. No gatekeepers.",
  metadataBase: new URL("https://openfans.online"),
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OpenFans",
  },
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
    "mobile-web-app-capable": "yes",
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
        <LanguageProvider>
          <SolanaProvider>{children}</SolanaProvider>
          <PWAInstallPrompt />
          <ServiceWorkerRegistration />
        </LanguageProvider>
      </body>
    </html>
  );
}
