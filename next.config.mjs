import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qnomimlnkjutldxuxuqj.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/investment",
        destination: "/invest",
        permanent: true,
      },
      {
        source: "/investors",
        destination: "/invest",
        permanent: true,
      },
    ];
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    // Build CSP directives
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https://*.supabase.co https://lh3.googleusercontent.com blob:",
      "connect-src 'self' https://*.ingest.sentry.io https://*.supabase.co wss://*.supabase.co https://api.mainnet-beta.solana.com https://api.devnet.solana.com https://*.helius-rpc.com wss://*.helius-rpc.com https://*.phantom.app wss://*.phantom.app https://*.solflare.com wss://*.solflare.com https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://*.livekit.cloud wss://*.livekit.cloud",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "font-src 'self' https://fonts.gstatic.com",
    ];

    const csp = cspDirectives.join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableSourceMapUpload: true,
});
