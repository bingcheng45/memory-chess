import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function LearnOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0A",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "64px 72px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          <span>Memory&nbsp;</span>
          <span style={{ color: "#FFB380" }}>Chess</span>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", maxWidth: 940 }}
        >
          <div
            style={{
              color: "#FFC299",
              display: "flex",
              fontFamily: "monospace",
              fontSize: 20,
              letterSpacing: "0.22em",
              marginBottom: 24,
              textTransform: "uppercase",
            }}
          >
            Learn with Memory Chess
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
            }}
          >
            Learn chess one clear step at a time
          </div>
          <div
            style={{
              color: "#BBBBBB",
              display: "flex",
              fontSize: 28,
              lineHeight: 1.45,
              marginTop: 28,
            }}
          >
            Beginner guides for board vision, memory, visualization, and fewer
            blunders.
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.12)",
            color: "#BBBBBB",
            display: "flex",
            fontSize: 22,
            justifyContent: "space-between",
            paddingTop: 24,
          }}
        >
          <span>16 practical guides</span>
          <span>thememorychess.com/learn</span>
        </div>
      </div>
    ),
    size,
  );
}
