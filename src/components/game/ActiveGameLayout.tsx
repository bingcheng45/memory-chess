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
      <section
        className="h-[88px] w-full shrink-0 overflow-hidden"
        style={frameStyle}
        aria-label={t("hud.status")}
      >
        {status}
      </section>

      <div className="shrink-0" style={frameStyle}>
        {board}
      </div>

      <section
        className="w-full py-2 sm:py-3"
        style={frameStyle}
        aria-label={t("hud.controls")}
      >
        {controls}
      </section>
    </div>
  );
}
