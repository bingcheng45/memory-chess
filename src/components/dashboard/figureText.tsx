"use client";

import { Children, type ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { Figure, TileContext } from "@/lib/lab/dashboard";

/** What a figure is read from, in words: the line under it on a tile and on the share card. */
export function useContextText() {
  const t = useTranslations("dashboard.context");
  const format = useFormatter();
  return ({ kind, values }: TileContext) =>
    t(kind, Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value instanceof Date ? format.dateTime(value, { dateStyle: "medium" }) : value])));
}

/** A run of a figure's text, the number itself drawn large. */
export interface FigureSegment {
  readonly text: string;
  readonly big: boolean;
}

const MARK = "\u0001";
const SEPARATORS = /(\P{Nd}+)/u;

/** A number in the mono face with its separators in their own span: a mono comma or point takes a whole digit cell, so "5,2" reads "5 ,2" until the span narrows it. */
const tightNumber = (chunks: ReactNode) =>
  Children.map(chunks, (chunk) =>
    typeof chunk === "string"
      ? chunk.split(SEPARATORS).map((part, index) => (index % 2 === 1 ? <span key={index} className="lab-num-sep">{part}</span> : part))
      : chunk,
  );

/** A figure's number in the player's format inside its unit, whichever side of the number the language puts the unit. */
export function useFigureText() {
  const t = useTranslations("dashboard.unit");
  const format = useFormatter();
  const valuesOf = ({ value, digits }: Figure) => ({ count: value, value: format.number(value, { minimumFractionDigits: digits, maximumFractionDigits: digits }) });

  return {
    rich: (figure: Figure) => t.rich(figure.unit, { ...valuesOf(figure), n: (chunks) => <span className="lab-tile-value">{tightNumber(chunks)}</span> }),
    plain: (figure: Figure): string => t.markup(figure.unit, { ...valuesOf(figure), n: (chunks) => chunks }),
    segments: (figure: Figure): FigureSegment[] =>
      t
        .markup(figure.unit, { ...valuesOf(figure), n: (chunks) => `${MARK}${chunks}${MARK}` })
        .split(MARK)
        .map((text, index) => ({ text, big: index % 2 === 1 }))
        .filter(({ text }) => text.trim() !== ""),
  };
}
