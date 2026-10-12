import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CSSProperties, ReactNode } from "react";
import { ImageResponse } from "next/og";
import type { ResultStat, ScoredBoard } from "@/components/game/roundShare";
import { INK, type CardTrend } from "@/components/share/cardCanvas";
import { BOARD_SQUARES } from "@/lib/game/board";
import { isDarkSquare, squareVerdict, type LabPiece } from "@/lib/round/round";
import type { PreviewFigure, PreviewSegment, ProgressPreview, ResultPreview } from "./cardCopy";
import { PREVIEW_SIZE } from "./previewSize";

const PAD = 56;
const INNER = PREVIEW_SIZE.width - 2 * PAD;
/** A feed shows the preview about 500px wide, so nothing is set under 26px: about 11px on screen. */
const SMALLEST = 26;
const FONT = "Geist";
/** Geist's figures and most letters run about this share of the size wide: enough to shrink a figure that would overflow. */
const ADVANCE = 0.6;
const MARK = { ok: "rgba(15, 122, 85, 0.26)", wrong: "rgba(198, 63, 18, 0.30)" };
const PIECE_TYPES = ["king", "queen", "rook", "bishop", "knight", "pawn"] as const satisfies readonly LabPiece["type"][];
type PieceArt = Readonly<Record<`${LabPiece["color"]}-${LabPiece["type"]}`, string>>;

/** The faces ship with the app (src/lib/share/fonts, SIL Open Font License), so drawing a card never waits on a network. */
const fonts = Promise.all(
  ([["Medium", 500], ["SemiBold", 600], ["Bold", 700]] as const).map(async ([face, weight]) => ({
    name: FONT,
    data: await readFile(join(process.cwd(), "src/lib/share/fonts", `Geist-${face}.ttf`)),
    weight,
    style: "normal" as const,
  })),
);

/** The game's own piece artwork (src/lib/share/pieces, BSD), as data URIs the renderer draws without a network. */
const pieceArt: Promise<PieceArt> = Promise.all(
  (["white", "black"] as const).flatMap((color) =>
    PIECE_TYPES.map(async (type) => {
      const svg = await readFile(join(process.cwd(), "src/lib/share/pieces", `${color}-${type}.svg`));
      return [`${color}-${type}`, `data:image/svg+xml;base64,${svg.toString("base64")}`] as const;
    }),
  ),
).then((entries) => Object.fromEntries(entries) as PieceArt);

/** The largest size up to `max` at which `text` fits `width`, estimated, since the renderer cannot measure ahead. */
const fitChars = (chars: number, max: number, width: number) => Math.max(SMALLEST, Math.min(max, Math.floor(width / (Math.max(chars, 1) * ADVANCE))));
const fit = (text: string, max: number, width: number) => fitChars(text.length, max, width);

const row = (style: CSSProperties = {}): CSSProperties => ({ display: "flex", flexDirection: "row", ...style });
const column = (style: CSSProperties = {}): CSSProperties => ({ display: "flex", flexDirection: "column", ...style });

function Trend({ trend, size }: { trend: CardTrend; size: number }) {
  const color = trend.direction === "up" ? INK.correct : INK.wrong;
  const side = Math.round(size * 0.8);
  const points = trend.direction === "up" ? `${side / 2},0 ${side},${side} 0,${side}` : `0,0 ${side},0 ${side / 2},${side}`;
  return (
    <div style={row({ alignItems: "center", gap: Math.round(size * 0.25), marginLeft: Math.round(size * 0.35), color, fontSize: size, fontWeight: 600 })}>
      <svg width={side} height={side} viewBox={`0 0 ${side} ${side}`}>
        <polygon points={points} fill={color} />
      </svg>
      <span>{trend.text}</span>
    </div>
  );
}

function Value({ segments, trend, size, width }: { segments: readonly PreviewSegment[]; trend?: CardTrend; size: number; width: number }) {
  const length = segments.reduce((sum, { text, big }) => sum + (big ? text.length : text.length * 0.3), 0) + (trend ? (trend.text.length + 2) * 0.4 : 0);
  const fitted = fitChars(length, size, width);
  return (
    <div style={row({ alignItems: "baseline", whiteSpace: "pre" })}>
      {segments.map(({ text, big }, index) => (
        <span key={index} style={{ fontSize: big ? fitted : Math.max(SMALLEST, Math.round(fitted * 0.3)), fontWeight: big ? 600 : 500, color: big ? INK.ink : INK.ink2 }}>
          {text}
        </span>
      ))}
      {trend && <Trend trend={trend} size={Math.max(SMALLEST, Math.round(fitted * 0.4))} />}
    </div>
  );
}

