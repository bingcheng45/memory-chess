import { ImageResponse } from "next/og";
import { findLearnPageBySlug, LEARN_GOALS } from "@/lib/seo/learnPages";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type LearnOpenGraphImageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function LearnOpenGraphImage({
  params,
}: LearnOpenGraphImageProps) {
  const { slug } = await params;
  const page = findLearnPageBySlug(slug);

  if (!page) {
    return new ImageResponse(
      (
        <div
          style={{
            alignItems: "center",
            background: "#111111",
            color: "#ffffff",
            display: "flex",
            fontSize: 48,
            height: "100%",
            justifyContent: "center",
            width: "100%",
          }}
        >
          Memory Chess
        </div>
      ),
      size,
    );
  }

  const goal = LEARN_GOALS[page.goal];

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
            color: "#FFC299",
            display: "flex",
            fontFamily: "monospace",
            fontSize: 20,
            gap: "18px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              border: "1px solid rgba(255,179,128,0.3)",
              borderRadius: "999px",
              letterSpacing: "normal",
              padding: "9px 16px",
              textTransform: "none",
            }}
          >
            {goal.label}
          </div>
          <div>Memory Chess guide</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            maxWidth: "980px",
          }}
        >
          <div
            style={{
              fontSize: 66,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.06,
            }}
          >
            {page.title}
          </div>
          <div
            style={{
              color: "#BBBBBB",
              fontSize: 28,
              lineHeight: 1.4,
            }}
          >
            {page.quickAnswer}
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            color: "#BBBBBB",
            display: "flex",
            fontSize: 22,
            justifyContent: "space-between",
            paddingTop: "24px",
          }}
        >
          <div>thememorychess.com</div>
          <div>{page.timeToRead}</div>
        </div>
      </div>
    ),
    size,
  );
}
