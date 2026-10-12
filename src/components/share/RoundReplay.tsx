"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BOARD_SQUARES } from "@/lib/game/board";
import { isDarkSquare } from "@/lib/round/round";
import {
  advance,
  markCounts,
  phaseSeconds,
  piecesDown,
  replayBoard,
  replayPhases,
  REPLAY_START,
  type ReplayCursor,
  type ReplayPhase,
  type ReplayRound,
} from "@/lib/share/replay";
import type { SharedRound } from "@/lib/share/sharePage";
import { BoardFigure, PieceImage } from "@/components/round/BoardFigure";
import "@/components/round/round.css";

const SPEEDS = [1, 2, 4] as const;
type Speed = (typeof SPEEDS)[number];
const DEFAULT_SPEED: Speed = 2;
/** A tab in the background gets no frames; on its return the replay picks up where it was instead of leaping on. */
const MAX_FRAME_SECONDS = 0.25;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const PHASE_NAME: Record<ReplayPhase, string> = { study: "Study", clear: "Clear", rebuild: "Rebuild", scored: "Score" };
const seconds = (value: number) => `${value.toFixed(1)} s`;

function usePlayback(round: ReplayRound) {
  const [cursor, setCursor] = useState<ReplayCursor>(REPLAY_START);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(DEFAULT_SPEED);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const step = Math.min((now - last) / 1000, MAX_FRAME_SECONDS) * speed;
      last = now;
      setCursor((current) => advance(round, current, step));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, round]);

  useEffect(() => {
    if (cursor.phase === "scored") setPlaying(false);
  }, [cursor.phase]);

  const play = useCallback(() => {
    setCursor((current) => (current.phase === "scored" ? REPLAY_START : current));
    setPlaying(true);
  }, []);
  const replay = useCallback(() => {
    setCursor(REPLAY_START);
    setPlaying(true);
  }, []);
  /** Playing, a step starts the phase; paused, it shows the phase as it ended, the rebuild with every piece down. */
  const go = (phase: ReplayPhase) => setCursor({ phase, elapsed: playing ? 0 : phaseSeconds(round, phase) });

  return { cursor, playing, speed, setSpeed, play, pause: () => setPlaying(false), replay, go };
}

/** Plays itself once, the first time it comes into view, unless the visitor asked for less motion. */
function useAutoplay(play: () => void) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined" || window.matchMedia(REDUCED_MOTION).matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      play();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [play]);
  return ref;
}

const Time = ({ value }: { value: number }) => <span className="lab-mono">{seconds(value)}</span>;

function Clock({ round, cursor: { phase, elapsed } }: { round: ReplayRound; cursor: ReplayCursor }) {
  if (phase === "clear") return "Board cleared";
  if (phase === "scored") return <>Rebuilt in <Time value={round.rebuildSeconds} /></>;
  return <><Time value={elapsed} /> of <Time value={phase === "study" ? round.studySeconds : round.rebuildSeconds} /></>;
}

function captionText(round: ReplayRound, cursor: ReplayCursor): string {
  const order = round.board.order ?? [];
  const { correct, missed, wrong } = markCounts(round.board);
  switch (cursor.phase) {
    case "study":
      return `The position as it was studied, for ${seconds(round.studySeconds)}.`;
    case "clear":
      return round.board.order ? "The board is cleared, and the rebuild starts from memory." : "The board is cleared. This round's link carries no order of play, so the replay goes to the score.";
    case "rebuild":
      return `Pieces go down in the order they were placed, numbered: ${piecesDown(round, cursor).length} of ${order.length}.`;
    case "scored":
      return `Scored: ${correct} correct, ${missed} missed, ${wrong} wrong.`;
  }
}

