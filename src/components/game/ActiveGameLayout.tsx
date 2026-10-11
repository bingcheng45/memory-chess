'use client';

import { useRef, type ReactNode } from 'react';
import { useTranslations } from "next-intl";

import { useElementSize } from '@/hooks/useElementSize';
import { MAX_BOARD_SIZE, MIN_BOARD_SIZE, MIN_ROW_WIDTH } from '@/lib/layout';

/**
 * The size of the board that fits an area.
 *
 * A square cannot be expressed with `aspect-ratio` alone here: a block told to
 * fill its width keeps that width when `max-height` clamps it, and comes out
 * oblong. Taking the smaller of the two sides gives a square that fits either
 * way. Where the area has no height of its own, width is the only constraint.
 */
export function boardSizeForArea(area: { width: number; height: number }) {
  return Math.min(area.width, area.height > 0 ? area.height : area.width, MAX_BOARD_SIZE);
}

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

/**
 * The height the column needs to seat both rows and a board worth playing on.
 *
 * Exported so the test can derive it rather than restate it.
 */
export function activeColumnMinHeight(breakpoint: 'base' | 'sm') {
  return (
    STATUS_ROW_PX[breakpoint] +
    CONTROLS_ROW_PX[breakpoint] +
    COLUMN_GAP_PX * COLUMN_GAP_COUNT +
    MIN_BOARD_SIZE
  );
}

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
 * The board reads its own size from the space it lands in.
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
   *
   * The width comes from measuring the same area the board measures, through
   * the same rule, so the two cannot disagree.
   */
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const boardArea = useElementSize(boardAreaRef);
  const boardSize = boardSizeForArea(boardArea);
  const rowStyle = {
    width: `${boardSize}px`,
    // Follow the board down only as far as the rows' own contents allow. The
    // `min()` keeps the floor from becoming an overflow of its own on a
    // viewport narrower than it.
    minWidth: `min(${MIN_ROW_WIDTH}px, 100%)`,
    maxWidth: '100%',
  };

  /**
   * Hold the board's area to the board itself.
   *
   * The area takes the height the two rows leave over, and the board fits a
   * square inside it. On a tall screen that square runs out of width first, so
   * the area is left taller than the board -- and, the board being centred in
   * it, the surplus lands as equal bands above and below, pushing the timer
   * and the palette away from the board they describe. On a tall phone that
   * was 70px either side.
   *
   * Capping the area at the board collects the surplus outside the group
   * instead, where the column's centring shares it above and below the whole
   * thing.
   *
   * The cap is the area's width, the most a square there can use, not the
   * board's last measured size. That size came from the previous height, so
   * the area could follow the screen down but never grow back after a
   * rotation. `contain: size` likewise keeps the board's own pixel height from
   * holding the area open when the screen gets shorter.
   */
  const boardAreaStyle = boardArea.width
    ? { maxHeight: `${Math.min(boardArea.width, MAX_BOARD_SIZE)}px` }
    : undefined;

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 ${COLUMN_MIN_HEIGHT}`}
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

      {/* min-h-0 lets this shrink below its content's natural size, which is
          what allows the board to be bounded by the space left over rather
          than pushing the page taller. */}
      <div
        ref={boardAreaRef}
        className="flex min-h-0 w-full flex-1 items-center justify-center [contain:size]"
        style={boardAreaStyle}
      >
        <div data-round-board style={{ width: boardSize, height: boardSize }}>
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
