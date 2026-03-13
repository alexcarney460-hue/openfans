import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "OpenFans — Own Your Content, Own Your Money";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public/logo.png"));
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #00AFF0 0%, #0077B6 50%, #005A8C 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -60,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />

        {/* Logo */}
        <img
          src={logoBase64}
          width={600}
          height={170}
          style={{ objectFit: "contain" }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            marginTop: 32,
            maxWidth: 800,
            lineHeight: 1.3,
          }}
        >
          The creator platform that pays more.
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
            marginTop: 16,
            maxWidth: 600,
          }}
        >
          Keep 95% of your earnings. Get paid instantly in crypto.
        </div>

        {/* CTA pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 32,
            background: "white",
            borderRadius: 50,
            padding: "12px 36px",
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#00AFF0",
            }}
          >
            openfans.online
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
