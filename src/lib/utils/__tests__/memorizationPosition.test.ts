import {
  generateMemorizationPosition,
  validateMemorizationPosition,
} from "@/lib/utils/memorizationPosition";

const basePosition = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

describe("validateMemorizationPosition", () => {
  it("accepts separated kings", () => {
    expect(validateMemorizationPosition(basePosition, 2)).toMatchObject({
      valid: true,
      violations: [],
    });
  });

  it.each([
    "8/8/8/8/8/8/8/4Kk2 w - - 0 1",
    "8/8/8/8/8/8/4k3/4K3 w - - 0 1",
    "8/8/8/8/8/8/5k2/4K3 w - - 0 1",
  ])(
    "rejects horizontally, vertically, and diagonally adjacent kings",
    (fen) => {
      expect(validateMemorizationPosition(fen).violations).toContain(
        "adjacent-kings",
      );
    },
  );

  it.each([
    "4k3/8/8/8/8/2B5/8/B3K3 w - - 0 1",
    "b3k3/8/2b5/8/8/8/8/4K3 w - - 0 1",
  ])("rejects same-color bishop pairs for either side", (fen) => {
    expect(validateMemorizationPosition(fen).violations).toContain(
      "bishop-color-complex",
    );
  });

  it.each([
    "4k3/8/8/8/8/1B6/8/B3K3 w - - 0 1",
    "b3k3/8/1b6/8/8/8/8/4K3 w - - 0 1",
    "4k3/8/8/8/8/8/8/B3K3 w - - 0 1",
  ])("accepts opposite-color bishop pairs and single bishops", (fen) => {
    expect(validateMemorizationPosition(fen).violations).not.toContain(
      "bishop-color-complex",
    );
  });

  it.each(["4k3/8/8/8/8/8/8/P3K3 w - - 0 1", "4k2p/8/8/8/8/8/8/4K3 w - - 0 1"])(
    "rejects pawns on either back rank",
    (fen) => {
      expect(validateMemorizationPosition(fen).violations).toContain(
        "pawn-back-rank",
      );
    },
  );

  it("accepts a single checked king only when that side is active", () => {
    const whiteChecked = "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1";
    const wrongTurn = "4k3/8/8/8/8/8/4r3/4K3 b - - 0 1";

    expect(validateMemorizationPosition(whiteChecked)).toMatchObject({
      valid: true,
      whiteInCheck: true,
      blackInCheck: false,
    });
    expect(validateMemorizationPosition(wrongTurn).violations).toContain(
      "checked-side-not-to-move",
    );
  });

  it("rejects positions where both kings are checked", () => {
    const result = validateMemorizationPosition(
      "4k3/4R3/8/8/8/8/4r3/4K3 w - - 0 1",
    );

    expect(result.whiteInCheck).toBe(true);
    expect(result.blackInCheck).toBe(true);
    expect(result.violations).toContain("simultaneous-check");
  });

  it("checks material inventory and exact piece count", () => {
    const result = validateMemorizationPosition(
      "4k3/8/8/8/8/8/8/Q2QK3 w - - 0 1",
      3,
    );

    expect(result.violations).toEqual(
      expect.arrayContaining(["piece-inventory", "piece-count"]),
    );
  });
});

describe("generateMemorizationPosition", () => {
  it.each([2, 6, 12, 20, 32])(
    "generates %i-piece positions that pass every rule across 200 seeds",
    (pieceCount) => {
      for (let seed = 1; seed <= 200; seed += 1) {
        const position = generateMemorizationPosition(
          pieceCount,
          seededRandom(seed),
        );

        expect(position).not.toBeNull();
        expect(
          validateMemorizationPosition(position!, pieceCount),
        ).toMatchObject({ valid: true, violations: [] });
      }
    },
  );

  it("clamps requested piece counts to the supported range", () => {
    const minimum = generateMemorizationPosition(0, seededRandom(1));
    const maximum = generateMemorizationPosition(50, seededRandom(2));

    expect(validateMemorizationPosition(minimum!, 2).valid).toBe(true);
    expect(validateMemorizationPosition(maximum!, 32).valid).toBe(true);
  });

  it.each([2, 6, 12, 20, 32])(
    "returns a validated exact-count fallback for %i pieces after bounded attempts fail",
    (pieceCount) => {
      const position = generateMemorizationPosition(
        pieceCount,
        () => Number.NaN,
      );

      expect(position).not.toBeNull();
      expect(validateMemorizationPosition(position!, pieceCount)).toMatchObject(
        {
          valid: true,
          violations: [],
        },
      );
    },
  );
});
