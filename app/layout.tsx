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
  title: "OpenFans -- Own Your Content, Own Your Money",
  description:
    "The crypto-native creator platform. Accept subscriptions in USDC/SOL. No payment processors. No gatekeepers.",
  openGraph: {
    title: "OpenFans -- Own Your Content, Own Your Money",
    description:
      "The crypto-native creator platform. Accept subscriptions in USDC/SOL. No payment processors. No gatekeepers.",
    siteName: "OpenFans",
    type: "website",
    url: "https://openfans.online",
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
