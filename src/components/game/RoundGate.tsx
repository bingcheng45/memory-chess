'use client';

import { useEffect, useRef } from 'react';
import { useFormatter, useTranslations } from 'next-intl';

export type GateFacts =
  | { readonly kind: 'daily'; readonly day: string; readonly pieceCount: number; readonly memorizeTime: number }
  | { readonly kind: 'firstRound'; readonly pieceCount: number; readonly memorizeTime: number };

/** "Daily board · Wednesday, 14 October", in the board's own UTC day. */
export function useGateDate(gate: GateFacts | null): string | null {
  const t = useTranslations('daily.round');
  const format = useFormatter();
  if (gate?.kind !== 'daily') return null;
  const date = format.dateTime(Date.parse(`${gate.day}T00:00:00Z`), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return t('fig', { date });
}

interface RoundGateProps {
  /** Null for a replay, which counts in without the card or Start. */
  readonly facts: GateFacts | null;
  /** The second showing during the countdown; null before Start. */
  readonly count: number | null;
  /** False while the board is still being read, which holds Start. */
  readonly ready: boolean;
  readonly onStart: () => void;
}

/** Over the veiled board: what the board asks and Start, then the 3, 2, 1 that leads into study. */
export function RoundGate({ facts, count, ready, onStart }: RoundGateProps) {
  const t = useTranslations('daily.round');
  const tRound = useTranslations('game.round');
  const start = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ready) start.current?.focus();
  }, [ready]);

  if (count !== null) {
    return (
      <div className="round-gate">
        {/* Keyed, so each second's number is a new node and its entrance plays again. */}
        <span key={count} className="round-count" aria-hidden="true">
          {count}
        </span>
      </div>
    );
  }

  if (!facts) return null;

  return (
    <div className="round-gate">
      <div className="round-gate-card">
        {facts.kind === 'daily' ? (
          <>
            <p className="round-gate-facts">
              {t('pieces', { count: facts.pieceCount })} · {t('seconds', { count: facts.memorizeTime })}
            </p>
            <p className="round-gate-rule">{t('rule')}</p>
          </>
        ) : (
          <p className="round-gate-facts round-gate-intro">{tRound('intro', { count: facts.pieceCount, seconds: facts.memorizeTime })}</p>
        )}
        <button ref={start} type="button" className="lab-btn lab-btn-primary" disabled={!ready} aria-busy={!ready || undefined} onClick={onStart}>
          {facts.kind === 'daily' ? t('start') : tRound('start')}
        </button>
      </div>
    </div>
  );
}
