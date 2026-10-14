'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useGameStore } from '@/lib/store/gameStore';
import type { RoundState } from '@/lib/round/round';
import { ROUND_CONTROLS } from '@/lib/round/controls';
import { RefusalAnnouncement, RoundBoard, RoundPalette } from '@/components/round/RoundBoard';
import { RoundControls } from '@/components/round/RoundControls';
import { clockFace, RoundHead } from '@/components/round/RoundHead';
import { useCountdown } from '@/components/round/useCountdown';
import { usePreloadPieces } from '@/components/round/usePreloadPieces';
import { useStudyDeadline } from '@/components/round/useStudyDeadline';
import ActiveGameLayout from './ActiveGameLayout';
import { RoundGate, useGateDate, type GateFacts } from './RoundGate';

const COPY = 'game.round';

/** `idle` only while a set board is being read behind its Start button. */
export type ActiveRoundState = Extract<RoundState, { phase: 'idle' | 'ready' | 'countdown' | 'study' | 'rebuild' }>;

interface ActiveRoundProps {
  readonly round: ActiveRoundState;
  /** What the board behind the Start button asks, while the round waits on it. */
  readonly gate: GateFacts | null;
  readonly onStart: () => void;
  readonly onRestart: () => void;
  readonly onSubmit: () => void;
}

/** Memorising and placing, and a set board's wait before them: the shared round, drawn in the pinned layout the board is sized to. */
export default function ActiveRound({ round, gate, onStart, onRestart, onSubmit }: ActiveRoundProps) {
  const t = useTranslations(COPY);
  const tDaily = useTranslations('daily.round');
  const gateDate = useGateDate(gate);
  const dispatch = useGameStore((state) => state.dispatch);
  const endCountdown = useGameStore((state) => state.endCountdown);
  const onStudyEnded = useCallback((now: number) => dispatch({ type: 'studyEnded', now }), [dispatch]);
  useStudyDeadline(round, onStudyEnded);
  const count = useCountdown(round.phase === 'countdown' ? round.endsAt : null, endCountdown);
  usePreloadPieces(round.phase === 'ready' ? round.config.board.fen : round.phase === 'countdown' ? round.fen : null);
  const veiled = round.phase === 'idle' || round.phase === 'ready' || round.phase === 'countdown';
  const studyMs = round.phase === 'idle' ? (gate?.memorizeTime ?? 0) * 1000 : round.config.studyMs;
  const controlsPhase = round.phase === 'idle' ? 'ready' : round.phase;

  const heading = veiled ? gateDate : round.phase === 'study' ? t('phaseStudy') : t('phaseRebuild');
  const announcement =
    round.phase === 'countdown' && count !== null
      ? tDaily('countdown', { count })
      : round.phase === 'study'
        ? t('liveStudy', { memorizeSeconds: studyMs / 1000 })
        : round.phase === 'rebuild'
          ? t('liveRebuild')
          : null;

  return (
    <>
      <ActiveGameLayout
        status={
          <RoundHead
            heading={heading}
            face={clockFace(round, studyMs)}
            clearEnabled={ROUND_CONTROLS[controlsPhase].clearEnabled}
            onClear={() => dispatch({ type: 'clear' })}
            copy={COPY}
          />
        }
        board={
          <div className="round-stage" data-veiled={veiled || undefined}>
            {/* The empty board under the veil is a picture of what comes, not something to read square by square. */}
            <div className="round-stage-board" aria-hidden={veiled || undefined} inert={veiled || undefined}>
              <RoundBoard state={round} dispatch={dispatch} copy={COPY} />
            </div>
            {veiled && gate && <RoundGate facts={gate} count={round.phase === 'countdown' ? count : null} ready={round.phase === 'ready'} onStart={onStart} />}
          </div>
        }
        controls={
          <>
            <RoundPalette state={round} dispatch={dispatch} copy={COPY} />
            <div className="lab-cal-actions">
              <RoundControls
                phase={controlsPhase}
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
        {announcement}
        <RefusalAnnouncement state={round} copy={COPY} />
      </p>
    </>
  );
}
