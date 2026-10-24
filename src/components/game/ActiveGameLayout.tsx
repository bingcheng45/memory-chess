'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useTranslations } from "next-intl";

import { MAX_BOARD_SIZE, MIN_BOARD_SIZE, MIN_ROW_WIDTH } from '@/lib/layout';

/**
 * The figures the round's layouts in game-lab.css read and that other code shares. The layouts themselves, their
 * rows and the board's side, live in the stylesheet, because only a media query can choose between them and the
 * board needs its size on the first painted frame.
 */
export const LAYOUT_INPUTS = {
  '--board-min': `${MIN_BOARD_SIZE}px`,
  '--board-max': `${MAX_BOARD_SIZE}px`,
  '--row-min': `${MIN_ROW_WIDTH}px`,
} as const;

interface ActiveGameLayoutProps {
  readonly status: ReactNode;
  readonly board: ReactNode;
  readonly controls: ReactNode;
}

/**
 * The shell shared by memorising and placing.
 *
 * It fills the height it is given and hands the board whatever the round's fixed rows leave over, so nothing has to
 * state how tall the rest of the screen is.
 */
export default function ActiveGameLayout({
  status,
  board,
  controls,
}: ActiveGameLayoutProps) {
  const t = useTranslations("game");

  return (
    <div className="lab-active-column" style={LAYOUT_INPUTS as CSSProperties}>
      <div className="lab-active-round">
        <section className="lab-active-status" aria-label={t("hud.status")}>
          {status}
        </section>
        <div className="lab-active-board" data-round-board>
          {board}
        </div>
        <section className="lab-active-controls" aria-label={t("hud.controls")}>
          {controls}
        </section>
      </div>
    </div>
  );
}
