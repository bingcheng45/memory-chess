import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// A PNG rendering of the existing Memory Chess favicon. Keeping it inline makes
// the social image self-contained when Next.js renders it at the edge.
const logo =
  "data:image/png;base64,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";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={logo}
          alt=""
          width="192"
          height="192"
          style={{ objectFit: "contain" }}
        />
        <div
          style={{
            display: "flex",
            marginTop: "34px",
            fontSize: "64px",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "#1d1c20",
          }}
        >
          Memory&nbsp;<span style={{ color: "#f09a66" }}>Chess</span>
        </div>
      </div>
    ),
    size,
  );
}
