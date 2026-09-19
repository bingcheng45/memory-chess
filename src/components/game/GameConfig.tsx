'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import {
  MEMORIZE_SECONDS_RANGE,
  PIECE_COUNT_RANGE,
} from '@/lib/reference/facts';
import {
  DEFAULT_PRESET,
  GAME_CONFIG_RULES,
  type DifficultyPreset,
  presetIdFor,
  resolveGameSettings,
  VALUE_PLACEHOLDER,
} from '@/lib/game/configPrefill';

interface GameConfigProps {
  readonly onStart?: (pieceCount: number, memorizeTime: number) => void;
}

const { presets: DIFFICULTY_PRESETS } = GAME_CONFIG_RULES;

export default function GameConfig({ onStart }: GameConfigProps) {
  const t = useTranslations('game');
  const { 
    startGame, 
    gameState
  } = useGameStore();
  const [pieceCount, setPieceCount] = useState(DEFAULT_PRESET.pieceCount);
  const [memorizeTime, setMemorizeTime] = useState(DEFAULT_PRESET.memorizeTime);
  const selectedPreset = presetIdFor({ pieceCount, memorizeTime }, DIFFICULTY_PRESETS);
  const lastSettings = useGameStore((state) => state.lastSettings);

  // Both sources are applied after mount rather than as initial state: the
  // served HTML is Medium, and starting the first client render anywhere else
  // would be a hydration mismatch. Read ?difficulty= off the live location
  // rather than via useSearchParams, which would bail /game out of static
  // rendering and leave the served HTML without this form.
  useEffect(() => {
    const settings = resolveGameSettings(window.location.search, lastSettings, GAME_CONFIG_RULES);
    if (settings) {
      setPieceCount(settings.pieceCount);
      setMemorizeTime(settings.memorizeTime);
    }
  }, [lastSettings]);
  
  function handlePresetSelect(preset: DifficultyPreset) {
    setPieceCount(preset.pieceCount);
    setMemorizeTime(preset.memorizeTime);
  }
  
  const handleStart = () => {
    if (onStart) {
      onStart(pieceCount, memorizeTime);
    } else {
      startGame(pieceCount, memorizeTime);
    }
  };
  
  const sliderStyle = (value: number, range: { min: number; max: number }) => ({
    '--fill': `${((value - range.min) / (range.max - range.min)) * 100}%`,
    backgroundImage: 'linear-gradient(to right, #FFB380 0%, #FFB380 var(--fill), #222222 var(--fill), #222222 100%)',
  }) as CSSProperties;

  return (
    <div
      data-game-config
      suppressHydrationWarning
      className="w-full max-w-md md:max-w-lg mx-auto rounded-xl border border-bg-light bg-bg-card p-5 sm:p-7 shadow-xl"
    >
      <h2 className="mb-5 text-center text-2xl font-bold text-text-primary">{t('config.title')}</h2>
      
      <div className="mb-5">
        <h3 className="mb-3 text-sm font-medium text-text-secondary">{t('config.presetsLabel')}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DIFFICULTY_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              onClick={() => handlePresetSelect(preset)}
              variant={selectedPreset === preset.id ? "secondary" : "ghost"}
              className={`flex h-auto flex-col items-center justify-center p-2.5 transition-all duration-200 ease-in-out border ${
                selectedPreset === preset.id
                  ? 'border-peach-500 bg-peach-500/20 text-text-primary shadow-sm hover:bg-peach-500/25 hover:border-peach-500/70' 
                  : 'border-transparent text-text-secondary hover:border-peach-500/30 hover:bg-peach-500/15 hover:text-white hover:shadow-sm'
              }`}
              aria-pressed={selectedPreset === preset.id}
              data-preset={preset.id}
              data-description={t(`presets.${preset.id}.description`)}
              suppressHydrationWarning
            >
              <span className="font-medium">{t(`presets.${preset.id}.label`)}</span>
              <div className="mt-1 text-xs opacity-70">
                {t('config.presetSummary', {
                  pieces: preset.pieceCount,
                  seconds: preset.memorizeTime,
                })}
              </div>
            </Button>
          ))}
        </div>
        <div
          data-preset-description
          data-custom-label={t('config.customLabel')}
          suppressHydrationWarning
          className="mt-2 text-xs text-text-muted"
        >
          {selectedPreset
            ? t(`presets.${selectedPreset}.description`)
            : t('config.customLabel')}
        </div>
      </div>
      
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <label htmlFor="pieceCount" className="text-sm font-medium text-text-secondary">
            {t('config.pieceCount')}
          </label>
          <span
            data-value-for="pieceCount"
            data-template={VALUE_PLACEHOLDER}
            suppressHydrationWarning
            className="rounded-full bg-peach-500 px-3 py-1 text-sm font-bold text-bg-dark"
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
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-bg-light
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-peach-500 [&::-webkit-slider-thumb]:mt-[-1.5px]
                     [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 
                     [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-peach-500 [&::-moz-range-thumb]:border-0"
          style={sliderStyle(pieceCount, PIECE_COUNT_RANGE)}
          suppressHydrationWarning
        />
        <div className="mt-4 flex justify-between text-xs text-text-muted">
          <span>2</span>
          <span>17</span>
          <span>32</span>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <label htmlFor="memorizeTime" className="text-sm font-medium text-text-secondary">
            {t('config.memorizeTime')}
          </label>
          <span
            data-value-for="memorizeTime"
            data-template={t('config.seconds', { seconds: VALUE_PLACEHOLDER })}
            suppressHydrationWarning
            className="rounded-full bg-peach-500 px-3 py-1 text-sm font-bold text-bg-dark"
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
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-bg-light
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-peach-500 [&::-webkit-slider-thumb]:mt-[-1.5px]
                     [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 
                     [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-peach-500 [&::-moz-range-thumb]:border-0"
          style={sliderStyle(memorizeTime, MEMORIZE_SECONDS_RANGE)}
          suppressHydrationWarning
        />
        <div className="mt-4 flex justify-between text-xs text-text-muted">
          <span>{t('config.seconds', { seconds: 2 })}</span>
          <span>{t('config.seconds', { seconds: 17 })}</span>
          <span>{t('config.seconds', { seconds: 32 })}</span>
        </div>
      </div>
      
      <Button
        onClick={handleStart}
        variant="outline"
        size="sm"
        className="w-full bg-peach-500/10 text-peach-500 hover:text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5 text-sm"
      >
        {t('config.start')}
      </Button>
      
      {gameState.completionTime !== undefined && (
        <div className="mt-4 text-center text-sm text-text-secondary">
          <p>
            {(() => {
              const seconds = Math.floor(gameState.completionTime);
              const milliseconds = Math.round((gameState.completionTime - seconds) * 1000)
                .toString()
                .padStart(3, '0');
              return t('config.lastGame', {
                time: `${seconds}.${milliseconds}`,
                accuracy: gameState.accuracy ?? 0,
              });
            })()}
          </p>
        </div>
      )}
    </div>
  );
} 