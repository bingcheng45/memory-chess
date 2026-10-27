"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RoundBoard } from "@/components/round/RoundBoard";
import { OverlayLegend } from "@/components/round/ReadoutCard";
import type { BoardAction, RoundState, ScoredLens } from "@/lib/round/round";
import type { ResultView } from "@/lib/store/gameStore";

// The scored boards only show the round: they take no input.
const ignoreBoard: (action: BoardAction) => void = () => {};

const VIEWS: readonly ResultView[] = ["side", "overlay"];

const SIDES = [
  { lens: "placed", caption: "yourBoard", label: "yourBoardLabel" },
  { lens: "target", caption: "position", label: "positionLabel" },
] as const satisfies readonly { lens: ScoredLens; caption: string; label: string }[];

type ScoredRound = Extract<RoundState, { phase: "scored" }>;

// A perfect round's two boards match, and an empty one leaves yours blank: side by side has nothing to compare.
const nothingToCompare = ({ score, placed }: ScoredRound) => score.wrong === 0 || Object.keys(placed).length === 0;

interface ResultBoardsProps {
  readonly round: ScoredRound;
  readonly view: ResultView;
  readonly onViewChange: (view: ResultView) => void;
}

export default function ResultBoards({ round, view: preferred, onViewChange }: ResultBoardsProps) {
  const t = useTranslations("game.comparison");
  const [picked, setPicked] = useState<ResultView | null>(null);
  const view = picked ?? (nothingToCompare(round) ? "overlay" : preferred);

  const pick = (option: ResultView) => {
    if (option === view) return;
    setPicked(option);
    onViewChange(option);
  };

  return (
    <>
      <div className="lab-result-views" data-result-views>
        <div className="lab-view-toggle" role="group" aria-label={t("viewLabel")}>
          {VIEWS.map((option) => (
            <button
              key={option}
              type="button"
              className="lab-view-option"
              aria-pressed={view === option}
              onClick={() => pick(option)}
            >
              {t(`view.${option}`)}
            </button>
          ))}
        </div>
      </div>
      <figure data-result-board="scored" data-result-view={view} className="lab-plate lab-plate-grid lab-result-board">
        <figcaption className="sr-only">{t("title")}</figcaption>
        {view === "side" ? (
          <>
            <div className="lab-result-pair">
              {SIDES.map(({ lens, caption, label }) => (
                <figure key={lens} data-board-side={lens}>
                  <figcaption>{t(caption)}</figcaption>
                  <RoundBoard state={round} dispatch={ignoreBoard} copy="game.round" lens={lens} label={t(label)} />
                </figure>
              ))}
            </div>
            <div className="lab-legend">
              <span>
                <i data-key="ok" aria-hidden="true" />
                {t("legendCorrect")}
              </span>
              <span>
                <i data-key="wrong" aria-hidden="true" />
                {t("legendWrong")}
              </span>
              <span>
                <i data-key="miss" aria-hidden="true" />
                {t("legendMissed")}
              </span>
            </div>
          </>
        ) : (
          <>
            <RoundBoard state={round} dispatch={ignoreBoard} copy="game.round" />
            <OverlayLegend state={round} copy="game.round" />
          </>
        )}
      </figure>
    </>
  );
}
