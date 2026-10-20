import { labPositionFromFen } from "@/lib/round/round";
import { notationOf } from "@/lib/round/notation";

describe("notationOf", () => {
  it("writes each side's pieces king first, then queen, rooks, bishops, knights and pawns by square alone", () => {
    expect(notationOf(labPositionFromFen("6k1/8/5n2/8/4P3/8/5P2/3QK2R"))).toEqual([
      { color: "white", pieces: ["Ke1", "Qd1", "Rh1", "e4", "f2"] },
      { color: "black", pieces: ["Kg8", "Nf6"] },
    ]);
  });

  it("sorts squares within a type by file, then rank", () => {
    expect(notationOf(labPositionFromFen("r3k2r/pp6/8/8/8/2N5/1P4P1/R1B1KB1N"))).toEqual([
      { color: "white", pieces: ["Ke1", "Ra1", "Bc1", "Bf1", "Nc3", "Nh1", "b2", "g2"] },
      { color: "black", pieces: ["Ke8", "Ra8", "Rh8", "a7", "b7"] },
    ]);
  });

  it("names two lone kings", () => {
    expect(notationOf(labPositionFromFen("8/8/8/3k4/8/8/8/6K1"))).toEqual([
      { color: "white", pieces: ["Kg1"] },
      { color: "black", pieces: ["Kd5"] },
    ]);
  });

  it("leaves out a side with nothing on the board", () => {
    expect(notationOf(labPositionFromFen("8/8/8/8/8/8/4P3/4K3"))).toEqual([{ color: "white", pieces: ["Ke1", "e2"] }]);
  });
});
