export type LearnPage = {
  slug: string;
  title: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  painPoint: string;
  ctaLabel: string;
  ctaHref: '/game';
  lastReviewed: string;
};

export type LearnFaq = {
  question: string;
  answer: string;
};

export type LearnPageContent = LearnPage & {
  h1: string;
  intro: string;
  symptoms: string[];
  routineTitle: string;
  routineSteps: string[];
  commonMistakes: string[];
  faq: LearnFaq[];
  siblingSlug: string;
  siblingAnchorText: string;
};

const LAST_REVIEWED = '2026-03-06T00:00:00.000Z';

export const LEARN_PAGES: LearnPageContent[] = [
  {
    slug: 'how-to-get-better-at-chess-for-beginners',
    title: 'How to Get Better at Chess for Beginners',
    description:
      'Use a practical 30-day beginner plan to improve chess quickly with board vision drills, memory routines, and fewer blunders.',
    primaryKeyword: 'how to get better at chess',
    secondaryKeywords: [
      'chess improvement plan',
      'beginner chess training',
      'chess routine for beginners',
      'reduce blunders in chess',
      'chess board vision',
    ],
    painPoint: 'No clear training plan and inconsistent progress.',
    ctaLabel: 'Start a beginner training round',
    ctaHref: '/game',
    lastReviewed: LAST_REVIEWED,
    h1: 'How to get better at chess for beginners',
    intro:
      'If you feel stuck, you usually do not need more theory. You need a repeatable system that trains board vision, recall, and decision speed under light time pressure.',
    symptoms: [
      'You know opening principles but still blunder one-move threats.',
      'Puzzle rating improves, but game rating stays flat.',
      'You play many games but do not track a training routine.',
      'You lose focus and forget piece locations after a few moves.',
    ],
    routineTitle: 'How to get better at chess: 7-step beginner routine',
    routineSteps: [
      'Warm up with one 3-minute board scan: identify every attacked and undefended piece.',
      'Run one memory-chess round with 8 pieces and 10-second memorization.',
      'Play two short tactical positions and force yourself to calculate checks, captures, and threats.',
      'Review each mistake and label it as vision, calculation, or time-management.',
      'Repeat a second memory-chess round with the same settings and compare accuracy.',
      'Play one rapid game and pause after every blunder candidate to ask what changed on the board.',
      'Log one lesson in a notebook so tomorrow starts with a clear focus.',
    ],
    commonMistakes: [
      'Jumping between random lessons instead of following one routine for 2-4 weeks.',
      'Studying openings before fixing board vision and blunder control.',
      'Playing too many games without post-game notes.',
      'Skipping memory drills even though piece recall is a core weakness.',
    ],
    faq: [
      {
        question: 'How many minutes should beginners train each day?',
        answer:
          'A focused 20 to 30 minutes is enough if the routine is consistent and includes board vision plus memory practice.',
      },
      {
        question: 'Why do my puzzle skills not transfer to games?',
        answer:
          'In games you must find tactics yourself. Add board scan and recall drills before playing so your pattern recognition appears faster.',
      },
      {
        question: 'Should I memorize openings early?',
        answer:
          'Only basic principles first. Most beginners gain more from reducing blunders and improving piece awareness.',
      },
      {
        question: 'What is the fastest metric to track progress?',
        answer:
          'Track blunders per game and memory-chess accuracy over time. Those two metrics usually move before rating does.',
      },
    ],
    siblingSlug: 'chess-visualization-exercises',
    siblingAnchorText: 'chess visualization exercises',
  },
  {
    slug: 'chess-visualization-exercises',
    title: 'Chess Visualization Exercises for Beginners',
    description:
      'Practice beginner-friendly chess visualization exercises that improve move calculation, board recall, and confidence in real games.',
    primaryKeyword: 'chess visualization exercises',
    secondaryKeywords: [
      'chess visualization training',
      'calculate moves ahead',
      'board visualization chess',
      'blindfold preparation',
      'mental chess practice',
    ],
    painPoint: "Can't see moves ahead and lose tactical opportunities.",
    ctaLabel: 'Practice visualization in game mode',
    ctaHref: '/game',
    lastReviewed: LAST_REVIEWED,
    h1: 'Chess visualization exercises beginners can do daily',
    intro:
      'Visualization is the skill of updating an internal board in your head. When this skill improves, calculation becomes cleaner and panic blunders drop.',
    symptoms: [
      "You can solve tactics only when arrows or hints are available.",
      'You forget where a key defender stood after two exchanges.',
      'You miss simple forks because your internal board goes blank.',
      'You feel slow whenever the position becomes tactical.',
    ],
    routineTitle: 'Chess visualization exercises: 6-step daily progression',
    routineSteps: [
      'Name every piece and square aloud from a static board for 60 seconds.',
      'Close your eyes and recall the full board, then reopen and verify.',
      'Run one Memory Chess round with a moderate piece count and strict timer.',
      'Pick one legal move and describe the new board before making it.',
      'Calculate two candidate lines for 3 plies each without moving pieces.',
      'Finish with one fast recall drill: reproduce a position from memory under time pressure.',
    ],
    commonMistakes: [
      'Trying deep calculation before basic board recall is stable.',
      'Moving pieces physically during every calculation attempt.',
      'Practicing visualization once a week instead of daily short sessions.',
      'Not checking whether your imagined board matches reality.',
    ],
    faq: [
      {
        question: 'How long until chess visualization improves?',
        answer:
          'Most beginners notice clearer board recall within 2 to 4 weeks of short daily sessions.',
      },
      {
        question: 'Do visualization drills help blitz games?',
        answer:
          'Yes. Faster board updates help you spot checks, captures, and threats under time pressure.',
      },
      {
        question: 'Can I train visualization without blindfold chess?',
        answer:
          'Yes. Structured recall drills with timed board exposure are enough to build a strong base.',
      },
      {
        question: 'What should I do if I keep forgetting piece locations?',
        answer:
          'Reduce complexity, shorten lines, and repeat one position until recall is accurate before increasing difficulty.',
      },
    ],
    siblingSlug: 'chess-board-vision-drills',
    siblingAnchorText: 'chess board vision drills',
  },
  {
    slug: 'chess-board-vision-drills',
    title: 'Chess Board Vision Drills to Cut Blunders',
    description:
      'Use practical chess board vision drills to spot threats faster, reduce one-move blunders, and improve tactical awareness.',
    primaryKeyword: 'chess board vision',
    secondaryKeywords: [
      'chess board vision drills',
      'reduce chess blunders',
      'spot threats in chess',
      'chess tactical awareness',
      'beginner chess mistakes',
    ],
    painPoint: 'Missing threats and blundering pieces in simple positions.',
    ctaLabel: 'Run a 10-minute board vision drill',
    ctaHref: '/game',
    lastReviewed: LAST_REVIEWED,
    h1: 'Chess board vision drills for beginners',
    intro:
      'Board vision means seeing what is attacked, defended, and hanging before you move. Better board vision is usually the fastest way to stop rating drops from simple blunders.',
    symptoms: [
      'You leave pieces undefended and notice only after your opponent captures.',
      'You focus on your plan but miss your opponent’s direct threats.',
      'You move quickly in winning positions and throw away material.',
      'You rarely run a pre-move safety check.',
    ],
    routineTitle: 'Chess board vision routine: 5 drills you can repeat',
    routineSteps: [
      'Before every move, list checks, captures, and threats for both sides.',
      'Mark every undefended piece and write one sentence about its risk.',
      'Use a short Memory Chess round to train fast square-to-piece recall.',
      'Replay a recent game and stop at each blunder to identify the missed threat.',
      'End with one rapid self-test: 10 positions, 10 safety checks, no engine.',
    ],
    commonMistakes: [
      'Checking only your attacking idea and ignoring opponent forcing moves.',
      'Assuming a defended piece is safe without counting attackers.',
      'Playing too fast when the position changes structure.',
      'Not reviewing blunders by category after each session.',
    ],
    faq: [
      {
        question: 'What is the quickest way to improve chess board vision?',
        answer:
          'Use a fixed pre-move checklist and repeat it in every game until it becomes automatic.',
      },
      {
        question: 'Why do I blunder even when I know tactics?',
        answer:
          'Tactical knowledge fails if board state tracking is weak. Vision drills train the tracking layer.',
      },
      {
        question: 'How often should I review my blunders?',
        answer:
          'After every game. Label each one as missed threat, loose piece, or calculation error.',
      },
      {
        question: 'Can memory drills help board vision?',
        answer:
          'Yes. Faster recall of piece locations helps you detect threats before committing to a move.',
      },
    ],
    siblingSlug: 'chess-memory-training',
    siblingAnchorText: 'chess memory training',
  },
  {
    slug: 'chess-memory-training',
    title: 'Chess Memory Training Drills for Faster Recall',
    description:
      'Train chess memory with practical drills that improve board recall, pattern retention, and tactical consistency for beginners.',
    primaryKeyword: 'chess memory training',
    secondaryKeywords: [
      'chess memory drills',
      'memorize chess positions',
      'pattern recognition chess',
      'board recall training',
      'chess concentration',
    ],
    painPoint: 'Forgetting piece locations and plans during calculation.',
    ctaLabel: 'Start a timed memory challenge',
    ctaHref: '/game',
    lastReviewed: LAST_REVIEWED,
    h1: 'Chess memory training for beginner improvement',
    intro:
      'Chess memory is not about memorizing random boards forever. It is about recalling useful structures quickly enough to calculate cleanly in practical games.',
    symptoms: [
      'You forget your intended line after one forcing move.',
      'You cannot reconstruct critical positions from recent games.',
      'You rely on intuition because calculation collapses mid-line.',
      'Your endgame errors increase when concentration drops.',
    ],
    routineTitle: 'Chess memory training: 6-step drill sequence',
    routineSteps: [
      'Start with a low-complexity position and memorize for 10 seconds.',
      'Recreate the position from memory and check piece-level accuracy.',
      'Increase complexity gradually: more pieces or shorter exposure time.',
      'Repeat two rounds focused on the same mistake category.',
      'Add one transfer drill by calculating a short line from the memorized setup.',
      'Track accuracy, speed, and error type in a simple weekly log.',
    ],
    commonMistakes: [
      'Using random difficulty jumps that are too large for current level.',
      'Measuring only speed while ignoring reconstruction accuracy.',
      'Skipping error logs, which hides repeated weaknesses.',
      'Treating memory drills as separate from tactical calculation.',
    ],
    faq: [
      {
        question: 'Does chess memory training improve real games?',
        answer:
          'Yes, when paired with move calculation and review. Better recall helps maintain line clarity under pressure.',
      },
      {
        question: 'How many positions should I train per session?',
        answer:
          'For beginners, 6 to 12 high-quality attempts are enough if you review errors carefully.',
      },
      {
        question: 'Should I train random boards or real-game patterns?',
        answer:
          'Use both. Random boards sharpen pure recall, while common structures improve practical transfer.',
      },
      {
        question: 'What if accuracy stalls?',
        answer:
          'Lower complexity for one week, fix one error type, then scale up again.',
      },
    ],
    siblingSlug: 'blindfold-chess-training-for-beginners',
    siblingAnchorText: 'blindfold chess training for beginners',
  },
  {
    slug: 'blindfold-chess-training-for-beginners',
    title: 'Blindfold Chess Training for Beginners',
    description:
      'Build blindfold chess skills with a safe beginner progression that improves board visualization without overwhelming your training.',
    primaryKeyword: 'blindfold chess training',
    secondaryKeywords: [
      'blindfold chess for beginners',
      'mental board training',
      'visualization chess drills',
      'calculate without moving pieces',
      'chess focus exercises',
    ],
    painPoint: 'Weak internal board model when calculating multiple moves.',
    ctaLabel: 'Start blindfold-friendly progression',
    ctaHref: '/game',
    lastReviewed: LAST_REVIEWED,
    h1: 'Blindfold chess training for beginners who want clearer calculation',
    intro:
      'Blindfold training should be progressive. The goal is not to play full games blindfolded immediately, but to strengthen mental board control in manageable steps.',
    symptoms: [
      'You lose track of piece squares after one or two imagined moves.',
      'You avoid calculation-heavy positions because they feel chaotic.',
      'Your confidence drops when visual cues are removed.',
      'You can explain plans but cannot hold concrete lines mentally.',
    ],
    routineTitle: 'Blindfold chess training: beginner 5-step progression',
    routineSteps: [
      'Memorize a small position and reconstruct it before any moves.',
      'Calculate one move for each side without touching pieces.',
      'Verify the imagined board and correct every mismatch.',
      'Run one Memory Chess round with shorter viewing windows.',
      'Add one extra ply only after you can hold current depth consistently.',
    ],
    commonMistakes: [
      'Attempting full blindfold games too early.',
      'Ignoring verification and trusting incorrect mental boards.',
      'Training depth before stability at shallow depth.',
      'Practicing too long in one session and burning focus.',
    ],
    faq: [
      {
        question: 'Is blindfold chess useful for beginners?',
        answer:
          'Yes, in short controlled drills. It strengthens board visualization that supports normal games.',
      },
      {
        question: 'How often should I do blindfold drills?',
        answer:
          'Two to four short sessions per week is enough when combined with regular play and review.',
      },
      {
        question: 'What is the best first blindfold exercise?',
        answer:
          'Reconstruct a simple position from memory and calculate one move for each side before checking.',
      },
      {
        question: 'How do I know I am improving?',
        answer:
          'You will hold more squares accurately, calculate longer lines, and make fewer vision blunders in regular games.',
      },
    ],
    siblingSlug: 'working-memory-exercises-for-chess',
    siblingAnchorText: 'working memory exercises for chess',
  },
  {
    slug: 'working-memory-exercises-for-chess',
    title: 'Working Memory Exercises for Chess Players',
    description:
      'Use working memory exercises built for chess to hold lines longer, calculate cleaner variations, and improve decision quality.',
    primaryKeyword: 'working memory exercises',
    secondaryKeywords: [
      'working memory for chess',
      'chess calculation training',
      'chess concentration drills',
      'improve chess consistency',
      'mental endurance chess',
    ],
    painPoint: 'Inconsistent calculation depth and losing lines mid-thought.',
    ctaLabel: 'Start your daily working-memory routine',
    ctaHref: '/game',
    lastReviewed: LAST_REVIEWED,
    h1: 'Working memory exercises for chess beginners',
    intro:
      'Working memory helps you hold candidate lines while evaluating tactics, king safety, and endgame transitions. Improving it can help you calculate with less confusion.',
    symptoms: [
      'You forget the first candidate line after exploring a second line.',
      'You mix move orders and reach incorrect conclusions.',
      'You feel mentally overloaded in tactical positions.',
      'Your move quality drops late in games due to cognitive fatigue.',
    ],
    routineTitle: 'Working memory exercises for chess: 6-step daily block',
    routineSteps: [
      'Pick one position and list three candidate moves without moving pieces.',
      'Calculate each line for two plies and summarize the result in one sentence.',
      'Run a Memory Chess recall round to sharpen position retention.',
      'Return to the original position and compare candidate lines again.',
      'Play one short game with a strict pre-move checklist.',
      'Write one post-game note on where line tracking failed or held up.',
    ],
    commonMistakes: [
      'Trying to hold too many candidate lines at once.',
      'Skipping verbal summaries that stabilize memory traces.',
      'Practicing only puzzles without transfer into games.',
      'Ignoring mental fatigue and training past quality threshold.',
    ],
    faq: [
      {
        question: 'Do working memory exercises transfer to chess performance?',
        answer:
          'They can help when tied directly to board calculation and game review rather than isolated drills alone.',
      },
      {
        question: 'How should beginners structure working memory practice?',
        answer:
          'Use short, repeatable sessions that combine recall, line tracking, and one practical game transfer step.',
      },
      {
        question: 'What is a simple way to track improvement?',
        answer:
          'Track how many candidate lines you can hold accurately and how often you lose the thread mid-calculation.',
      },
      {
        question: 'Should this replace tactics training?',
        answer:
          'No. It should complement tactics by improving your ability to keep lines clear while solving positions.',
      },
    ],
    siblingSlug: 'how-to-get-better-at-chess-for-beginners',
    siblingAnchorText: 'how to get better at chess for beginners',
  },
];

export function getLearnPageBySlug(slug: string): LearnPageContent {
  const page = LEARN_PAGES.find((entry) => entry.slug === slug);

  if (!page) {
    throw new Error(`Unknown learn page slug: ${slug}`);
  }

  return page;
}
