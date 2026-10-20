import { renderWithIntl, screen, within } from "@/test-utils/intl";
import { labPositionFromFen, roundReducer, type RoundConfig, type RoundState } from "@/lib/round/round";
import { RoundBoard } from "@/components/round/RoundBoard";
import { StudyNotation } from "@/components/round/StudyNotation";
import { scoredRound } from "@/test-utils/round";

const BOARD: RoundConfig = { pieceCount: 4, studyMs: 10_000, source: "game_form" };
const BLINDFOLD: RoundConfig = { ...BOARD, blindfold: true };
const FEN = "6k1/8/5n2/8/8/8/5P2/4K3";

const studying = (config: RoundConfig): RoundState =>
  roundReducer({ phase: "idle" }, { type: "start", config, target: labPositionFromFen(FEN), now: 0 });

describe("a blindfold round's study phase", () => {
  it("shows the board empty while a board round shows the pieces", () => {
    const { unmount } = renderWithIntl(<RoundBoard state={studying(BOARD)} dispatch={jest.fn()} copy="game.round" />);
    expect(screen.getByRole("button", { name: "e1, white king" })).toBeInTheDocument();
    unmount();

    renderWithIntl(<RoundBoard state={studying(BLINDFOLD)} dispatch={jest.fn()} copy="game.round" />);
    expect(screen.getByRole("button", { name: "e1, empty" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "g8, empty" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /king|knight|pawn/ })).toBeNull();
  });

  it("reads the position as a list, one line per side, with a legend for the letters", () => {
    const state = studying(BLINDFOLD);
    if (state.phase !== "study") throw new Error("not studying");
    renderWithIntl(<StudyNotation position={state.target} />);

    const list = screen.getByRole("list", { name: "The position in notation" });
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["White: Ke1, f2", "Black: Kg8, Nf6"]);
    expect(screen.getByText("K King · Q Queen · R Rook · B Bishop · N Knight · a square alone is a pawn")).toBeInTheDocument();
  });

  it("scores the rebuild exactly as a board round does", () => {
    const target = "4k3/8/8/8/3q4/8/PP6/4K3";
    const placed = "4k3/8/8/8/8/8/PP6/4K3";

    expect(scoredRound(target, placed, BLINDFOLD).score).toEqual(scoredRound(target, placed, BOARD).score);
    expect(scoredRound(target, placed, BLINDFOLD).score).toMatchObject({ accuracy: 80, correct: 4, total: 5, wrong: 1 });
  });
});
