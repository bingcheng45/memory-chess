import { DEFAULT_ROUND_PIECES, DEFAULT_ROUND_SECONDS } from "@/lib/data/recall";
import { MEMORIZE_SECONDS_RANGE, PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import { DIFFICULTY_PRESETS } from "@/types/game";

export const TRAINER_PATH = "/chess-memory-trainer";

const { easy, grandmaster } = DIFFICULTY_PRESETS;

/** Page copy for /chess-memory-trainer, which is English-only like /blindfold. */
export const TRAINER_PAGE_COPY = {
  meta: {
    title: "Chess Memory Trainer: Memorize and Rebuild Positions | Memory Chess",
    description:
      "A free chess memory trainer in your browser. Memorize a position, rebuild it on an empty board, and see which squares you missed. No sign-up.",
    socialTitle: "Chess Memory Trainer",
    socialDescription: "Memorize a chess position, rebuild it on an empty board, and see which squares you missed. Free, in your browser.",
  },
  kicker: "Position memory",
  title: "Chess memory trainer",
  lede: "The chess memory trainer shows you a chess position for a few seconds, then clears the board. You put every piece back where it stood, and the trainer marks each square right or wrong.",
  start: { primary: "Start round", secondary: "Set pieces and time" },
  sections: [
    {
      id: "what-it-trains",
      title: "What the trainer trains",
      paragraphs: [
        "It trains position memory: looking at a board once and keeping every piece on its square in your head. You lean on that picture whenever you calculate, because each move you imagine changes a board you have to hold steady.",
        "Each position is drawn at random rather than taken from a game, so an opening you know cannot carry you. The score reflects what you saw in the time you had.",
      ],
    },
    {
      id: "a-round",
      title: "What happens in a round",
      paragraphs: [
        `The start button above opens a round of ${DEFAULT_ROUND_PIECES} pieces with ${DEFAULT_ROUND_SECONDS} seconds to study them. A three-second count leads in, the position appears, and the board empties when the time runs out. If you have it sooner, hide the board yourself.`,
        "Then you place the pieces back on the empty board. The result gives your accuracy, the pieces you got right, how long you studied and how long the rebuild took, with every square marked right or wrong.",
      ],
    },
    {
      id: "difficulty",
      title: "Set the difficulty",
      paragraphs: [
        `Four ready-made levels run from easy, ${easy.pieceCount} pieces with ${easy.memorizeTime} seconds, to grandmaster, ${grandmaster.pieceCount} pieces with ${grandmaster.memorizeTime} seconds. Each level has its own leaderboard.`,
        `Or set your own round, anywhere from ${PIECE_COUNT_RANGE.min} to ${PIECE_COUNT_RANGE.max} pieces and ${MEMORIZE_SECONDS_RANGE.min} to ${MEMORIZE_SECONDS_RANGE.max} seconds of study.`,
      ],
    },
    {
      id: "progress",
      title: "What the trainer keeps track of",
      paragraphs: [
        "Every round you play is saved in your browser, with no account. Your dashboard turns those rounds into a skill rating and shows how your scores move over time.",
        "A board you rebuild with less than 80% accuracy comes back for review one, three, seven and fourteen days after you first saw it, so the positions you missed get another look.",
      ],
    },
    {
      id: "other-ways",
      title: "Other ways to train",
      paragraphs: [
        "The daily board gives every player the same position once a day, with one try, so a single attempt can be compared with everyone else's.",
        "Blindfold mode writes the position out as notation instead of showing the pieces, for players working toward blindfold chess.",
      ],
    },
  ],
  links: [
    { before: "Want a plan? Climb the ", anchor: "6-to-12 piece memory training ladder", href: "/learn/chess-memory-training", after: "." },
    { before: "Weighing other tools? See ", anchor: "how position-memory trainers compare", href: "/learn/chess-position-memory-trainers-compared", after: "." },
    { before: "Ready for no pieces at all? Try the ", anchor: "blindfold chess trainer", href: "/blindfold", after: "." },
    { before: "One shot a day? Play ", anchor: "today's daily board", href: "/daily", after: "." },
  ],
} as const;
