'use client';

import { useCallback } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useGameStore } from '@/lib/store/gameStore';
import type { RoundState } from '@/lib/round/round';
import { ROUND_CONTROLS } from '@/lib/round/controls';
import { RefusalAnnouncement, RoundBoard, RoundPalette } from '@/components/round/RoundBoard';
import { RoundPrimaryControl, RoundRestartControl } from '@/components/round/RoundControls';
import { StudyNotation } from '@/components/round/StudyNotation';
import { clockFace, RoundHead } from '@/components/round/RoundHead';
import { useCountdown } from '@/components/round/useCountdown';
import { usePreloadPieces } from '@/components/round/usePreloadPieces';
import { useStudyDeadline } from '@/components/round/useStudyDeadline';
import ActiveGameLayout from './ActiveGameLayout';
import { RoundGate, useGateDate, type GateFacts } from './RoundGate';

const COPY = 'game.round';

/** `idle` only while a set board is being read behind its Start button; a replay counts in without one. */
export type ActiveRoundState = Extract<RoundState, { phase: 'idle' | 'ready' | 'countdown' | 'study' | 'rebuild' }>;

interface ActiveRoundProps {
  readonly round: ActiveRoundState;
  /** What the board behind the Start button asks, while the round waits on it. */
  readonly gate: GateFacts | null;
  readonly onStart: () => void;
  readonly onRestart: () => void;
  readonly onSubmit: () => void;
  /** Back to the configuration form, the round dropped. */
  readonly onLeave: () => void;
}

/** Memorising and placing, and a set board's wait before them: the shared round, drawn in the pinned layout the board is sized to. */
export default function ActiveRound({ round, gate, onStart, onRestart, onSubmit, onLeave }: ActiveRoundProps) {
  const t = useTranslations(COPY);
  const tDaily = useTranslations('daily.round');
  const gateDate = useGateDate(gate);
  const dispatch = useGameStore((state) => state.dispatch);
  const endCountdown = useGameStore((state) => state.endCountdown);
  const onStudyEnded = useCallback((now: number) => dispatch({ type: 'studyEnded', now }), [dispatch]);
  useStudyDeadline(round, onStudyEnded);
  const count = useCountdown(round.phase === 'countdown' ? round.endsAt : null, endCountdown);
  usePreloadPieces(round.phase === 'ready' || round.phase === 'countdown' ? round.fen : null);
  const veiled = round.phase === 'idle' || round.phase === 'ready' || round.phase === 'countdown';
  const studyMs = round.phase === 'idle' ? (gate?.memorizeTime ?? 0) * 1000 : round.config.studyMs;
  const controlsPhase = round.phase === 'idle' ? 'ready' : round.phase;
  const notation = round.phase === 'study' && round.config.blindfold ? round.target : null;
  const boardHidden = veiled || notation !== null;
  const press = { start: onRestart, endStudy: () => onStudyEnded(performance.now()), submit: onSubmit };

  const heading = veiled ? (gateDate ?? t('phaseStudy')) : round.phase === 'study' ? t('phaseStudy') : t('phaseRebuild');
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
            lead={
              <button type="button" className="lab-icon-btn lab-leave" aria-label={t('leave')} title={t('leave')} onClick={onLeave}>
                <X size={20} aria-hidden="true" />
              </button>
            }
            trail={<RoundRestartControl phase={controlsPhase} copy={COPY} press={press} />}
          />
        }
        board={
          <div className="round-stage" data-veiled={veiled || undefined}>
            {/* The empty board under the veil is a picture of what comes, not something to read square by square. */}
            <div className="round-stage-board" aria-hidden={boardHidden || undefined} inert={boardHidden || undefined}>
              <RoundBoard state={round} dispatch={dispatch} copy={COPY} />
            </div>
            {notation && <StudyNotation position={notation} />}
            {veiled && <RoundGate facts={gate} count={round.phase === 'countdown' ? count : null} ready={round.phase === 'ready'} onStart={onStart} />}
          </div>
        }
        controls={
          <div className="lab-game-controls">
            <RoundPalette state={round} dispatch={dispatch} copy={COPY} />
            <RoundPrimaryControl phase={controlsPhase} copy={COPY} press={press} />
          </div>
        }
      />
      <p className="lab-sr" aria-live="polite">
        {announcement}
        <RefusalAnnouncement state={round} copy={COPY} />
      </p>
    </>
  );
}
