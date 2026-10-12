'use client';

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import type { RoundSource } from '@/lib/analytics/events';
import { CoordinatesSwitch } from '@/components/settings/CoordinatesSwitch';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useDailyState, type DailyState } from '@/hooks/useDailyState';
import {
  MEMORIZE_SECONDS_RANGE,
  PIECE_COUNT_RANGE,
} from '@/lib/reference/facts';
import {
  DEFAULT_PRESET,
  GAME_CONFIG_RULES,
  type DifficultyPreset,
  presetIdFor,
  readPrefilledSettings,
  resolveGameSettings,
  VALUE_PLACEHOLDER,
} from '@/lib/game/configPrefill';

interface GameConfigProps {
  readonly onStart?: (pieceCount: number, memorizeTime: number, source: RoundSource) => void;
}

const { presets: DIFFICULTY_PRESETS } = GAME_CONFIG_RULES;

function DailyBoardLink() {
  const t = useTranslations('dailyEntry');
  const daily = useDailyState();

  function labelOf(state: DailyState) {
    const { hours, minutes } = state.left;
    const timeLeft = hours === 0 ? t('minutesLeft', { minutes }) : t('hoursLeft', { hours, minutes });
    if (state.status === 'used') return t('next', { timeLeft });
    return t('ready', { pieceCount: state.setting.pieceCount, seconds: state.setting.memorizeTime, timeLeft });
  }

  return (
    <Link href="/daily" data-daily-entry={daily?.status ?? 'pending'} className="lab-btn lab-btn-secondary lab-config-daily">
      {daily ? labelOf(daily) : t('pending')}
    </Link>
  );
}

const scaleOf = ({ min, max }: { min: number; max: number }) => [min, Math.round((min + max) / 2), max];

export default function GameConfig({ onStart }: GameConfigProps) {
  const t = useTranslations('game');
  const { 
    startGame, 
    gameState
  } = useGameStore();
  const [pieceCount, setPieceCount] = useState(() => readPrefilledSettings().pieceCount);
  const [memorizeTime, setMemorizeTime] = useState(() => readPrefilledSettings().memorizeTime);
  const selectedPreset = presetIdFor({ pieceCount, memorizeTime }, DIFFICULTY_PRESETS);
  const formRef = useRef<HTMLDivElement>(null);

  // The first render starts from what the served form shows, Medium or the
  // layout script's prefill, so hydration matches the page as painted. The
  // remembered settings or a ?difficulty= preset are then applied here, read
  // from the live store because hydration renders with the store's
  // pre-storage snapshot. Read the live location rather than useSearchParams,
  // which would bail /game out of static rendering and leave the served HTML
  // without this form.
  useEffect(() => {
    delete formRef.current?.dataset.prefilled;
    const settings =
      resolveGameSettings(
        window.location.search,
        useGameStore.getState().lastSettings,
        GAME_CONFIG_RULES,
      ) ?? DEFAULT_PRESET;
    setPieceCount(settings.pieceCount);
    setMemorizeTime(settings.memorizeTime);
  }, []);
  
  function handlePresetSelect(preset: DifficultyPreset) {
    setPieceCount(preset.pieceCount);
    setMemorizeTime(preset.memorizeTime);
  }
  
  const handleStart = () => (onStart ?? startGame)(pieceCount, memorizeTime, 'game_form');
  
  const fillOf = (value: number, range: { min: number; max: number }) =>
    ({ '--fill': `${((value - range.min) / (range.max - range.min)) * 100}%` }) as CSSProperties;

  return (
    <div
      ref={formRef}
      data-game-config
      suppressHydrationWarning
      className="lab-card lab-config"
    >
      <h1 className="lab-config-h">{t('config.title')}</h1>

      <div className="lab-config-group">
        <h2 className="lab-config-label">{t('config.presetsLabel')}</h2>
        <div className="lab-config-presets">
          {DIFFICULTY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="lab-preset"
              aria-pressed={selectedPreset === preset.id}
              data-preset={preset.id}
              data-description={t(`presets.${preset.id}.description`)}
              suppressHydrationWarning
            >
              <span className="lab-preset-name">{t(`presets.${preset.id}.label`)}</span>
              <span className="lab-preset-meta">
                {t('config.presetSummary', {
                  pieces: preset.pieceCount,
                  seconds: preset.memorizeTime,
                })}
              </span>
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

      <div className="lab-config-group">
        <div className="lab-config-row">
          <label htmlFor="pieceCount" className="lab-config-label">
            {t('config.pieceCount')}
          </label>
          <span
            data-value-for="pieceCount"
            data-template={VALUE_PLACEHOLDER}
            suppressHydrationWarning
            className="lab-config-value"
          >
            {pieceCount}
          </span>
        </div>
        <input
          id="pieceCount"
          type="range"
          min={PIECE_COUNT_RANGE.min}
          max={PIECE_COUNT_RANGE.max}
          step="1"
          value={pieceCount}
          onChange={(e) => {
            setPieceCount(parseInt(e.target.value));
          }}
          className="lab-range"
          style={fillOf(pieceCount, PIECE_COUNT_RANGE)}
          suppressHydrationWarning
        />
        <div className="lab-range-scale" aria-hidden="true">
          {scaleOf(PIECE_COUNT_RANGE).map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>

      <div className="lab-config-group">
        <div className="lab-config-row">
          <label htmlFor="memorizeTime" className="lab-config-label">
            {t('config.memorizeTime')}
          </label>
          <span
            data-value-for="memorizeTime"
            data-template={t('config.seconds', { seconds: VALUE_PLACEHOLDER })}
            suppressHydrationWarning
            className="lab-config-value"
          >
            {t('config.seconds', { seconds: memorizeTime })}
          </span>
        </div>
        <input
          id="memorizeTime"
          type="range"
          min={MEMORIZE_SECONDS_RANGE.min}
          max={MEMORIZE_SECONDS_RANGE.max}
          step="1"
          value={memorizeTime}
          onChange={(e) => {
            setMemorizeTime(parseInt(e.target.value));
          }}
          className="lab-range"
          style={fillOf(memorizeTime, MEMORIZE_SECONDS_RANGE)}
          suppressHydrationWarning
        />
        <div className="lab-range-scale" aria-hidden="true">
          {scaleOf(MEMORIZE_SECONDS_RANGE).map((tick) => (
            <span key={tick}>{t('config.seconds', { seconds: tick })}</span>
          ))}
        </div>
      </div>

      <div className="lab-config-group">
        <CoordinatesSwitch />
      </div>

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
