"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { Figure } from "@/lib/lab/dashboard";

/** A run of a figure's text, the number itself drawn large. */
export interface FigureSegment {
  readonly text: string;
  readonly big: boolean;
}

const MARK = "\u0001";

/** A figure's number in the player's format inside its unit, whichever side of the number the language puts the unit. */
export function useFigureText() {
  const t = useTranslations("dashboard.unit");
  const format = useFormatter();
  const valuesOf = ({ value, digits }: Figure) => ({ count: value, value: format.number(value, { minimumFractionDigits: digits, maximumFractionDigits: digits }) });

  return {
    rich: (figure: Figure) => t.rich(figure.unit, { ...valuesOf(figure), n: (chunks) => <span className="lab-tile-value">{chunks}</span> }),
    segments: (figure: Figure): FigureSegment[] =>
      t
        .markup(figure.unit, { ...valuesOf(figure), n: (chunks) => `${MARK}${chunks}${MARK}` })
        .split(MARK)
        .map((text, index) => ({ text, big: index % 2 === 1 }))
        .filter(({ text }) => text.trim() !== ""),
  };
}
