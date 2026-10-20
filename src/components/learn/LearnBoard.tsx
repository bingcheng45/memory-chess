import type { Square } from "chess.js";
import type { GuideCopy } from "@/lib/seo/learn/guideCopy";
import { chessOf } from "@/lib/seo/learn/positions";
import type { BodyBlock } from "@/lib/seo/learn/schema";

type BoardBlock = Extract<BodyBlock, { kind: "board" }>;

const FILES = "abcdefgh";
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;
/** Solid glyphs for both sides; colour comes from CSS. U+FE0E keeps iOS from drawing them as emoji. */
const GLYPHS = { k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F" } as const;
const TEXT_PRESENTATION = "\uFE0E";

const centre = (square: Square) => ({ x: FILES.indexOf(square[0]) + 0.5, y: 8 - Number(square[1]) + 0.5 });

export default function LearnBoard({ block, figure, copy }: { readonly block: BoardBlock; readonly figure: number; readonly copy: GuideCopy }) {
  const chess = chessOf(block.position);
  const captionId = `${block.position.id}-caption`;

  return (
    <figure className="lg-board" id={block.position.id}>
      <div className="lg-board-plate">
        <div className="lg-board-frame">
          <div className="lg-board-grid" role="img" aria-labelledby={captionId}>
            {chess.board().flatMap((row, r) =>
              row.map((piece, f) => (
                <span key={`${FILES[f]}${8 - r}`} className="lg-sq" data-dark={(r + f) % 2 === 1 ? "" : undefined}>
                  {piece ? (
                    <span className="lg-piece" data-side={piece.color} aria-hidden="true">
                      {GLYPHS[piece.type]}
                      {TEXT_PRESENTATION}
                    </span>
                  ) : null}
                </span>
              )),
            )}
          </div>
          <svg className="lg-board-marks" viewBox="0 0 8 8" aria-hidden="true">
            {(block.marks ?? []).map(({ square }) => {
              const { x, y } = centre(square);
              return <rect key={`ring-${square}`} className="lg-ring" x={x - 0.44} y={y - 0.44} width={0.88} height={0.88} rx={0.08} />;
            })}
            {(block.arrows ?? []).map(({ from, to, kind }) => {
              const a = centre(from);
              const b = centre(to);
              return (
                <g key={`${from}-${to}`} data-kind={kind}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                  <circle cx={b.x} cy={b.y} r={0.12} />
                </g>
              );
            })}
          </svg>
          {/* Labels come from CSS so the same coordinate run is not page text on every guide with a board. */}
          <span className="lg-board-ranks" aria-hidden="true">
            {RANKS.map((rank) => (
              <span key={rank} data-coord={rank} />
            ))}
          </span>
          <span className="lg-board-files" aria-hidden="true">
            {[...FILES].map((file) => (
              <span key={file} data-coord={file} />
            ))}
          </span>
        </div>
      </div>
      <figcaption id={captionId}>
        <b>{copy.figure(figure)}</b> {block.caption} {copy.toMove(chess.turn())}
      </figcaption>
    </figure>
  );
}
