"use client";

import { useEffect, useState } from "react";
import { WoodenBoard, WoodenDie, WoodenPeg } from "./WoodenSet";
import { FRAMES, HOLES, VIEW, pegPose, type Player } from "./woodenGame";

const STEP_MS = 3200;
const LAST = FRAMES.length - 1;
const PLAYERS: readonly Player[] = [0, 1];
const TRAY_Y: Record<Player, number> = { 0: 46, 1: 186 };

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function WoodenGameDemo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frame = FRAMES[step];

  useEffect(() => {
    setPlaying(!prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (step === LAST) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStep(step + 1), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, step]);

  const go = (target: number) => {
    setPlaying(false);
    setStep(Math.min(LAST, Math.max(0, target)));
  };

  const toggle = () => {
    if (!playing && step === LAST) setStep(0);
    setPlaying(!playing);
  };

  return (
    <div className="wg-demo">
      <svg className="wg-art" viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} aria-hidden="true">
        <WoodenBoard />
        {PLAYERS.map((player) => (
          <g key={player} className="wg-tray" data-active={frame.turn === player} data-winner={frame.winner === player}>
            <rect x={334} y={TRAY_Y[player]} width={132} height={92} rx={10} />
            <rect className="wg-tray-win" x={334} y={TRAY_Y[player]} width={132} height={92} rx={10} />
            <text x={344} y={TRAY_Y[player] - 8}>
              Player {player + 1}
            </text>
            <circle className="wg-turn" cx={440} cy={TRAY_Y[player] - 12} r={4} />
          </g>
        ))}
        <WoodenDie color={frame.die} rolls={frame.rolls} />
        {HOLES.map((_, id) => (
          <WoodenPeg key={id} id={id} pose={pegPose(id, frame.places[id], frame.showAll)} />
        ))}
      </svg>
      <div className="wg-below">
        <p className="wg-caption" aria-live="polite">
          <span className="wg-count">
            {step + 1} / {FRAMES.length}
          </span>{" "}
          {frame.caption}
        </p>
        <div className="wg-controls">
          <button type="button" className="lab-btn lab-btn-secondary lab-btn-sm" onClick={() => go(step - 1)} disabled={step === 0}>
            Previous
          </button>
          <button type="button" className="lab-btn lab-btn-secondary lab-btn-sm" onClick={toggle} aria-pressed={playing}>
            {playing ? "Pause" : step === LAST ? "Replay" : "Play"}
          </button>
          <button type="button" className="lab-btn lab-btn-secondary lab-btn-sm" onClick={() => go(step + 1)} disabled={step === LAST}>
            Next
          </button>
          <ol className="wg-dots">
            {FRAMES.map((_, index) => (
              <li key={index}>
                <button
                  type="button"
                  aria-label={`Step ${index + 1} of ${FRAMES.length}`}
                  aria-current={index === step ? "step" : undefined}
                  onClick={() => go(index)}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
