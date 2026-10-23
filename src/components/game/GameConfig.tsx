'use client';

import { useState, useEffect, useRef, type CSSProperties, type MouseEvent } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import type { RoundSource } from '@/lib/analytics/events';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import RatingPreview from './RatingPreview';
import { useDailyState, type DailyState } from '@/hooks/useDailyState';
import { useTimeLeftText } from '@/hooks/useTimeLeftText';
import {
  DEFAULT_PRESET,
  GAME_CONFIG_RULES,
  presetIdFor,
  previewStyleOf,
  readPrefilledSettings,
  resolveGameSettings,
  TEMPLATE_TOKENS,
  type GameSettings,
} from '@/lib/game/configPrefill';
import {
  previewOrderOf,
  PREVIEW_POSITION,
  stepMemorizeTime,
  stepPieceCount,
  type StepDirection,
} from '@/lib/game/setupControls';
import { StaticBoard } from '@/components/round/BoardFigure';
import { BLINDFOLD_MODE, isBlindfoldSearch, MODE_PARAM } from '@/lib/game/roundLink';
import '@/components/round/round.css';

interface GameConfigProps {
  /** `blindfold` is passed only when the option is on, so a board round starts exactly as it always did. */
  readonly onStart?: (pieceCount: number, memorizeTime: number, source: RoundSource, blindfold?: true) => void;
}

