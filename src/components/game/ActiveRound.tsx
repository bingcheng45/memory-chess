'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useGameStore } from '@/lib/store/gameStore';
import type { RoundState } from '@/lib/round/round';
import { ROUND_CONTROLS } from '@/lib/round/controls';
import { RefusalAnnouncement, RoundBoard, RoundPalette } from '@/components/round/RoundBoard';
import { RoundControls } from '@/components/round/RoundControls';
import { clockFace, RoundHead } from '@/components/round/RoundHead';
import { useStudyDeadline } from '@/components/round/useStudyDeadline';
import ActiveGameLayout from './ActiveGameLayout';

const COPY = 'game.round';

type ActiveRoundState = Extract<RoundState, { phase: 'study' | 'rebuild' }>;

interface ActiveRoundProps {
  readonly round: ActiveRoundState;
  readonly onRestart: () => void;
  readonly onSubmit: () => void;
}

/** Memorising and placing: the shared round, drawn in the pinned layout the board is sized to. */
export default function ActiveRound({ round, onRestart, onSubmit }: ActiveRoundProps) {
  const t = useTranslations(COPY);
  const dispatch = useGameStore((state) => state.dispatch);
  const onStudyEnded = useCallback((now: number) => dispatch({ type: 'studyEnded', now }), [dispatch]);
  useStudyDeadline(round, onStudyEnded);
  const studySeconds = round.config.studyMs / 1000;

  return (
    <>
      <ActiveGameLayout
        status={
          <RoundHead
            heading={round.phase === 'study' ? t('phaseStudy') : t('phaseRebuild')}
            face={clockFace(round, round.config.studyMs)}
            clearEnabled={ROUND_CONTROLS[round.phase].clearEnabled}
            onClear={() => dispatch({ type: 'clear' })}
            copy={COPY}
          />
        }
        board={<RoundBoard state={round} dispatch={dispatch} copy={COPY} />}
        controls={
          <>
            <RoundPalette state={round} dispatch={dispatch} copy={COPY} />
            <div className="lab-cal-actions">
              <RoundControls
                phase={round.phase}
                copy={COPY}
                press={{
                  start: onRestart,
                  endStudy: () => onStudyEnded(performance.now()),
                  submit: onSubmit,
                }}
              />
            </div>
          </>
        }
      />
      <p className="lab-sr" aria-live="polite">
        {round.phase === 'study' ? t('liveStudy', { memorizeSeconds: studySeconds }) : t('liveRebuild')}
        <RefusalAnnouncement state={round} copy={COPY} />
      </p>
    </>
  );
}
