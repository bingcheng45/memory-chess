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

/** Stand-ins the server leaves in `data-template` and `data-label-template` for the prefill to fill. */
export interface TemplateTokens {
  readonly pieceCount: string;
  readonly memorizeTime: string;
  readonly preset: string;
}

export const TEMPLATE_TOKENS: TemplateTokens = {
  pieceCount: '{pieceCount}',
  memorizeTime: '{memorizeTime}',
  preset: '{preset}',
};

// What the served form shows before hydration: the prefill the script
// recorded on it, or Medium when there is none, including on the server.
export function readPrefilledSettings(): GameSettings {
  if (typeof document === 'undefined') return DEFAULT_PRESET;
  const form = document.querySelector<HTMLElement>('[data-game-config]');
  const [pieceCount, memorizeTime] = (form?.dataset.prefilled ?? '').split('/').map(Number);
  return parseGameSettings({ pieceCount, memorizeTime }, GAME_CONFIG_RULES) ?? DEFAULT_PRESET;
}

// The functions below also ship as the source of the inline script that
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

export type PreviewStyle = Readonly<Record<'--count' | '--study', string>>;

// The setup board shows the first --count pieces of its order, and its ring
// fills clockwise to --study, the share of the longest study time.
export function previewStyleOf(settings: GameSettings, rules: GameConfigRules): PreviewStyle {
  return {
    '--count': String(settings.pieceCount),
    '--study': Math.round((settings.memorizeTime / rules.memorizeTime.max) * 10000) / 100 + '%',
  };
}

// The server renders every string this needs (preset names and descriptions,
// the custom label, text and label templates) as data attributes, and one
// pressed and one unpressed preset button to copy classes from, so nothing
// translated or styled is recomputed here.
export function applyGameConfigPrefill(
  root: HTMLElement,
  settings: GameSettings,
  presetId: PresetId | null,
  rules: GameConfigRules,
  tokens: TemplateTokens,
  previewStyle: PreviewStyle,
): void {
  const buttons = Array.from(root.querySelectorAll<HTMLElement>('[data-preset]'));
  const pressed = root.querySelector('[data-preset][aria-pressed="true"]');
  const unpressed = root.querySelector('[data-preset][aria-pressed="false"]');
  const description = root.querySelector<HTMLElement>('[data-preset-description]');
  const preview = root.querySelector<HTMLElement>('[data-setup-preview]');
  if (!pressed || !unpressed || !description || !preview) return;

  const pressedClass = pressed.className;
  const unpressedClass = unpressed.className;
  let presetName = description.getAttribute('data-custom-label') || '';
  let presetDescription = presetName;
  root.setAttribute('data-prefilled', settings.pieceCount + '/' + settings.memorizeTime);
  buttons.forEach((button) => {
    const isPressed = button.getAttribute('data-preset') === presetId;
    button.setAttribute('aria-pressed', String(isPressed));
    button.className = isPressed ? pressedClass : unpressedClass;
    if (isPressed) {
      presetName = button.getAttribute('data-name') || '';
      presetDescription = button.getAttribute('data-description') || '';
    }
  });
  description.textContent = presetDescription;

  const fill = (template: string | null) =>
    (template || '')
      .split(tokens.pieceCount).join(String(settings.pieceCount))
      .split(tokens.memorizeTime).join(String(settings.memorizeTime))
      .split(tokens.preset).join(presetName);
  root.querySelectorAll('[data-template]').forEach((element) => {
    element.textContent = fill(element.getAttribute('data-template'));
  });
  root.querySelectorAll('[data-label-template]').forEach((element) => {
    element.setAttribute('aria-label', fill(element.getAttribute('data-label-template')));
  });
  root.querySelectorAll('[data-stepper]').forEach((button) => {
    const name = button.getAttribute('data-stepper') as keyof GameSettings;
    const value = settings[name];
    const atEnd = button.getAttribute('data-direction') === '-1' ? value <= rules[name].min : value >= rules[name].max;
    button.setAttribute('aria-disabled', String(atEnd));
  });
  preview.style.setProperty('--count', previewStyle['--count']);
  preview.style.setProperty('--study', previewStyle['--study']);
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
    (${applyGameConfigPrefill})(root, settings, (${presetIdFor})(settings, rules.presets), rules, ${JSON.stringify(TEMPLATE_TOKENS)}, (${previewStyleOf})(settings, rules));
  } catch (error) {}
})();`;
}
