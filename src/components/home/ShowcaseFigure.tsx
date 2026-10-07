"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { BOARD_SQUARES, type SquareName } from "@/lib/game/board";
import { isDarkSquare } from "@/lib/home/calibration";
import { GROUP_INDEX, SHOWCASE } from "@/lib/home/showcase";
import type { ShowcaseView } from "@/lib/home/showcaseView";
import { BoardFigure, PieceImage, usePieceName, type PieceState } from "./BoardFigure";
import { fileOf, rowOf } from "./boardUnits";
import { ShowcaseOverlay } from "./ShowcaseOverlay";

const PIECE_SQUARES = Object.keys(SHOWCASE.position) as SquareName[];
const REVEAL_STAGGER_S = 0.32;

interface ShowcaseFigureProps {
  view: ShowcaseView;
  inspected: SquareName | null;
  onInspect: (square: SquareName) => void;
}

function stateOf(view: ShowcaseView, square: SquareName): PieceState {
  if (view.hidden) return "off";
  return view.dimmed.includes(square) ? "ghost" : "on";
}

/** The board of the hero's walkthrough. Each piece keeps one element and slides between squares. */
export function ShowcaseFigure({ view, inspected, onInspect }: ShowcaseFigureProps) {
  const t = useTranslations("home.lab.hero.showcase");
  const pieceName = usePieceName();

  return (
    <BoardFigure>
      <div className="lab-board lab-sc-board" data-glide={view.glide || undefined}>
        {BOARD_SQUARES.map((square, index) => (
          <div key={square} className="lab-cell" data-dark={isDarkSquare(index) || undefined} aria-hidden="true" />
        ))}
        <ShowcaseOverlay view={view} />
        <div className="lab-sc-pieces">
          {PIECE_SQUARES.map((home) => {
            const square = view.placements[home] ?? home;
            const reveal = view.staggered ? (GROUP_INDEX[home] ?? 0) * REVEAL_STAGGER_S : 0;
            return (
              <button
                key={home}
                type="button"
                className="lab-sc-piece"
                style={{ "--file": fileOf(square), "--row": rowOf(square), "--reveal": `${reveal}s` } as CSSProperties}
                disabled={view.hidden}
                aria-pressed={inspected === home}
                aria-label={t("pieceLabel", { piece: pieceName(SHOWCASE.position[home]!), square })}
                onClick={() => onInspect(home)}
              >
                <PieceImage piece={SHOWCASE.position[home]!} state={stateOf(view, home)} />
              </button>
            );
          })}
        </div>
      </div>
    </BoardFigure>
  );
}
