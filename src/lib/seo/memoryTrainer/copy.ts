import { DEFAULT_ROUND_PIECES, DEFAULT_ROUND_SECONDS } from "@/lib/data/recall";
import { MEMORIZE_SECONDS_RANGE, PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import { BLINDFOLD_PATH } from "@/lib/seo/blindfold/copy";

export const MEMORY_TRAINER_PATH = "/chess-memory-trainer";
export const MEMORY_LADDER_GUIDE_PATH = "/learn/chess-memory-training";
export const TRAINERS_COMPARED_GUIDE_PATH = "/learn/chess-position-memory-trainers-compared";

/** Page copy for /chess-memory-trainer, which is English-only like /blindfold. */
export const MEMORY_TRAINER_PAGE_COPY = {
  meta: {
    title: "Chess Memory Trainer: See a Position, Rebuild It | Memory Chess",
    description:
      "A free chess memory trainer in your browser. Study a position for a few seconds, rebuild it on an empty board, and see which squares you got right.",
    socialTitle: "Chess Memory Trainer",
    socialDescription: "Study a chess position, then rebuild it from memory on an empty board. Free, with no account.",
  },
  kicker: "Memory trainer",
  title: "Chess memory trainer",
  lede: "This chess memory trainer shows you a position for a few seconds, then clears the board. You put every piece back where it stood, and the trainer marks each square right or wrong.",
  start: { primary: "Start a round", secondary: "Choose pieces and time" },
  sections: [
    {
      id: "what-it-measures",
      title: "What the trainer measures",
      paragraphs: [
        "Each round asks one question: how much of a chess position can you hold after a short look? You study the board until the timer ends. Then the board goes blank and you place the pieces from memory.",
        "The result gives your accuracy from 0 to 100%, how many pieces you placed right and wrong, and how long the rebuild took. The board shows every square you got right or wrong, so you can see which piece slipped.",
      ],
    },
    {
      id: "first-round",
      title: "Your first round",
      paragraphs: [
        `The start button opens a round of ${DEFAULT_ROUND_PIECES} pieces with ${DEFAULT_ROUND_SECONDS} seconds to study them. When the board clears, place each piece you remember and submit.`,
        "If the first rebuild falls apart, play two or three more at the same size before you change anything. One round says little; a few in a row show what you can hold.",
      ],
    },
    {
      id: "next-board",
      title: "How the next board is sized",
      paragraphs: [
        "After a round, Next round sizes the next board from your score. At 90% or better it adds a piece. Below 50% it takes one away, down to 3 pieces. Anywhere in between it keeps the same size, so you keep training at the edge of what you can hold.",
        "Try again replays the same number of pieces and study time. Change settings lets you pick the size yourself.",
      ],
    },
    {
      id: "settings",
      title: "Set your own board",
      paragraphs: [
        `Choose pieces and time sets any board from ${PIECE_COUNT_RANGE.min} to ${PIECE_COUNT_RANGE.max} pieces, with a study time from ${MEMORIZE_SECONDS_RANGE.min} to ${MEMORIZE_SECONDS_RANGE.max} seconds. The preset sizes each have a leaderboard, so you can compare a score with other players at the same size.`,
      ],
    },
    {
      id: "record",
      title: "Your record stays in this browser",
      paragraphs: [
        "There is no account and no sign-up. Every round is saved in this browser, and the dashboard turns your rounds into your span, your speed and your daily streak. The result screen offers a download, so you can keep a copy of your record.",
      ],
    },
  ],
  further: [
    { before: "Want a plan to follow? Climb the ", anchor: "6-to-12 piece chess memory ladder", href: MEMORY_LADDER_GUIDE_PATH, after: "." },
    { before: "Weighing other tools? Read ", anchor: "chess position memory trainers compared", href: TRAINERS_COMPARED_GUIDE_PATH, after: "." },
    { before: "Ready to drop the board? Try the ", anchor: "blindfold chess trainer", href: BLINDFOLD_PATH, after: "." },
  ],
} as const;
