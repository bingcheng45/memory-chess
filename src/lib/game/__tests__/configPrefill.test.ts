import {
  GAME_CONFIG_RULES,
  parseGameSettings,
  presetIdFor,
  resolveGameSettings,
} from "@/lib/game/configPrefill";

const decide = (search: string, saved: unknown) => {
  const settings = resolveGameSettings(
    search,
    parseGameSettings(saved, GAME_CONFIG_RULES),
    GAME_CONFIG_RULES,
  );
  return settings && { ...settings, preset: presetIdFor(settings, GAME_CONFIG_RULES.presets) };
};

describe("resolveGameSettings with parseGameSettings", () => {
  it.each([
    ["saved 3/18 is custom", "", { pieceCount: 3, memorizeTime: 18 }, { pieceCount: 3, memorizeTime: 18, preset: null }],
    ["saved 12/8 is Hard", "", { pieceCount: 12, memorizeTime: 8 }, { pieceCount: 12, memorizeTime: 8, preset: "hard" }],
    ["?difficulty=easy wins over saved 12/8", "?difficulty=easy", { pieceCount: 12, memorizeTime: 8 }, { pieceCount: 2, memorizeTime: 10, preset: "easy" }],
    ["?difficulty= matches case-insensitively", "?difficulty=GrandMaster", null, { pieceCount: 20, memorizeTime: 5, preset: "grandmaster" }],
    ["an unknown ?difficulty= falls back to saved", "?difficulty=nonsense", { pieceCount: 12, memorizeTime: 8 }, { pieceCount: 12, memorizeTime: 8, preset: "hard" }],
    ["?pieceCount= auto-starts, so nothing", "?pieceCount=5", { pieceCount: 12, memorizeTime: 8 }, null],
    ["?memorizeTime= auto-starts, so nothing", "?memorizeTime=5", { pieceCount: 12, memorizeTime: 8 }, null],
    ["an empty ?pieceCount= does not auto-start", "?pieceCount=", { pieceCount: 12, memorizeTime: 8 }, { pieceCount: 12, memorizeTime: 8, preset: "hard" }],
    ["no storage", "", undefined, null],
    ["null settings", "", null, null],
    ["a string", "", "12/8", null],
    ["pieces below range", "", { pieceCount: 1, memorizeTime: 8 }, null],
    ["pieces above range", "", { pieceCount: 33, memorizeTime: 8 }, null],
    ["seconds above range", "", { pieceCount: 12, memorizeTime: 33 }, null],
    ["fractional pieces", "", { pieceCount: 12.5, memorizeTime: 8 }, null],
    ["numeric strings", "", { pieceCount: "12", memorizeTime: "8" }, null],
    ["a missing field", "", { pieceCount: 12 }, null],
  ])("%s", (_name, search, saved, expected) => {
    expect(decide(search, saved)).toEqual(expected);
  });
});
