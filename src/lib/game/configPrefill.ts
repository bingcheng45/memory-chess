import { MEMORIZE_SECONDS_RANGE, PIECE_COUNT_RANGE } from '@/lib/reference/facts';

export const GAME_STORAGE_KEY = 'memory-chess-storage';

export interface GameSettings {
  readonly pieceCount: number;
  readonly memorizeTime: number;
}

export type PresetId = 'easy' | 'medium' | 'hard' | 'grandmaster';

export interface DifficultyPreset extends GameSettings {
  readonly id: PresetId;
}

interface Range {
  readonly min: number;
  readonly max: number;
}

export interface GameConfigRules {
  readonly pieceCount: Range;
  readonly memorizeTime: Range;
  readonly presets: readonly DifficultyPreset[];
}

export const DEFAULT_PRESET: DifficultyPreset = { id: 'medium', pieceCount: 6, memorizeTime: 10 };

// `id` is the selection key, the `?difficulty=` value and what the
// leaderboard stores, so it is never translated.
export const GAME_CONFIG_RULES: GameConfigRules = {
  pieceCount: PIECE_COUNT_RANGE,
  memorizeTime: MEMORIZE_SECONDS_RANGE,
  presets: [
    { id: 'easy', pieceCount: 2, memorizeTime: 10 },
    DEFAULT_PRESET,
    { id: 'hard', pieceCount: 12, memorizeTime: 8 },
    { id: 'grandmaster', pieceCount: 20, memorizeTime: 5 },
  ],
};

export function parseGameSettings(raw: unknown, rules: GameConfigRules): GameSettings | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { pieceCount, memorizeTime } = raw as Record<string, unknown>;
  const within = (value: unknown, range: Range): value is number =>
    Number.isInteger(value) && (value as number) >= range.min && (value as number) <= range.max;
  return within(pieceCount, rules.pieceCount) && within(memorizeTime, rules.memorizeTime)
    ? { pieceCount, memorizeTime }
    : null;
}

// A valid ?difficulty= wins. ?pieceCount= or ?memorizeTime= start a round on
// mount (see the game page), so the form is left alone. Otherwise the saved
// settings apply.
export function resolveGameSettings(
  search: string,
  saved: GameSettings | null,
  rules: GameConfigRules,
): GameSettings | null {
  const params = new URLSearchParams(search);
  const difficulty = (params.get('difficulty') || '').toLowerCase();
  const preset = rules.presets.find((candidate) => candidate.id === difficulty);
  if (preset) return { pieceCount: preset.pieceCount, memorizeTime: preset.memorizeTime };
  if (params.get('pieceCount') || params.get('memorizeTime')) return null;
  return saved;
}

export function presetIdFor(
  settings: GameSettings,
  presets: readonly DifficultyPreset[],
): PresetId | null {
  const match = presets.find(
    (preset) =>
      preset.pieceCount === settings.pieceCount && preset.memorizeTime === settings.memorizeTime,
  );
  return match ? match.id : null;
}
