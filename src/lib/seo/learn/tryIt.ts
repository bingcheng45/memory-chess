import type { LearnPosition } from "./positions";

export const TRY_IT_PIECES = 4;

export const TRY_IT_POSITION: LearnPosition & Required<Pick<LearnPosition, "white" | "black">> = {
  id: "try-it",
  white: ["Kg1", "Nf3"],
  black: ["Ke8", "Bd6"],
  toMove: "w",
  claims: [{ kind: "pieceCount", count: TRY_IT_PIECES }, { kind: "noCheck" }],
};
