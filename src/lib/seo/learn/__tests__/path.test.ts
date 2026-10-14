import { EN_LEARN_PAGES, groupPages, toPage } from "..";
import { LEARN_GUIDES } from "../guides";
import { pathStages, stageGuideNumber } from "../path";

describe("the Learn path", () => {
  it("numbers the five live groups as stages and their guides within each stage", () => {
    const stages = pathStages(groupPages(EN_LEARN_PAGES));

    expect(
      stages.map((stage) => [
        stage.number,
        stage.group.label,
        stage.pages.map((page, index) => `${stageGuideNumber(stage, index)} ${page.meta.slug}`),
      ]),
    ).toEqual([
      [1, "Start here", ["1.1 how-to-get-better-at-chess-for-beginners", "1.2 how-to-think-in-chess-for-beginners"]],
      [
        2,
        "Board vision and blunders",
        [
          "2.1 how-to-stop-blundering-in-chess",
          "2.2 why-puzzle-rating-doesnt-transfer-to-games",
          "2.3 chess-coordinates-practice",
          "2.4 how-to-see-the-whole-board-in-chess",
        ],
      ],
      [
        3,
        "Visualization and calculation",
        [
          "3.1 chess-visualization-exercises",
          "3.2 chess-calculation-exercises-for-beginners",
          "3.3 blindfold-chess-training-for-beginners",
        ],
      ],
      [4, "Memory and patterns", ["4.1 chess-memory-training", "4.2 chess-pattern-recognition-drills"]],
      [
        5,
        "Practice and review",
        ["5.1 20-minute-daily-chess-study-plan", "5.2 how-to-analyze-chess-games-for-beginners", "5.3 how-many-chess-puzzles-a-day"],
      ],
    ]);
  });

  it("closes selected stages with a round or a dashboard figure", () => {
    const ctas = pathStages(groupPages(EN_LEARN_PAGES)).map((stage) => [stage.group.id, stage.cta?.href ?? null]);

    expect(ctas).toEqual([
      ["foundations", "/game?pieceCount=6&memorizeTime=10&source=guide_cta"],
      ["board-vision", "/dashboard#tile-recentAccuracy"],
      ["visualization", null],
      ["memory", "/dashboard#tile-span"],
      ["practice", null],
    ]);
  });

  it("renumbers the stages when a group has no guide yet", () => {
    const withoutFoundations = LEARN_GUIDES.filter((doc) => doc.meta.group !== "foundations").map(toPage);

    expect(pathStages(groupPages(withoutFoundations)).map((stage) => `${stage.number} ${stage.group.id}`)).toEqual([
      "1 board-vision",
      "2 visualization",
      "3 memory",
      "4 practice",
    ]);
  });
});
