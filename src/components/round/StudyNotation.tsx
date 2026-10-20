"use client";

import { useTranslations } from "next-intl";
import { notationOf } from "@/lib/round/notation";
import type { LabPosition } from "@/lib/round/round";

const LEGEND = [
  ["K", "king"],
  ["Q", "queen"],
  ["R", "rook"],
  ["B", "bishop"],
  ["N", "knight"],
] as const;

/** A blindfold round's study: the position written out, one line per side, over the empty board. */
export function StudyNotation({ position }: { readonly position: LabPosition }) {
  const t = useTranslations("game.round");
  const legend = [...LEGEND.map(([letter, type]) => `${letter} ${t(`pieceTypes.${type}`)}`), t("notation.pawns")].join(" · ");

  return (
    <div className="round-notation" data-study-notation>
      <div className="round-notation-card">
        <ul className="round-notation-list" aria-label={t("notation.label")}>
          {notationOf(position).map(({ color, pieces }) => (
            <li key={color}>
              <span className="round-notation-side">{t(`notation.${color}`)}:</span> {pieces.join(", ")}
            </li>
          ))}
        </ul>
        <p className="round-notation-legend">{legend}</p>
      </div>
    </div>
  );
}
