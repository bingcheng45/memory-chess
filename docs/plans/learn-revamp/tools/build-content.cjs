// Maps today's LearnGuide data (guides.json, extracted from src/lib/seo/learn/guides) onto the
// template in docs/plans/learn-revamp/template.md and writes learn-proto/content.js.
const fs = require("fs");
const path = require("path");
const [root, guidesJson, articlesJson, outFile] = process.argv.slice(2);
const { Chess } = require(path.join(root, "node_modules/chess.js"));
const guides = require(guidesJson);
const articles = require(articlesJson);

const GROUPS = [
  { id: "foundations", label: "Start here", description: "How to improve from scratch and what to think about on every move.", status: "live" },
  { id: "board-vision", label: "Board vision and blunders", description: "See every piece, read squares at a glance, and stop dropping material.", status: "live" },
  { id: "visualization", label: "Visualization and calculation", description: "Hold a position in your head and move pieces there without losing it.", status: "live" },
  { id: "memory", label: "Memory and patterns", description: "Recall positions square by square and learn shapes worth remembering.", status: "live" },
  { id: "practice", label: "Practice and review", description: "Short routines, puzzle counts and how to learn from your own games.", status: "live" },
  { id: "science", label: "The science of chess memory", description: "What de Groot, Chase and Simon and later research found, written for players.", status: "planned" },
  { id: "using-memory-chess", label: "Using Memory Chess", description: "How a round is scored, what each preset tests and what your dashboard figures mean.", status: "planned" },
];

const GROUP_OF = {
  "how-to-get-better-at-chess-for-beginners": "foundations",
  "how-to-think-in-chess-for-beginners": "foundations",
  "how-to-stop-blundering-in-chess": "board-vision",
  "how-to-see-the-whole-board-in-chess": "board-vision",
  "chess-coordinates-practice": "board-vision",
  "why-puzzle-rating-doesnt-transfer-to-games": "board-vision",
  "chess-visualization-exercises": "visualization",
  "chess-calculation-exercises-for-beginners": "visualization",
  "blindfold-chess-training-for-beginners": "visualization",
  "chess-memory-training": "memory",
  "chess-pattern-recognition-drills": "memory",
  "20-minute-daily-chess-study-plan": "practice",
  "how-to-analyze-chess-games-for-beginners": "practice",
  "how-many-chess-puzzles-a-day": "practice",
};

const QUESTIONS = {
  "how-to-get-better-at-chess-for-beginners": ["How do I get better at chess as a beginner?", "What should a beginner practise first?", "Where do beginners actually lose their games?", "When should beginners study openings?"],
  "how-to-stop-blundering-in-chess": ["How do I stop blundering pieces?", "Why do I blunder more in games than in puzzles?", "What should I check before every move?", "What is a loose piece?"],
  "why-puzzle-rating-doesnt-transfer-to-games": ["Why is my puzzle rating higher than my game rating?", "Why can I solve puzzles but miss tactics in games?", "Do puzzle skills transfer to real games?"],
  "chess-coordinates-practice": ["How do I learn chess coordinates fast?", "How do I know a square's colour without looking?", "Should I practise coordinates from Black's side?", "How do I read squares without counting?"],
  "chess-visualization-exercises": ["How do I improve chess visualization?", "Why does the position fade two moves into a line?", "What is the cover-and-move drill?", "How long does visualization training take?"],
  "how-to-see-the-whole-board-in-chess": ["How do I see the whole board?", "How do I stop tunnel vision in chess?", "Why do I miss long-range bishops and rooks?"],
  "chess-calculation-exercises-for-beginners": ["How do I calculate moves ahead?", "How many moves ahead should a beginner calculate?", "Why do I lose the board after two moves?", "Does Memory Chess teach calculation?"],
  "blindfold-chess-training-for-beginners": ["How do I start playing blindfold chess?", "Do I need to be strong to train blindfold?", "How long does each blindfold stage take?"],
  "chess-memory-training": ["How do I train my chess memory?", "Is 6 pieces in 10 seconds a good score?", "When should I add more pieces to a round?", "Does the leaderboard care about speed?"],
  "chess-pattern-recognition-drills": ["How do I train pattern recognition in chess?", "Is pattern recognition the same as memorising puzzles?", "How many patterns should I learn at once?", "What does a knight fork look like on the board?"],
  "how-to-think-in-chess-for-beginners": ["What should I think about before each move?", "How do I stop moving too fast?", "When should I stop thinking and move?", "How should I use my clock in a 10-minute game?"],
  "20-minute-daily-chess-study-plan": ["What is a good daily chess routine?", "How should I spend 20 minutes on chess?", "How do I study chess with little time?"],
  "how-to-analyze-chess-games-for-beginners": ["How do I analyse my chess games?", "Should beginners use the engine?", "How many games a week should I review?", "Should I review my wins?"],
  "how-many-chess-puzzles-a-day": ["How many chess puzzles should I do a day?", "Is one puzzle a day enough?", "Should I do puzzles before or after games?", "Are themed or mixed puzzles better?"],
};

