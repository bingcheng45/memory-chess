'use client';

import { useRef, type ReactNode } from 'react';

import { useElementSize } from '@/hooks/useElementSize';
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
  const rowStyle = { width: `${boardSizeForArea(boardArea)}px`, maxWidth: '100%' };

  return (
    <div className="flex h-full w-full flex-col items-center gap-2">
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
      >
        {board}
      </div>

      <section
        className={`${CONTROLS_ROW_HEIGHT} w-full shrink-0 py-2 sm:py-3`}
        style={rowStyle}
        aria-label={t("hud.controls")}
      >
        {controls}
      </section>
    </div>
  );
}
