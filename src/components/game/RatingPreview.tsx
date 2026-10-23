'use client';

import { useId, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { ratingPreview, START_RATING, suggestBoard } from '@/lib/game/rating';
import { MEMORIZE_SECONDS_RANGE, PIECE_COUNT_RANGE } from '@/lib/reference/facts';
import { ratedFactsOf, useGameStore } from '@/lib/store/gameStore';

interface RatingPreviewProps {
  readonly pieceCount: number;
  readonly memorizeTime: number;
  /** Bumped when a stepper, a preset or the suggestion changes the board: the only moments the preview is announced. */
  readonly announceKey: number;
  readonly onSuggest: (pieceCount: number, memorizeTime: number) => void;
  /** The board in words ("Medium, 6 pcs / 10s"), leading the summary line. */
  readonly setting: ReactNode;
}

const RANGES = { pieces: PIECE_COUNT_RANGE, seconds: MEMORIZE_SECONDS_RANGE };

const subscribeNothing = () => () => {};

const num = (chunks: ReactNode) => <span className="lab-preview-num">{chunks}</span>;

const BLANK = '—';

export default function RatingPreview({ pieceCount, memorizeTime, announceKey, onSuggest, setting }: RatingPreviewProps) {
  const t = useTranslations('game.config.preview');
  const tConfig = useTranslations('game.config');
  const format = useFormatter();
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  // The rating lives in localStorage, which the served HTML and the hydration render cannot read, so both draw the
  // placeholder and the numbers follow in the next render, in the same boxes.
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const rating = useGameStore((state) => state.gameState.skillRating ?? START_RATING);
  const certainty = useGameStore((state) => state.certainty);
  const history = useGameStore((state) => state.history);
  const facts = useMemo(() => (hydrated && history ? ratedFactsOf(history) : null), [hydrated, history]);
  const player = { rating, ...certainty };

  const shown =
    facts === null
      ? null
      : {
          rating,
          suggested: suggestBoard(player, RANGES),
          ...ratingPreview(player, facts, { pieceCount, studySeconds: memorizeTime }),
        };
  const onSuggested = shown?.suggested.pieceCount === pieceCount && shown.suggested.studySeconds === memorizeTime;

  const showsLoss = shown !== null && shown.phase !== 'provisional';
  const figures = shown && {
    board: format.number(shown.difficultyRating),
    rating: format.number(shown.rating),
    expected: format.number(shown.expectedAccuracy),
    gain: format.number(shown.perfectGain),
  };
  const announcement = !shown
    ? ''
    : showsLoss
      ? t('announce', { ...figures, loss: format.number(Math.abs(shown.maxLoss)) })
      : t('announceProvisional', { ...figures });
  const [spoken, setSpoken] = useState({ key: announceKey, text: '' });
  if (spoken.key !== announceKey) setSpoken({ key: announceKey, text: announcement });

  const blank = <span className="lab-preview-num lab-preview-blank">{BLANK}</span>;

  return (
    <section className="lab-config-preview" data-rating-preview={shown ? shown.phase : 'pending'} aria-label={t('label')}>
      <div className="lab-preview-summary">
        <p className="lab-preview-line" data-preview-summary>
          {setting}
          {' · '}
          {t('summary', { board: figures ? figures.board : BLANK, expected: figures ? figures.expected : BLANK })}
        </p>
        <button
          type="button"
          className="lab-preview-toggle"
          aria-expanded={open}
          aria-controls={open ? detailsId : undefined}
          onClick={() => setOpen(!open)}
        >
          {t('details')}
        </button>
      </div>
      {open && (
        <div id={detailsId} className="lab-preview-details">
          <p className="lab-preview-phase">
            {shown ? t(shown.phase) : null}
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
            <div className="lab-preview-cell">
              <dt>{t('expected')}</dt>
              <dd data-preview="expected">{shown ? t.rich('percent', { value: format.number(shown.expectedAccuracy), num }) : blank}</dd>
            </div>
            <div className="lab-preview-cell">
              <dt>{t('suggested')}</dt>
              <dd data-preview="suggested">
                <button
                  type="button"
                  className="lab-preview-suggest"
                  disabled={!shown || onSuggested}
                  onClick={() => shown && onSuggest(shown.suggested.pieceCount, shown.suggested.studySeconds)}
                >
                  {shown ? tConfig('presetSummary', { pieces: shown.suggested.pieceCount, seconds: shown.suggested.studySeconds }) : blank}
                </button>
              </dd>
            </div>
            <div className={`lab-preview-cell lab-preview-gain${showsLoss ? '' : ' lab-preview-wide'}`}>
              <dt>{t('clear')}</dt>
              <dd data-preview="gain">{shown ? t.rich('gain', { value: format.number(shown.perfectGain), num }) : blank}</dd>
            </div>
            {showsLoss && (
              <div className="lab-preview-cell lab-preview-loss">
                <dt>{t('miss')}</dt>
                <dd data-preview="loss">{shown ? t.rich('loss', { value: format.number(Math.abs(shown.maxLoss)), num }) : blank}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {spoken.text}
      </p>
    </section>
  );
}
