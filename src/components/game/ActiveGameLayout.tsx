'use client';

import type { ReactNode } from 'react';

import { useTranslations } from "next-intl";

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
        className="h-20 w-full shrink-0 overflow-hidden sm:h-[88px]"
        aria-label={t("hud.status")}
      >
        {status}
      </section>

      {/* min-h-0 lets this shrink below its content's natural size, which is
          what allows the board to be bounded by the space left over rather
          than pushing the page taller. */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        {board}
      </div>

      <section
        className="h-[136px] w-full shrink-0 py-2 sm:h-[150px] sm:py-3"
        aria-label={t("hud.controls")}
      >
        {controls}
      </section>
    </div>
  );
}
