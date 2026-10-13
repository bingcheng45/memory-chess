'use client';

import type { ReactNode } from 'react';
import { useTranslations } from "next-intl";

import { MAX_BOARD_SIZE, MIN_BOARD_SIZE, MIN_ROW_WIDTH } from '@/lib/layout';

/**
 * Height of the row above the board: the phase, the clock, the eraser and the
 * study meter. The eraser sets it, 40px, plus an 8px gap and the 4px meter.
 */
const STATUS_ROW_HEIGHT = 'h-14 sm:h-14';

/**
 * Height of the row below the board: two rows of 44px palette buttons, the
 * round's two 44px buttons, and the gaps, in both phases.
 *
 * Both rows are fixed rather than sized by their contents so the board does
 * not move when the phase changes. See the note in the markup below.
 */
const CONTROLS_ROW_HEIGHT = 'h-[156px] sm:h-[156px]';

/**
 * The two rows above as numbers, and the gap between the three children.
 *
 * The classes above are what the browser reads; these are the same figures in
 * a form the floor below can be worked out from, and a test holds the two
 * spellings to each other. Tailwind's scanner matches the literal text of a
 * class name and cannot follow an interpolation, so a class cannot be built
 * from a number -- which is exactly why the pair has to be checked.
 */
const STATUS_ROW_PX = { base: 56, sm: 56 } as const;
const CONTROLS_ROW_PX = { base: 156, sm: 156 } as const;
const COLUMN_GAP_PX = 8;
const COLUMN_GAP_COUNT = 2;

const rowsHeight = (breakpoint: 'base' | 'sm') =>
  STATUS_ROW_PX[breakpoint] + CONTROLS_ROW_PX[breakpoint] + COLUMN_GAP_PX * COLUMN_GAP_COUNT;

/**
 * The height the column needs to seat both rows and a board worth playing on.
 *
 * Exported so the test can derive it rather than restate it.
 */
export function activeColumnMinHeight(breakpoint: 'base' | 'sm') {
  return rowsHeight(breakpoint) + MIN_BOARD_SIZE;
}

/**
 * The board's side: the largest square the column fits under both rows.
 *
 * Container units rather than a measured size, so the board has its size on
 * the first frame the browser paints. A measured size lives in React state,
 * and on a slow phone the update after the first commit reached the screen
 * frames late, painting the board at zero. Both breakpoints share one row
 * height, so one expression serves them.
 */
const BOARD_SIZE = `min(100cqw, 100cqh - ${rowsHeight('base')}px, ${MAX_BOARD_SIZE}px)`;

/**
 * The floor under the column, as classes.
 *
 * Without it the board is whatever the two fixed rows leave over, and on a
 * short viewport that is nothing: the rows took a constant 232px (254px from
 * `sm`) before the page's own header and banner are counted, so a phone in
 * landscape left the board around 15px tall -- and, the rows being held to the
 * board's width, the timer and palette 15px wide with it. The active phase
 * locks scrolling, so there was nowhere to reach the board from either.
 *
 * Holding the column to a height the board can live in means a viewport too
 * short for it overflows and can be scrolled, rather than silently crushing
 * the one thing the screen is for. Where the room exists this changes nothing.
 */
const COLUMN_MIN_HEIGHT = 'min-h-[468px] sm:min-h-[468px]';

interface ActiveGameLayoutProps {
  readonly status: ReactNode;
  readonly board: ReactNode;
  readonly controls: ReactNode;
}

/**
 * The shell shared by memorising and placing.
 *
 * It fills the height it is given and hands the board whatever the two fixed
 * rows leave over, so nothing has to state how tall the rest of the screen is.
 */
export default function ActiveGameLayout({
  status,
  board,
  controls,
}: ActiveGameLayoutProps) {
  const t = useTranslations("game");

  /**
   * The timer and the palette are held to the board's width so the controls
   * line up with the squares they act on. Left to fill the column they run
   * far wider than the board on a desktop, which reads as the screen having
   * drifted apart.
   */
  const rowStyle = {
    width: BOARD_SIZE,
    // Follow the board down only as far as the rows' own contents allow. The
    // `min()` keeps the floor from becoming an overflow of its own on a
    // viewport narrower than it.
    minWidth: `min(${MIN_ROW_WIDTH}px, 100%)`,
    maxWidth: '100%',
  };

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 ${COLUMN_MIN_HEIGHT}`}
      style={{ containerType: 'size' }}
    >
      {/*
        The two rows are a fixed height rather than being sized by their
        contents, so a phase change or a longer translation never moves the
        board. Letting them size themselves moves the board, and on iOS
        the resulting change in page height makes Safari collapse its toolbar,
        which changes the viewport and resizes the board on top of that.
        Reserving the taller phase's space in both keeps the board still.
      */}
      <section
        className={`${STATUS_ROW_HEIGHT} w-full shrink-0 overflow-hidden`}
        style={rowStyle}
        aria-label={t("hud.status")}
      >
        {status}
      </section>

      {/* As tall as the board, so the column's spare height collects above
          and below the whole group rather than between the board and its rows. */}
      <div className="flex w-full shrink-0 items-center justify-center" style={{ height: BOARD_SIZE }}>
        <div data-round-board style={{ width: BOARD_SIZE, height: BOARD_SIZE }}>
          {board}
        </div>
      </div>

      {/* This padding is the whole of the gap between the board and what sits
          under it, the board filling its area exactly. Wider screens used to
          take an extra 4px, which read as the controls having drifted away
          from the board they belong to. */}
      <section
        className={`${CONTROLS_ROW_HEIGHT} w-full shrink-0 py-2`}
        style={rowStyle}
        aria-label={t("hud.controls")}
      >
        {controls}
      </section>
    </div>
  );
}
