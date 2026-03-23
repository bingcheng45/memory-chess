import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background:
            'radial-gradient(circle at top right, rgba(255,159,67,0.35), transparent 35%), linear-gradient(135deg, #151515 0%, #111111 58%, #201913 100%)',
          color: '#fff8ef',
          padding: '56px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            fontSize: 24,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#ffb77c',
          }}
        >
          <div
            style={{
              borderRadius: '999px',
              border: '1px solid rgba(255,183,124,0.4)',
              padding: '10px 18px',
            }}
          >
            Memory Chess
          </div>
          <div>Visualization and Recall Training</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
          <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.03 }}>
            Train chess visualization and board memory like a skill.
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.3, color: 'rgba(255,248,239,0.78)' }}>
            Practical drills for recall, board vision, blunder prevention, and beginner improvement.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 26,
            color: 'rgba(255,248,239,0.72)',
          }}
        >
          <div>thememorychess.com</div>
          <div>Free online training</div>
        </div>
      </div>
    ),
    size,
  );
}
