'use client';

import type { ReactNode } from 'react';
import type { BoardDimensions } from '@/hooks/useResponsiveBoard';

import { useTranslations } from "next-intl";
interface ActiveGameLayoutProps {
  readonly dimensions: BoardDimensions;
  readonly status: ReactNode;
  readonly board: ReactNode;
  readonly controls: ReactNode;
}

export default function ActiveGameLayout({
  dimensions,
  status,
  board,
  controls,
}: ActiveGameLayoutProps) {
  const t = useTranslations("game");
  const frameStyle = { width: `${dimensions.size}px`, maxWidth: '100%' };

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {/*
        The status and controls rows are a fixed height rather than being
        sized by their contents, because memorising and placing put very
        different things in them: a timer and a progress bar against a full
        piece palette. Letting them size themselves moves the board when the
        phase changes, and on iOS the resulting change in page height makes
        Safari collapse its toolbar, which changes the viewport and resizes
        the board on top of that. Reserving the taller phase's space in both
        keeps the board still.
      */}
      <section
        className="h-20 w-full shrink-0 overflow-hidden sm:h-[88px]"
        style={frameStyle}
        aria-label={t("hud.status")}
      >
        {status}
      </section>

      <div className="shrink-0" style={frameStyle}>
        {board}
      </div>

      <section
        className="h-[136px] w-full shrink-0 py-2 sm:h-[150px] sm:py-3"
        style={frameStyle}
        aria-label={t("hud.controls")}
      >
        {controls}
      </section>
    </div>
  );
}
