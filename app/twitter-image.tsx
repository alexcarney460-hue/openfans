import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OpenFans — Own Your Content, Own Your Money";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
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

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "60px 80px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 20,
                fontSize: 36,
                fontWeight: 800,
                color: "white",
              }}
            >
              OF
            </div>
            <span
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: "white",
                letterSpacing: "-1px",
              }}
            >
              OpenFans
            </span>
          </div>

          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "white",
              textAlign: "center",
              lineHeight: 1.15,
              maxWidth: 900,
              letterSpacing: "-1px",
            }}
          >
            The creator platform that pays more.
          </div>

          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.8)",
              textAlign: "center",
              marginTop: 24,
              maxWidth: 700,
              lineHeight: 1.5,
            }}
          >
            Keep 95% of your earnings. Get paid instantly in crypto. No restrictions.
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 40,
              background: "white",
              borderRadius: 50,
              padding: "16px 40px",
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#00AFF0",
              }}
            >
              openfans.online
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
