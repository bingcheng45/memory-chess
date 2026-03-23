import { ImageResponse } from 'next/og';
import { getLearnPageBySlug, LEARN_GOALS } from '@/lib/seo/learnPages';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

type LearnOpenGraphImageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function LearnOpenGraphImage({
  params,
}: LearnOpenGraphImageProps) {
  const { slug } = await params;
  const page = getLearnPageBySlug(slug);
  const goal = LEARN_GOALS[page.goal];

  if (!page) {
    return new ImageResponse(
      (
        <div
          style={{
            alignItems: 'center',
            background: '#111111',
            color: '#ffffff',
            display: 'flex',
            fontSize: 48,
            height: '100%',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          Memory Chess
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          background:
            "radial-gradient(circle at top right, rgba(255,159,67,0.35), transparent 35%), linear-gradient(135deg, #151515 0%, #111111 58%, #201913 100%)",
          color: "#fffaf2",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "56px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            color: "#ffb77c",
            display: "flex",
            fontSize: 24,
            gap: "16px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              border: "1px solid rgba(255,183,124,0.4)",
              borderRadius: "999px",
              padding: "10px 18px",
            }}
          >
            {goal.label}
          </div>
          <div>Memory Chess Learn Guide</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "900px",
          }}
        >
          <div style={{ fontSize: 70, fontWeight: 800, lineHeight: 1.05 }}>
            {page.title}
          </div>
          <div
            style={{
              color: "rgba(255,250,242,0.78)",
              fontSize: 30,
              lineHeight: 1.35,
            }}
          >
            {page.quickAnswer}
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            color: "rgba(255,250,242,0.72)",
            display: "flex",
            fontSize: 24,
            justifyContent: "space-between",
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
