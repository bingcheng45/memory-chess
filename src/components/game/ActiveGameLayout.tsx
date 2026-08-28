'use client';

import { useRef, type ReactNode } from 'react';

import { useElementSize } from '@/hooks/useElementSize';
import { MIN_BOARD_SIZE } from '@/lib/layout';
import { boardSizeForArea } from './ResponsiveChessBoard';

import { useTranslations } from "next-intl";

/**
 * Height of the row above the board, holding the timer and the phase's one
 * action. It must fit the taller of the two: memorising stacks a title, the
 * clock, a progress bar and the piece count, and at 64px that stack was
 * clipped top and bottom.
 */
const STATUS_ROW_HEIGHT = 'h-20 sm:h-[88px]';

/**
 * Height of the row below the board. It must fit the piece palette, which is
 * the taller of the two phases by some margin -- memorising puts a single
 * line of hint text here.
 *
 * Both rows are fixed rather than sized by their contents so the board does
 * not move when the phase changes. See the note in the markup below.
 */
const CONTROLS_ROW_HEIGHT = 'h-[136px] sm:h-[150px]';

/**
 * The two rows above as numbers, and the gap between the three children.
 *
 * The classes above are what the browser reads; these are the same figures in
 * a form the floor below can be worked out from, and a test holds the two
 * spellings to each other. Tailwind's scanner matches the literal text of a
 * class name and cannot follow an interpolation, so a class cannot be built
 * from a number -- which is exactly why the pair has to be checked.
 */
const STATUS_ROW_PX = { base: 80, sm: 88 } as const;
const CONTROLS_ROW_PX = { base: 136, sm: 150 } as const;
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
 * short viewport that is nothing: the rows are a constant 232px (254px from
 * `sm`) before the page's own header and banner are counted, so a phone in
 * landscape left the board around 15px tall -- and, the rows being held to the
 * board's width, the timer and palette 15px wide with it. The active phase
 * locks scrolling, so there was nowhere to reach the board from either.
 *
 * Holding the column to a height the board can live in means a viewport too
 * short for it overflows and can be scrolled, rather than silently crushing
 * the one thing the screen is for. Where the room exists this changes nothing.
 */
const COLUMN_MIN_HEIGHT = 'min-h-[472px] sm:min-h-[494px]';

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
  const rowStyle = { width: `${boardSize}px`, maxWidth: '100%' };

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
   * thing. Reading the height back gives the same figure, so this settles
   * rather than oscillating.
   */
  const boardAreaStyle = boardSize
    ? { maxHeight: `${boardSize}px` }
    : undefined;

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 ${COLUMN_MIN_HEIGHT}`}
    >
      {/*
        The two rows are a fixed height rather than being sized by their
        contents, because memorising and placing put very different things in
        them: a timer and a progress bar against a full piece palette. Letting
        them size themselves moves the board when the phase changes, and on iOS
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
        className="flex min-h-0 w-full flex-1 items-center justify-center"
        style={boardAreaStyle}
      >
        {board}
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
