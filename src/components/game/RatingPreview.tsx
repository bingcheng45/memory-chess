'use client';

import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { PLACEMENT_ROUNDS, ratingPreview, START_RATING } from '@/lib/game/rating';
import { ratedFactsOf, useGameStore } from '@/lib/store/gameStore';

interface RatingPreviewProps {
  readonly pieceCount: number;
  readonly memorizeTime: number;
  /** Bumped when a slider is released or a preset picked: the only moments the preview is announced. */
  readonly announceKey: number;
}

const subscribeNothing = () => () => {};

const num = (chunks: ReactNode) => <span className="lab-preview-num">{chunks}</span>;

export default function RatingPreview({ pieceCount, memorizeTime, announceKey }: RatingPreviewProps) {
  const t = useTranslations('game.config.preview');
  const format = useFormatter();
  // The rating lives in localStorage, which the served HTML and the hydration render cannot read, so both draw the
  // placeholder and the numbers follow in the next render, in the same boxes.
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const rating = useGameStore((state) => state.gameState.skillRating ?? START_RATING);
  const history = useGameStore((state) => state.history);
  const facts = useMemo(() => (hydrated && history ? ratedFactsOf(history) : null), [hydrated, history]);

  const shown =
    facts === null
      ? null
      : {
          rating,
          round: facts.length + 1,
          ...ratingPreview(rating, facts, { pieceCount, studySeconds: memorizeTime }),
        };

  const announcement = shown
    ? t('announce', {
        board: format.number(shown.difficultyRating),
        rating: format.number(shown.rating),
        gain: format.number(shown.perfectGain),
        loss: format.number(Math.abs(shown.maxLoss)),
      })
    : '';
  const [announced, setAnnounced] = useState({ key: announceKey, text: '' });
  if (announced.key !== announceKey) setAnnounced({ key: announceKey, text: announcement });

  const blank = <span className="lab-preview-num lab-preview-blank">—</span>;

  return (
    <section className="lab-config-preview" data-rating-preview={shown ? shown.phase : 'pending'} aria-label={t('label')}>
      <p className="lab-preview-phase">
        {shown?.phase === 'placement' ? t('placement', { round: shown.round, of: PLACEMENT_ROUNDS }) : shown ? t('rated') : null}
      </p>
      <dl className="lab-preview-grid">
        <div className="lab-preview-cell">
          <dt>{t('board')}</dt>
          <dd data-preview="board">{shown ? num(format.number(shown.difficultyRating)) : blank}</dd>
        </div>
        <div className="lab-preview-cell">
          <dt>{t('yours')}</dt>
          <dd data-preview="rating">{shown ? num(format.number(shown.rating)) : blank}</dd>
        </div>
        <div className="lab-preview-cell lab-preview-gain">
          <dt>{t('clear')}</dt>
          <dd data-preview="gain">{shown ? t.rich('gain', { value: format.number(shown.perfectGain), num }) : blank}</dd>
        </div>
        <div className="lab-preview-cell lab-preview-loss">
          <dt>{t('miss')}</dt>
          <dd data-preview="loss">{shown ? t.rich('loss', { value: format.number(Math.abs(shown.maxLoss)), num }) : blank}</dd>
        </div>
      </dl>
      <p className="sr-only" aria-live="polite">
        {announced.text}
      </p>
    </section>
  );
}