function ReplayBoard({ round, cursor }: { round: ReplayRound; cursor: ReplayCursor }) {
  const squares = replayBoard(round, cursor);
  return (
    <BoardFigure>
      <div className="lab-board" aria-hidden="true">
        {BOARD_SQUARES.map((square, index) => {
          const { piece, ghost, mark, turn } = squares[square];
          return (
            <div key={square} className="lab-cell" data-dark={isDarkSquare(index) || undefined} data-mark={mark}>
              {piece && <PieceImage piece={piece} />}
              {ghost && <PieceImage piece={ghost} state="ghost" />}
              {turn !== undefined && <span className="lab-replay-turn">{turn}</span>}
            </div>
          );
        })}
      </div>
    </BoardFigure>
  );
}

function Legend({ round, legend, shown }: { round: ReplayRound; legend: SharedRound["legend"]; shown: boolean }) {
  const counts = markCounts(round.board);
  return (
    <ul className="lab-replay-legend" aria-label="Marks on the scored board" style={shown ? undefined : { visibility: "hidden" }}>
      {(["correct", "missed", "wrong"] as const).map((mark) => (
        <li key={mark}>
          <i data-mark={mark} aria-hidden="true" />
          {legend[mark]} <b className="lab-mono">{counts[mark]}</b>
        </li>
      ))}
    </ul>
  );
}

interface RoundReplayProps {
  readonly round: SharedRound;
}

/** The shared round played back from its link: study, the cleared board, the rebuild in its order, then the score. */
export function RoundReplay({ round: { replay: round, legend } }: RoundReplayProps) {
  const playback = usePlayback(round);
  const ref = useAutoplay(playback.play);
  const { cursor, playing } = playback;
  const phases = replayPhases(round);
  const at = phases.indexOf(cursor.phase);

  return (
    <section ref={ref} className="lab-replay lab-plate lab-plate-grid" aria-labelledby="lab-replay-title">
      <div className="lab-replay-head">
        <h2 id="lab-replay-title">The round, replayed.</h2>
        <p className="lab-replay-clock">
          <span className="lab-replay-phase" aria-live="polite">
            {PHASE_NAME[cursor.phase]}
          </span>
          <span>
            <Clock round={round} cursor={cursor} />
          </span>
        </p>
      </div>
      <ReplayBoard round={round} cursor={cursor} />
      <p className="lab-replay-caption">{captionText(round, cursor)}</p>
      <Legend round={round} legend={legend} shown={cursor.phase === "scored"} />
      <div className="lab-replay-controls">
        <button type="button" className="lab-btn lab-btn-secondary lab-btn-sm" aria-label="Previous phase" disabled={at === 0} onClick={() => playback.go(phases[at - 1])}>
          ‹
        </button>
        <button type="button" className="lab-btn lab-btn-primary lab-btn-sm lab-replay-play" onClick={playing ? playback.pause : playback.play}>
          {playing ? "Pause" : "Play"}
        </button>
        <button type="button" className="lab-btn lab-btn-secondary lab-btn-sm" aria-label="Next phase" disabled={at === phases.length - 1} onClick={() => playback.go(phases[at + 1])}>
          ›
        </button>
        <button type="button" className="lab-btn lab-btn-secondary lab-btn-sm" onClick={playback.replay}>
          Replay
        </button>
        <div className="lab-replay-speed" role="group" aria-label="Replay speed">
          {SPEEDS.map((speed) => (
            <button key={speed} type="button" aria-pressed={playback.speed === speed} onClick={() => playback.setSpeed(speed)}>
              {speed}×
            </button>
          ))}
        </div>
      </div>
      <ol className="lab-replay-phases" aria-label="Phases">
        {phases.map((phase, index) => (
          <li key={phase}>
            <button type="button" data-state={index < at ? "past" : index === at ? "now" : undefined} aria-current={index === at ? "step" : undefined} onClick={() => playback.go(phase)}>
              {PHASE_NAME[phase]}
            </button>
          </li>
        ))}
      </ol>
      <p className="lab-replay-note">Clocks show the round&apos;s own seconds, played at {playback.speed}× speed.</p>
    </section>
  );
}
