export const PEG_COLORS = ["red", "yellow", "blue", "green", "black", "white"] as const;
export type PegColor = (typeof PEG_COLORS)[number];
export type Player = 0 | 1;

export type Point = { readonly x: number; readonly y: number };

export const VIEW = { width: 480, height: 320 } as const;
export const BOARD = { x: 160, y: 160, r: 128 } as const;

const ring = (count: number, radius: number, turn = 0): Point[] =>
  Array.from({ length: count }, (_, index) => {
    const angle = ((index + turn) / count) * 2 * Math.PI - Math.PI / 2;
    return { x: BOARD.x + radius * Math.cos(angle), y: BOARD.y + radius * Math.sin(angle) };
  });

/** The real board: 16 holes in the outer ring, 8 in the inner ring, the die in the middle. */
export const HOLES: readonly Point[] = [...ring(16, 100), ...ring(8, 56, 0.5)];

/** Peg `id` lives in hole `id`. Stepping by 5 through six colours gives each colour four scattered holes. */
export const pegColor = (id: number): PegColor => PEG_COLORS[(id * 5) % PEG_COLORS.length];

export type PegPlace =
  | { readonly kind: "beside" }
  | { readonly kind: "hole" }
  | { readonly kind: "lifted" }
  | { readonly kind: "tray"; readonly player: Player; readonly slot: number };

export type Frame = {
  readonly caption: string;
  readonly places: readonly PegPlace[];
  /** Colours show on every peg, as they do before setup. Otherwise only on a lifted peg or one in a tray. */
  readonly showAll: boolean;
  readonly die: PegColor | null;
  /** Counts rolls so the die spins on each one, even onto the face it already shows. */
  readonly rolls: number;
  readonly turn: Player;
  readonly winner: Player | null;
};

export type PegPose = { readonly at: Point; readonly scale: number; readonly painted: boolean };

const BESIDE = ring(HOLES.length, 146);
const TRAY_ORIGIN: Record<Player, Point> = { 0: { x: 352, y: 74 }, 1: { x: 352, y: 214 } };
const TRAY_PITCH = 30;
const TRAY_COLUMNS = 4;

export function pegPose(id: number, place: PegPlace, showAll: boolean): PegPose {
  switch (place.kind) {
    case "beside":
      return { at: BESIDE[id], scale: 1, painted: true };
    case "hole":
      return { at: HOLES[id], scale: 1, painted: showAll };
    case "lifted":
      return { at: { x: HOLES[id].x, y: HOLES[id].y - 12 }, scale: 1.6, painted: true };
    case "tray": {
      const origin = TRAY_ORIGIN[place.player];
      const column = place.slot % TRAY_COLUMNS;
      const row = Math.floor(place.slot / TRAY_COLUMNS);
      return { at: { x: origin.x + column * TRAY_PITCH, y: origin.y + row * TRAY_PITCH }, scale: 1, painted: true };
    }
  }
}

const pegOf = (color: PegColor, nth = 0): number =>
  HOLES.map((_, id) => id).filter((id) => pegColor(id) === color)[nth];

type Change = Omit<Partial<Frame>, "places"> & { readonly caption: string; readonly move?: Readonly<Record<number, PegPlace>> };

function script(first: Frame, changes: readonly Change[]): Frame[] {
  return changes.reduce<Frame[]>(
    (frames, { move = {}, ...rest }) => {
      const previous = frames[frames.length - 1];
      const places = previous.places.map((place, id) => move[id] ?? place);
      return [...frames, { ...previous, ...rest, places }];
    },
    [first],
  );
}

const hole: PegPlace = { kind: "hole" };
const lifted: PegPlace = { kind: "lifted" };
const tray = (player: Player, slot: number): PegPlace => ({ kind: "tray", player, slot });

const BLUE = [0, 1, 2, 3].map((nth) => pegOf("blue", nth));
const RED = pegOf("red");
const GREEN = pegOf("green");
const BLACK = [0, 1].map((nth) => pegOf("black", nth));

/** One two-player game, from setup to a win. Every caption restates a written rule in the guide. */
export const FRAMES: readonly Frame[] = script(
  {
    caption: "Show everyone the 24 pegs: four each of red, yellow, blue, green, black and white.",
    places: HOLES.map((): PegPlace => ({ kind: "beside" })),
    showAll: true,
    die: null,
    rolls: 0,
    turn: 0,
    winner: null,
  },
  [
    {
      caption: "Stand every peg in a hole, colour end down. Now nobody can see which colour is where.",
      move: Object.fromEntries(HOLES.map((_, id) => [id, hole])),
      showAll: false,
    },
    { caption: "Player 1 rolls the die. It lands on blue.", die: "blue", rolls: 1 },
    { caption: "Player 1 lifts one peg and looks at its base. It is blue.", move: { [BLUE[0]]: lifted } },
    { caption: "A match. Player 1 keeps the peg and rolls again. This time it is red.", move: { [BLUE[0]]: tray(0, 0) }, die: "red", rolls: 2 },
    { caption: "Player 1 lifts another peg. Its base is green, not red.", move: { [GREEN]: lifted } },
    { caption: "No match. The peg goes back in the same hole, and the turn passes to Player 2.", move: { [GREEN]: hole }, turn: 1 },
    { caption: "Player 2 rolls green and lifts the peg Player 1 just put back.", die: "green", rolls: 3, move: { [GREEN]: lifted } },
    { caption: "A match for Player 2, who keeps it and rolls again.", move: { [GREEN]: tray(1, 0) }, die: "black", rolls: 4 },
    {
      caption: "Later in the game, Player 1 holds three blue pegs and rolls blue again.",
      move: { [BLUE[1]]: tray(0, 1), [BLUE[2]]: tray(0, 2), [RED]: tray(0, 3), [BLACK[0]]: tray(1, 1), [BLACK[1]]: tray(1, 2) },
      turn: 0,
      die: "blue",
      rolls: 5,
    },
    { caption: "Player 1 remembers where the last blue peg stands, lifts it, and it is blue.", move: { [BLUE[3]]: lifted } },
    { caption: "Four pegs of one colour. Player 1 wins the game.", move: { [BLUE[3]]: tray(0, 4) }, winner: 0 },
  ],
);
