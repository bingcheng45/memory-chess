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

export const VALUE_PLACEHOLDER = '{value}';

// The four functions below also ship as the source of the inline script that
// prefills the served form before hydration (see gameConfigPrefillScript), so
// each stays self-contained: no imports, no module-scope names, and only
// syntax every browser parses without transpiling.

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

// The server renders every string this needs (preset descriptions, the custom
// label, value templates) as data attributes, and one pressed and one unpressed
// preset button to copy classes from, so nothing translated or styled is
// recomputed here.
export function applyGameConfigPrefill(
  root: HTMLElement,
  settings: GameSettings,
  presetId: PresetId | null,
  rules: GameConfigRules,
  placeholder: string,
): void {
  const buttons = Array.from(root.querySelectorAll<HTMLElement>('[data-preset]'));
  const pressed = root.querySelector('[data-preset][aria-pressed="true"]');
  const unpressed = root.querySelector('[data-preset][aria-pressed="false"]');
  const description = root.querySelector<HTMLElement>('[data-preset-description]');
  const sliders = (['pieceCount', 'memorizeTime'] as const).map((name) => ({
    value: settings[name],
    range: rules[name],
    input: root.querySelector<HTMLInputElement>('input#' + name),
    label: root.querySelector<HTMLElement>('[data-value-for="' + name + '"]'),
  }));
  if (!pressed || !unpressed || !description) return;
  if (sliders.some((slider) => !slider.input || !slider.label)) return;

  const pressedClass = pressed.className;
  const unpressedClass = unpressed.className;
  root.setAttribute('data-prefilled', settings.pieceCount + '/' + settings.memorizeTime);
  description.textContent = description.getAttribute('data-custom-label');
  buttons.forEach((button) => {
    const isPressed = button.getAttribute('data-preset') === presetId;
    button.setAttribute('aria-pressed', String(isPressed));
    button.className = isPressed ? pressedClass : unpressedClass;
    if (isPressed) description.textContent = button.getAttribute('data-description');
  });
  sliders.forEach(({ value, range, input, label }) => {
    const fill = ((value - range.min) / (range.max - range.min)) * 100;
    input!.value = String(value);
    input!.style.setProperty('--fill', fill + '%');
    label!.textContent = (label!.getAttribute('data-template') || '').replace(placeholder, String(value));
  });
}

export function gameConfigPrefillScript(): string {
  return `(function () {
  try {
    var rules = ${JSON.stringify(GAME_CONFIG_RULES)};
    var root = document.querySelector('[data-game-config]');
    var stored = JSON.parse(localStorage.getItem(${JSON.stringify(GAME_STORAGE_KEY)}) || 'null');
    var saved = (${parseGameSettings})(stored && stored.state && stored.state.lastSettings, rules);
    var settings = (${resolveGameSettings})(location.search, saved, rules);
    if (!root || !settings) return;
    (${applyGameConfigPrefill})(root, settings, (${presetIdFor})(settings, rules.presets), rules, ${JSON.stringify(VALUE_PLACEHOLDER)});
  } catch (error) {}
})();`;
}