const SITE = "https://thememorychess.com";
const WORDS_PER_MINUTE = 220;
const PIECE = { K: "k", Q: "q", R: "r", B: "b", N: "n" };

function fenOf(pos) {
  const chess = new Chess();
  if (pos.white || pos.black) {
    chess.clear();
    for (const [color, tokens] of [["w", pos.white || []], ["b", pos.black || []]]) {
      for (const token of tokens) {
        const type = PIECE[token[0]] || "p";
        chess.put({ type, color }, type === "p" ? token : token.slice(1));
      }
    }
    if (pos.toMove === "b") chess.load(chess.fen().replace(" w ", " b "), { skipValidation: true });
  }
  for (const san of pos.line || []) chess.move(san);
  return chess.fen();
}

const span = (text) => text;
const prose = (paragraphs, link) => ({
  kind: "prose",
  paragraphs: paragraphs.map((p) => {
    if (!link) return span(p);
    const at = p.indexOf(link.phrase);
    if (at === -1) return p;
    return [p.slice(0, at), { text: link.phrase, href: link.href }, p.slice(at + link.phrase.length)].filter((s) => s !== "");
  }),
});

function convertBlock(b) {
  switch (b.kind) {
    case "paragraphs": return prose(b.paragraphs, b.link);
    case "steps": return { kind: "list", ordered: b.ordered, items: b.items };
    case "callout": return { kind: "takeaway", title: b.title, body: b.body };
    case "drills":
      return {
        kind: "drills",
        drills: b.drills.map((d) => ({
          title: d.title,
          description: prose([d.description], d.link).paragraphs[0],
          duration: d.duration,
          goal: d.goal,
          ...(d.setup ? { play: { label: d.ctaLabel, pieceCount: d.setup.pieceCount, memorizeTime: d.setup.memorizeTime } } : {}),
        })),
      };
    case "comparison":
      return { kind: "table", columns: b.columns, rows: b.rows.map((r) => ({ label: r.label, cells: [r.struggling, r.stronger] })) };
    case "plan": return { kind: "plan", steps: b.steps };
  }
  throw new Error(`unmapped block kind ${b.kind}`);
}

// Hand-placed diagrams for the two fully curated guides. `after` is the paragraph index the board follows.
const CURATED_BOARDS = {
  "how-to-stop-blundering-in-chess": {
    "puzzle-vs-game": [
      { after: 3, position: "phantom-defender", caption: "The knight on c6 seems to guard e5, but the bishop on b5 pins it to the king on e8.", arrows: [{ from: "b5", to: "e8", kind: "pin" }, { from: "c6", to: "e5", kind: "attack" }], marks: [{ square: "c6", kind: "ring" }] },
      { after: 5, position: "abandoned-job-after-d4", caption: "After d2-d4 the knight on c3 has no defender, although it never moved.", arrows: [], marks: [{ square: "c3", kind: "ring" }] },
    ],
    "loose-bishop-b4": [
      { after: 2, position: "loose-bishop-after-qa4", caption: "Qa4+ checks along b5, c6 and d7 and attacks the undefended bishop on b4.", arrows: [{ from: "a4", to: "e8", kind: "attack" }, { from: "a4", to: "b4", kind: "attack" }], marks: [{ square: "b4", kind: "ring" }] },
    ],
  },
};

