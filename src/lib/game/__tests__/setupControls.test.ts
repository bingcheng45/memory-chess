import {
  MEMORIZE_SECONDS_LADDER,
  PREVIEW_PIECES,
  stepMemorizeTime,
  stepPieceCount,
} from '@/lib/game/setupControls';

describe('stepMemorizeTime', () => {
  it.each([
    [1, 1, 2],
    [9, 1, 10],
    [10, 1, 15],
    [15, 1, 20],
    [55, 1, 60],
    [60, 1, 60],
    [60, -1, 55],
    [20, -1, 15],
    [15, -1, 10],
    [10, -1, 9],
    [2, -1, 1],
    [1, -1, 1],
    [18, 1, 20],
    [18, -1, 15],
    [12, -1, 10],
  ] as const)('steps %i seconds by %i to %i', (seconds, direction, expected) => {
    expect(stepMemorizeTime(seconds, direction)).toBe(expected);
  });

  it('climbs the whole range in 20 steps', () => {
    expect(MEMORIZE_SECONDS_LADDER).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]);
  });
});

describe('stepPieceCount', () => {
  it.each([
    [6, 1, 7],
    [6, -1, 5],
    [2, -1, 2],
    [32, 1, 32],
    [6, 5, 11],
    [30, 5, 32],
    [4, -5, 2],
  ])('steps %i pieces by %i to %i', (count, delta, expected) => {
    expect(stepPieceCount(count, delta)).toBe(expected);
  });
});

describe('PREVIEW_PIECES', () => {
  it('starts with the two kings, then the queens, and uses 32 distinct squares', () => {
    expect(PREVIEW_PIECES.slice(0, 4).map(([square, piece]) => `${square} ${piece.color} ${piece.type}`)).toEqual([
      'g1 white king',
      'g8 black king',
      'd1 white queen',
      'd8 black queen',
    ]);
    expect(new Set(PREVIEW_PIECES.map(([square]) => square)).size).toBe(32);
  });

  it('holds exactly one full set', () => {
    const counts: Record<string, number> = {};
    for (const [, piece] of PREVIEW_PIECES) counts[`${piece.color} ${piece.type}`] = (counts[`${piece.color} ${piece.type}`] ?? 0) + 1;
    expect(counts).toEqual({
      'white king': 1, 'black king': 1, 'white queen': 1, 'black queen': 1,
      'white rook': 2, 'black rook': 2, 'white bishop': 2, 'black bishop': 2,
      'white knight': 2, 'black knight': 2, 'white pawn': 8, 'black pawn': 8,
    });
  });
});
