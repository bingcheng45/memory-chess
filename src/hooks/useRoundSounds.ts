import { useEffect } from 'react';
import { playSound, prepareSound, stopTimerSound, warmRoundSounds } from '@/lib/utils/soundEffects';
import type { RoundState } from '@/lib/round/round';

/** Late enough that the start sound has finished. */
export const TIMER_CUE_DELAY_MS = 500;
/** The share of the study time into placing at which the timer warns. */
const WARNING_SHARE = 0.75;

/**
 * The game's sounds, keyed on the round's phase changes: the start and the
 * timer cue when study begins, the end cue when the board clears, and a timer
 * warning once placing has taken three quarters of the study time. The result
 * screen plays its own success or failure sound. The round's sounds start
 * downloading once the round starts, so none of them waits on the network, and
 * the audio output is made while the page is idle, so the first tap does not.
 */
export function useRoundSounds(round: RoundState): void {
  const studyStartedAt = round.phase === 'study' ? round.startedAt : null;
  const rebuildStartedAt = round.phase === 'rebuild' ? round.log.startedAt : null;
  const studyMs = round.phase === 'idle' ? 0 : round.config.studyMs;
  const started = round.phase === 'countdown' || round.phase === 'study';

  useEffect(() => {
    prepareSound();
  }, []);

  useEffect(() => {
    if (started) warmRoundSounds();
  }, [started]);

  useEffect(() => {
    if (studyStartedAt === null) return;
    playSound('success');
    const cue = setTimeout(() => playSound('timer'), TIMER_CUE_DELAY_MS);
    return () => clearTimeout(cue);
  }, [studyStartedAt]);

  useEffect(() => {
    if (rebuildStartedAt === null) return;
    stopTimerSound();
    playSound('timerEnd');
    const warnAtMs = Math.floor((studyMs / 1000) * WARNING_SHARE) * 1000;
    const warning = setTimeout(
      () => playSound('timer'),
      Math.max(0, warnAtMs - (performance.now() - rebuildStartedAt)),
    );
    return () => {
      clearTimeout(warning);
      stopTimerSound();
    };
  }, [rebuildStartedAt, studyMs]);
}
