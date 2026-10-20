import { BOARD, HOLES, PEG_COLORS, pegColor, pegPose, type PegColor, type PegPose } from "./woodenGame";

const PEG_R = 10;
const DIE_HALF = 12;

export function WoodenBoard() {
  return (
    <g>
      <circle className="wg-board-edge" cx={BOARD.x} cy={BOARD.y + 5} r={BOARD.r} />
      <circle className="wg-board" cx={BOARD.x} cy={BOARD.y} r={BOARD.r} />
      {HOLES.map((hole, index) => (
        <circle key={index} className="wg-hole" cx={hole.x} cy={hole.y} r={PEG_R - 1} />
      ))}
    </g>
  );
}

/** Spins a quarter turn past a full turn on every roll, and shows only the face it lands on. */
export function WoodenDie({ color, rolls }: { readonly color: PegColor | null; readonly rolls: number }) {
  return (
    <g className="wg-die" style={{ transform: `translate(${BOARD.x}px, ${BOARD.y}px) rotate(${rolls * 450}deg)` }}>
      <rect x={-DIE_HALF} y={-DIE_HALF} width={DIE_HALF * 2} height={DIE_HALF * 2} rx={4} />
      {PEG_COLORS.map((face) => (
        <circle key={face} className={`wg-paint wg-${face}`} r={6} style={{ opacity: face === color ? 1 : 0 }} />
      ))}
    </g>
  );
}

/** A peg seen from above: a round wooden head, with its painted base showing only once it is out of the board. */
export function WoodenPeg({ id, pose }: { readonly id: number; readonly pose: PegPose }) {
  return (
    <g className="wg-peg" style={{ transform: `translate(${pose.at.x}px, ${pose.at.y}px) scale(${pose.scale})` }}>
      <circle className="wg-peg-head" r={PEG_R} />
      <circle className={`wg-paint wg-${pegColor(id)}`} r={PEG_R - 3} style={{ opacity: pose.painted ? 1 : 0 }} />
    </g>
  );
}

/** The set as sold: the board with its die, and the 24 pegs laid around it with their colours showing. */
export function WoodenSetIllustration() {
  return (
    <svg className="wg-art wg-set" viewBox="0 0 320 320" aria-hidden="true">
      <WoodenBoard />
      <WoodenDie color="red" rolls={0} />
      {HOLES.map((_, id) => (
        <WoodenPeg key={id} id={id} pose={pegPose(id, { kind: "beside" }, true)} />
      ))}
    </svg>
  );
}