const PROTO_CTAS = {
  "how-to-stop-blundering-in-chess": { kind: "cta", target: { kind: "stat", tile: "recentAccuracy", label: "See your recent accuracy" }, why: "A round with an invented seventh piece shows up as a dip in recent accuracy, so watch it fall back as the count habit sets in.", _protoCopy: true },
  "20-minute-daily-chess-study-plan": { kind: "cta", target: { kind: "stat", tile: "days", label: "Count your days played" }, why: "The plan asks for five days a week, and days played is the figure that records whether the twenty minutes happened.", _protoCopy: true },
};

function sectionsOf(g) {
  const curated = CURATED_BOARDS[g.slug];
  const positions = Object.fromEntries(g._positions.map((p) => [p.id, p]));
  return g.sections.map((s) => {
    const blocks = [];
    for (const b of s.blocks) {
      const boards = curated?.[s.id];
      if (b.kind === "paragraphs" && boards) {
        let start = 0;
        for (const board of boards) {
          const pos = positions[board.position];
          blocks.push(prose(b.paragraphs.slice(start, board.after + 1), b.link));
          blocks.push({ kind: "board", id: pos.id, fen: fenOf(pos), toMove: (pos.toMove || "w"), arrows: board.arrows, marks: board.marks, caption: board.caption, claims: pos.claims });
          start = board.after + 1;
        }
        if (start < b.paragraphs.length) blocks.push(prose(b.paragraphs.slice(start), b.link));
      } else {
        blocks.push(convertBlock(b));
      }
    }
    return { id: s.id, heading: s.title, ...(s.summary ? { summary: s.summary } : {}), blocks };
  });
}

function endOf(g) {
  const end = [];
  const firstPlay = g._drillCtas.find((d) => d.setup);
  if (firstPlay) end.push({ kind: "cta", target: { kind: "game", label: g.ctaLabel, pieceCount: firstPlay.setup.pieceCount, memorizeTime: firstPlay.setup.memorizeTime }, why: g.quickAnswer });
  if (PROTO_CTAS[g.slug]) end.push(PROTO_CTAS[g.slug]);
  for (const fr of g.furtherReading || []) {
    const a = articles.find((x) => x.slug === fr.slug);
    end.push({ kind: "cta", target: { kind: "article", slug: fr.slug, label: a.title }, why: fr.anchor });
  }
  if (g.faq.length) end.push({ kind: "faq", items: g.faq });
  end.push({ kind: "furtherReading", items: g.relatedArticles.map((r) => ({ kind: "guide", slug: r.slug, reason: r.reason })) });
  if (g.sources.length) end.push({ kind: "sources", items: g.sources });
  return end;
}

const LEVEL = { Beginner: "beginner", "Beginner to Intermediate": "improver" };
const GUIDES = guides.map((g) => ({
  slug: g.slug,
  url: `/learn/${g.slug}`,
  title: g.title,
  h1: g.h1,
  description: g.description,
  group: GROUP_OF[g.slug],
  level: LEVEL[g.difficulty],
  readingMinutes: Math.max(3, Math.round(g._words / WORDS_PER_MINUTE)),
  words: g._words,
  timeToReadToday: g.timeToRead,
  featured: Boolean(g.featured),
  publishedAt: g.publishedAt,
  updatedAt: g.updatedAt,
  questions: QUESTIONS[g.slug],
  keywords: { primary: g.primaryKeyword, secondary: g.secondaryKeywords },
  quickAnswer: g.quickAnswer,
  takeaways: g.keyTakeaways || [],
  audience: g.whoThisIsFor || [],
  headings: g.sections.map((s) => s.title),
  faqQuestions: g.faq.map((f) => f.question),
  relatedGuides: g.relatedArticles.map((r) => r.slug),
  articles: (g.furtherReading || []).map((f) => f.slug),
  primaryCta: { label: g.ctaLabel, ...(g._drillCtas.find((d) => d.setup)?.setup || {}) },
  bodyText: g.sections.flatMap((s) => s.blocks.flatMap((b) => b.paragraphs || b.items || [])).join(" "),
}));