/** The choice lives in the address, so a refresh, a shared link and the form after a round all keep it. */
function writeBlindfold(on: boolean): void {
  const url = new URL(window.location.href);
  if (on) url.searchParams.set(MODE_PARAM, BLINDFOLD_MODE);
  else url.searchParams.delete(MODE_PARAM);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

const { presets: DIFFICULTY_PRESETS } = GAME_CONFIG_RULES;

type SettingName = keyof GameSettings;

/** Shift on a computer jumps pieces by 5; study time already takes coarse steps above 10s. */
const COARSE_PIECE_STEP = 5;

const STEP: Record<SettingName, (value: number, direction: StepDirection, coarse: boolean) => number> = {
  pieceCount: (value, direction, coarse) => stepPieceCount(value, direction * (coarse ? COARSE_PIECE_STEP : 1)),
  memorizeTime: (value, direction) => stepMemorizeTime(value, direction),
};

const STEPPER_LABELS = {
  pieceCount: { label: 'config.pieceCount', fewer: 'config.fewerPieces', more: 'config.morePieces' },
  memorizeTime: { label: 'config.memorizeTime', fewer: 'config.lessTime', more: 'config.moreTime' },
} as const;

function DailyBoardLink() {
  const t = useTranslations('dailyEntry');
  const timeLeftText = useTimeLeftText();
  const daily = useDailyState();

  function labelOf(state: DailyState) {
    const timeLeft = timeLeftText(state.left);
    if (state.status === 'used') return t('next', { timeLeft });
    return t('ready', { pieceCount: state.setting.pieceCount, seconds: state.setting.memorizeTime, timeLeft });
  }

  return (
    <Link href="/daily" data-daily-entry={daily?.status ?? 'pending'} className="lab-btn lab-btn-secondary lab-config-daily">
      {daily ? labelOf(daily) : t('pending')}
    </Link>
  );
}

interface StepperProps {
  readonly name: SettingName;
  readonly value: number;
  readonly text: string;
  readonly template: string;
  readonly onStep: (name: SettingName, direction: StepDirection, coarse: boolean) => void;
}

// aria-disabled rather than disabled, so a keyboard press that reaches an end
// keeps focus on the button instead of dropping it to the page.
function Stepper({ name, value, text, template, onStep }: StepperProps) {
  const t = useTranslations('game');
  const labels = STEPPER_LABELS[name];
  const range = GAME_CONFIG_RULES[name];
  const button = (direction: StepDirection, atEnd: boolean, label: string, sign: string) => (
    <button
      type="button"
      className="lab-stepper-btn"
      aria-label={label}
      aria-disabled={atEnd}
      data-stepper={name}
      data-direction={direction}
      onClick={(event: MouseEvent) => !atEnd && onStep(name, direction, event.shiftKey)}
      suppressHydrationWarning
    >
      <span aria-hidden="true">{sign}</span>
    </button>
  );

  return (
    <div className="lab-stepper">
      <label htmlFor={name} className="lab-stepper-label">
        {t(labels.label)}
      </label>
      <div className="lab-stepper-row">
        {button(-1, value <= range.min, t(labels.fewer), '−')}
        <output id={name} aria-live="polite" className="lab-stepper-value" data-template={template} suppressHydrationWarning>
          {text}
        </output>
        {button(1, value >= range.max, t(labels.more), '+')}
      </div>
    </div>
  );
}

export default function GameConfig({ onStart }: GameConfigProps) {
  const t = useTranslations('game');
  const {
    startGame,
    gameState
  } = useGameStore();
  const [settings, setSettings] = useState<GameSettings>(readPrefilledSettings);
  const { pieceCount, memorizeTime } = settings;
  const [blindfold, setBlindfold] = useState(false);
  const selectedPreset = presetIdFor(settings, DIFFICULTY_PRESETS);
  const formRef = useRef<HTMLDivElement>(null);
  const [announceKey, setAnnounceKey] = useState(0);
  const announce = () => setAnnounceKey((key) => key + 1);

  // The first render starts from what the served form shows, Medium or the
  // layout script's prefill, so hydration matches the page as painted. The
  // remembered settings or a ?difficulty= preset are then applied here, read
  // from the live store because hydration renders with the store's
  // pre-storage snapshot. Read the live location rather than useSearchParams,
  // which would bail /game out of static rendering and leave the served HTML
  // without this form.
  useEffect(() => {
    delete formRef.current?.dataset.prefilled;
    const { pieceCount, memorizeTime } =
      resolveGameSettings(
        window.location.search,
        useGameStore.getState().lastSettings,
        GAME_CONFIG_RULES,
      ) ?? DEFAULT_PRESET;
    setSettings({ pieceCount, memorizeTime });
    setBlindfold(isBlindfoldSearch(window.location.search));
  }, []);

  function selectBoard(pieces: number, seconds: number) {
    setSettings({ pieceCount: pieces, memorizeTime: seconds });
    announce();
  }

  function step(name: SettingName, direction: StepDirection, coarse: boolean) {
    setSettings((current) => ({ ...current, [name]: STEP[name](current[name], direction, coarse) }));
    announce();
  }

  const handleStart = () =>
    blindfold
      ? (onStart ? onStart(pieceCount, memorizeTime, 'game_form', true) : startGame(pieceCount, memorizeTime, 'game_form', undefined, true))
      : (onStart ?? startGame)(pieceCount, memorizeTime, 'game_form');

  const toggleBlindfold = (on: boolean) => {
    setBlindfold(on);
    writeBlindfold(on);
  };

  const presetName = selectedPreset ? t(`presets.${selectedPreset}.label`) : t('config.customLabel');
  const summaryOf = (preset: string, pieces: number | string, seconds: number | string) =>
    t('config.summarySetting', { preset, setting: t('config.presetSummary', { pieces, seconds }) });

  return (
    <div
      ref={formRef}
      data-game-config
      suppressHydrationWarning
      className="lab-card lab-config"
    >
      <h1 className="lab-config-h">{t('config.title')}</h1>

      <div className="lab-config-group">
        <h2 id="config-presets" className="lab-config-label">{t('config.presetsLabel')}</h2>
        <div className="lab-config-presets" role="group" aria-labelledby="config-presets">
          {DIFFICULTY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => selectBoard(preset.pieceCount, preset.memorizeTime)}
              className="lab-preset"
              aria-pressed={selectedPreset === preset.id}
              aria-label={t(`presets.${preset.id}.label`)}
              data-preset={preset.id}
              data-name={t(`presets.${preset.id}.label`)}
              data-description={t(`presets.${preset.id}.description`)}
              suppressHydrationWarning
            >
              <span className="lab-preset-name">{t(`presets.${preset.id}.label`)}</span>
              <span className="lab-preset-short" aria-hidden="true">{t(`config.presetShort.${preset.id}`)}</span>
            </button>
          ))}
        </div>
        <p
          data-preset-description
          data-custom-label={t('config.customLabel')}
          suppressHydrationWarning
          className="lab-note lab-config-description"
        >
          {selectedPreset
            ? t(`presets.${selectedPreset}.description`)
            : t('config.customLabel')}
        </p>
      </div>

      <div
        className="lab-setup-preview"
        data-setup-preview
        role="img"
        aria-label={t('config.boardPreview', { count: pieceCount })}
        data-label-template={t('config.boardPreview', { count: TEMPLATE_TOKENS.pieceCount })}
        style={previewStyleOf(settings, GAME_CONFIG_RULES) as CSSProperties}
        suppressHydrationWarning
      >
        <div className="lab-setup-ring">
          <StaticBoard position={PREVIEW_POSITION} revealOrder={previewOrderOf} />
        </div>
      </div>

      <div className="lab-steppers">
        <Stepper
          name="pieceCount"
          value={pieceCount}
          text={String(pieceCount)}
          template={TEMPLATE_TOKENS.pieceCount}
          onStep={step}
        />
        <Stepper
          name="memorizeTime"
          value={memorizeTime}
          text={t('config.seconds', { seconds: memorizeTime })}
          template={t('config.seconds', { seconds: TEMPLATE_TOKENS.memorizeTime })}
          onStep={step}
        />
      </div>

      <div className="lab-config-group lab-config-mode">
        <input
          id="blindfold"
          type="checkbox"
          checked={blindfold}
          onChange={(event) => toggleBlindfold(event.target.checked)}
          aria-describedby="blindfold-hint"
          className="lab-config-check"
        />
        <label htmlFor="blindfold" className="lab-config-label">
          {t('config.blindfold')}
        </label>
        <p id="blindfold-hint" className="lab-note lab-config-mode-hint">
          {t('config.blindfoldHint')}
        </p>
      </div>

      {!blindfold && (
        <RatingPreview
          pieceCount={pieceCount}
          memorizeTime={memorizeTime}
          announceKey={announceKey}
          onSuggest={selectBoard}
          setting={
            <span
              data-template={summaryOf(TEMPLATE_TOKENS.preset, TEMPLATE_TOKENS.pieceCount, TEMPLATE_TOKENS.memorizeTime)}
              suppressHydrationWarning
            >
              {summaryOf(presetName, pieceCount, memorizeTime)}
            </span>
          }
        />
      )}

      <button type="button" onClick={handleStart} data-start-round className="lab-btn lab-btn-primary lab-config-start">
        {t('config.start')}
      </button>
      <DailyBoardLink />

      {gameState.completionTime !== undefined && (
        <p className="lab-note lab-config-last">
          {(() => {
            // Splitting the total, rather than rounding the fraction on its
            // own, is what keeps a time just under the next second from
            // printing as 12.1000.
            const totalMilliseconds = Math.round(gameState.completionTime * 1000);
            const seconds = Math.floor(totalMilliseconds / 1000);
            const milliseconds = (totalMilliseconds % 1000).toString().padStart(3, '0');
            return t('config.lastGame', {
              time: `${seconds}.${milliseconds}`,
              accuracy: gameState.accuracy ?? 0,
            });
          })()}
        </p>
      )}
    </div>
  );
}