function Frame({ kicker, cta, site, children }: { kicker: string; cta: string; site: string; children: ReactNode }) {
  return (
    <div
      style={column({
        width: "100%",
        height: "100%",
        padding: PAD,
        fontFamily: FONT,
        color: INK.ink,
        backgroundColor: INK.paper,
        backgroundImage: `linear-gradient(${INK.grid} 1px, transparent 1px), linear-gradient(90deg, ${INK.grid} 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
      })}
    >
      <div style={row({ alignItems: "center", justifyContent: "space-between", paddingBottom: 20, borderBottom: `2px solid ${INK.rule}` })}>
        <div style={row({ fontSize: 48, fontWeight: 700, letterSpacing: "-0.02em" })}>
          <span>Memory&nbsp;</span>
          <span style={{ color: INK.wordmark }}>Chess</span>
        </div>
        <div style={row({ padding: "8px 22px", borderRadius: 999, backgroundColor: INK.accentSoft, color: INK.accent, fontSize: fit(kicker, 28, 460), fontWeight: 600 })}>{kicker}</div>
      </div>
      <div style={row({ flex: 1, paddingTop: 16, paddingBottom: 16, minHeight: 0 })}>{children}</div>
      <div style={row({ alignItems: "center", justifyContent: "space-between", paddingTop: 20, borderTop: `2px solid ${INK.rule}`, fontSize: 34, fontWeight: 600 })}>
        <span>{cta}</span>
        <span style={{ color: INK.accent }}>{site}</span>
      </div>
    </div>
  );
}

function Figure({ figure, size, width }: { figure: PreviewFigure; size: number; width: number }) {
  return (
    <div style={column({ width, gap: 4 })}>
      <span style={{ fontSize: fit(figure.label, size > 100 ? 32 : size > 50 ? 28 : SMALLEST, width), fontWeight: 600, color: INK.muted }}>{figure.label}</span>
      <Value segments={figure.segments} trend={figure.trend} size={size} width={width} />
    </div>
  );
}

function ProgressBody({ copy }: { copy: ProgressPreview }) {
  const leadWidth = copy.grid.length === 0 ? INNER : 300;
  const gridWidth = INNER - leadWidth - 40;
  const columns = copy.grid.length <= 4 ? 2 : 3;
  const cellWidth = (gridWidth - (columns - 1) * 24) / columns;
  const rows = Math.ceil(copy.grid.length / columns);
  return (
    <div style={row({ flex: 1, gap: 40, alignItems: "flex-start" })}>
      <Figure figure={copy.lead} size={150} width={leadWidth} />
      {copy.grid.length > 0 && (
        <div style={row({ width: gridWidth, flexWrap: "wrap", columnGap: 24, rowGap: rows > 2 ? 8 : 20 })}>
          {copy.grid.map((figure, index) => (
            <div key={index} style={column({ paddingTop: 10, borderTop: `2px solid ${INK.rule}` })}>
              <Figure figure={figure} size={rows > 2 ? 44 : 64} width={cellWidth} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SQUARE = 40;
const BOARD = SQUARE * 8;
const PIECE = Math.round(SQUARE * 0.85);

function Piece({ piece, ghost, art }: { piece: LabPiece; ghost: boolean; art: PieceArt }) {
  // eslint-disable-next-line @next/next/no-img-element -- drawn by the image renderer, not a page
  return <img src={art[`${piece.color}-${piece.type}`]} width={PIECE} height={PIECE} alt="" style={{ opacity: ghost ? 0.38 : 1 }} />;
}

/** The scored board as the result screen marks it, with the pieces the game draws. */
function Board({ board, art }: { board: ScoredBoard; art: PieceArt }) {
  return (
    <div style={row({ width: BOARD + 4, flexWrap: "wrap", border: `2px solid ${INK.rule}` })}>
      {BOARD_SQUARES.map((square, index) => {
        const verdict = squareVerdict(board.target, board.placed, square)?.split(" ") ?? [];
        const placed = board.placed[square];
        const ghost = placed ? undefined : board.target[square];
        const piece = placed ?? ghost;
        const fill = verdict.includes("ok") ? MARK.ok : verdict.includes("wrong") ? MARK.wrong : "transparent";
        return (
          <div key={square} style={row({ width: SQUARE, height: SQUARE, backgroundColor: isDarkSquare(index) ? INK.squareDark : INK.squareLight })}>
            <div
              style={row({
                width: SQUARE,
                height: SQUARE,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: fill,
                border: verdict.includes("miss") ? `3px solid ${INK.wrong}` : "none",
              })}
            >
              {piece && <Piece piece={piece} ghost={!placed} art={art} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Legend({ legend }: { legend: NonNullable<ResultPreview["legend"]> }) {
  return (
    <div style={column({ gap: 2, marginTop: 10 })}>
      {(["correct", "missed", "wrong"] as const).map((mark) => (
        <div key={mark} style={row({ alignItems: "center", gap: 8, fontSize: SMALLEST, fontWeight: 500, color: INK.ink2 })}>
          <div
            style={{
              width: 22,
              height: 22,
              backgroundColor: mark === "missed" ? INK.squareLight : mark === "correct" ? MARK.ok : MARK.wrong,
              border: mark === "missed" ? `3px solid ${INK.wrong}` : "none",
            }}
          />
          <span>{legend[mark]}</span>
        </div>
      ))}
    </div>
  );
}

function Stat({ stat, width }: { stat: ResultStat; width: number }) {
  const value = stat.mark ? stat.mark.figure : stat.value;
  return (
    <div style={row({ width, alignItems: "baseline", justifyContent: "space-between", gap: 16, paddingTop: 10, paddingBottom: 10, borderTop: `2px solid ${INK.rule}` })}>
      <span style={{ fontSize: 28, fontWeight: 600, color: INK.muted }}>{stat.label}</span>
      <div style={row({ alignItems: "center" })}>
        <span style={{ fontSize: fit(value, 34, width * 0.55), fontWeight: 600 }}>{value}</span>
        {stat.mark && <Trend trend={stat.mark.trend} size={28} />}
      </div>
    </div>
  );
}

function ResultBody({ copy, board, art }: { copy: ResultPreview; board: ScoredBoard | null; art: PieceArt }) {
  const headWidth = board ? 260 : 420;
  const statsWidth = INNER - headWidth - (board ? BOARD + 4 + 2 * 36 : 48);
  return (
    <div style={row({ flex: 1, gap: board ? 36 : 48, alignItems: "flex-start" })}>
      <div style={column({ width: headWidth })}>
        <span style={{ fontSize: 32, fontWeight: 600, color: INK.muted }}>{copy.accuracyLabel}</span>
        <span style={{ fontSize: fit(copy.accuracy, board ? 132 : 170, headWidth), fontWeight: 600, lineHeight: 1.05 }}>{copy.accuracy}</span>
        <span style={{ fontSize: fit(copy.pieces, 34, headWidth), fontWeight: 500, color: INK.ink2 }}>{copy.pieces}</span>
        {board && copy.legend && <Legend legend={copy.legend} />}
      </div>
      <div style={column({ width: statsWidth })}>
        {copy.stats.map((stat) => (
          <Stat key={stat.label} stat={stat} width={statsWidth} />
        ))}
      </div>
      {board && <Board board={board} art={art} />}
    </div>
  );
}

/** Each preview is drawn once per URL and never changes, so any cache may keep it for good. */
const IMMUTABLE = { "Cache-Control": "public, max-age=31536000, immutable" };

async function respond(frame: { kicker: string; cta: string; site: string }, body: ReactNode): Promise<ImageResponse> {
  return new ImageResponse(
    (
      <Frame kicker={frame.kicker} cta={frame.cta} site={frame.site}>
        {body}
      </Frame>
    ),
    { ...PREVIEW_SIZE, fonts: await fonts, headers: IMMUTABLE },
  );
}

export const progressImage = (copy: ProgressPreview) => respond(copy, <ProgressBody copy={copy} />);
export const resultImage = async (copy: ResultPreview, board: ScoredBoard | null) => respond(copy, <ResultBody copy={copy} board={board} art={await pieceArt} />);