const DOCS = Object.fromEntries(guides.map((g) => [g.slug, {
  meta: GUIDES.find((x) => x.slug === g.slug),
  intro: { quickAnswer: g.quickAnswer, takeaways: g.keyTakeaways || [], audience: g.whoThisIsFor || [] },
  sections: sectionsOf(g),
  end: endOf(g),
  facts: g._positions.filter((p) => !Object.values(CURATED_BOARDS[g.slug] || {}).flat().some((b) => b.position === p.id)).map((p) => ({ id: p.id, sectionId: p.sectionId, fen: fenOf(p) })),
  curated: Boolean(CURATED_BOARDS[g.slug]) || g.slug === "20-minute-daily-chess-study-plan",
}]));

const ARTICLES = articles.map((a) => ({
  slug: a.slug,
  url: `/articles/${a.slug}`,
  title: a.title,
  searchTitle: a.searchTitle || a.title,
  description: a.description,
  person: a.person,
  words: a.words,
  headings: a.sections,
  image: `${SITE}${a.photo.src}`,
  imageCredit: `${a.photo.author}, ${a.photo.license}`,
  drill: { pieceCount: a.drill.pieceCount, memorizeTime: a.drill.memorizeTime },
  relatedGuides: (a.relatedGuides || []).map((r) => r.slug),
}));

const DASHBOARD_STATS = {
  rating: "Skill rating", span: "Memory span", piecesHeld: "Pieces held", speed: "Speed",
  bestAccuracy: "Best accuracy", recentAccuracy: "Recent accuracy", winStreak: "Win streak", streak: "Day streak",
  rounds: "Rounds played", days: "Days played",
};

const SYNONYMS = [
  ["blunder", "hang", "hanging", "drop", "lose piece", "mistake", "loose"],
  ["visualization", "visualisation", "visualize", "visualise", "mental board", "picture", "see ahead"],
  ["calculation", "calculate", "look ahead", "think ahead", "moves ahead", "variation", "line"],
  ["blindfold", "without a board", "no board", "mental chess"],
  ["coordinates", "notation", "squares", "algebraic", "square names"],
  ["puzzle", "puzzles", "tactic", "tactics", "exercise"],
  ["memory", "memorise", "memorize", "remember", "recall"],
  ["pattern", "patterns", "motif", "motifs", "chunk", "chunking", "shape"],
  ["analyze", "analyse", "analysis", "review", "post mortem", "study my games"],
  ["routine", "plan", "schedule", "daily", "habit", "study plan"],
  ["beginner", "new", "novice", "starter", "improve", "better"],
  ["rating", "elo", "rank"],
  ["whole board", "board vision", "tunnel vision", "peripheral", "board awareness"],
  ["think", "thought process", "decide", "candidate moves"],
];

const out = `// Generated by tools/build-content.cjs from the production guide and article files. Throwaway prototype data.
// GUIDES: hub-level inventory for all 14 guides. DOCS: every guide in the template shape (docs/plans/learn-revamp/template.md).
// DOCS[slug].curated is true for the two guides whose diagrams and stat CTAs were placed by hand.
export const SITE = ${JSON.stringify(SITE)};
export const GROUPS = ${JSON.stringify(GROUPS, null, 2)};
export const GUIDES = ${JSON.stringify(GUIDES, null, 2)};
export const DOCS = ${JSON.stringify(DOCS, null, 2)};
export const ARTICLES = ${JSON.stringify(ARTICLES, null, 2)};
export const DASHBOARD_STATS = ${JSON.stringify(DASHBOARD_STATS, null, 2)};
export const SYNONYMS = ${JSON.stringify(SYNONYMS)};
export const CURATED = ["how-to-stop-blundering-in-chess", "20-minute-daily-chess-study-plan"];
`;
fs.writeFileSync(outFile, out);
for (const g of GROUPS) console.log(g.id, GUIDES.filter((x) => x.group === g.id).map((x) => `${x.slug}(${x.words}w,${x.readingMinutes}m vs ${x.timeToReadToday})`).join(", "));
const sb = DOCS["how-to-stop-blundering-in-chess"];
console.log(sb.sections.map((s) => s.id + ":" + s.blocks.map((b) => b.kind).join("+")).join(" | "));
console.log(sb.sections.flatMap((s) => s.blocks).filter((b) => b.kind === "board").map((b) => b.id + " " + b.fen).join("\n"));
console.log("end:", sb.end.map((b) => b.kind + (b.target ? "/" + b.target.kind : "")).join(", "));
console.log("bytes", out.length);
