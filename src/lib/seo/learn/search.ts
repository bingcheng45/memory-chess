/**
 * Learn search: ranks guides and articles against a reader's question (docs/plans/learn-revamp/search.md).
 * Pure and dependency-free, so the hub ranks in the browser and /learn/search ranks on the server with one module.
 */

export const SEARCH_FIELDS = ["questions", "title", "keywords", "headings", "description", "body"] as const;
export type SearchField = (typeof SEARCH_FIELDS)[number];

export type SearchDoc = {
  readonly kind: "guide" | "article";
  readonly slug: string;
  readonly url: string;
  readonly title: string;
  /** The group label for a guide; null for an article. */
  readonly group: string | null;
  readonly questions: readonly string[];
  readonly fields: Readonly<Record<SearchField, string>>;
};

export type SearchResult = {
  readonly kind: SearchDoc["kind"];
  readonly slug: string;
  readonly url: string;
  readonly title: string;
  readonly group: string | null;
  readonly score: number;
  readonly matchedQuestion: string | null;
  /** Every query term is a content word in the page's title. IDF falls for a word most pages use ("memory" here), so the score alone undersells this. */
  readonly titleMatch: boolean;
};

const FIELD_WEIGHTS: Readonly<Record<SearchField, number>> = {
  questions: 6,
  title: 5,
  keywords: 4,
  headings: 2.5,
  description: 2,
  body: 1,
};
/** Learn search exists to send people to training, so an article wins only when the query names its subject. */
const ARTICLE_FACTOR = 0.6;
const QUESTION_MATCH_SHARE = 0.6;
const QUESTION_BONUS = 8;
const PREFIX_CLOSENESS = 0.8;
const TYPO_CLOSENESS = 0.5;
/** A typo match in prose matched ordinary words ("stuck" to "stick"), so typos count only in short curated fields. */
const TYPO_FIELDS: ReadonlySet<SearchField> = new Set(["questions", "title", "keywords", "headings"]);
/** Results under this share of the top score are noise that only a stray word matched. */
const TAIL_CUT = 0.2;
/** A top score under this is a loose match, shown as "Closest guides". */
export const WEAK_SCORE = 2;
export const RESULT_LIMIT = 8;

const STOP_WORDS = new Set(
  "a an and are at be by can do does for from how i in is it my of on or should the to what when where which who why with you your me than keep".split(
    " ",
  ),
);

/** A title holding one of these ("seven", "by the numbers", "played") says nothing about what the page teaches. */
const FILLER_WORDS = new Set(
  "zero one two three four five six seven eight nine ten eleven twelve fifteen twenty hundred thousand number played".split(" "),
);
const isContentWord = (term: string) => !FILLER_WORDS.has(term) && !/^\d+$/.test(term);

const SYNONYM_RINGS: readonly (readonly string[])[] = [
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

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/memory chess/g, " ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ");
}

function stem(word: string): string {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("es") && !word.endsWith("ses")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** "chess" is on every page, so it carries no signal. */
const tokens = (text: string): string[] =>
  normalise(text)
    .split(/[\s-]+/)
    .filter((word) => word && word !== "chess" && !STOP_WORDS.has(word))
    .map(stem);

const CANONICAL = new Map<string, string>(
  SYNONYM_RINGS.flatMap((ring) => {
    const head = tokens(ring[0]).join(" ");
    return ring.map((member) => [tokens(member).join(" "), head] as const);
  }),
);

/** Maps each term onto its synonym ring's head, two-word members first, so "hang" and "blunder" meet. */
function canonical(words: readonly string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const pair = i + 1 < words.length ? CANONICAL.get(`${words[i]} ${words[i + 1]}`) : undefined;
    if (pair) {
      out.push(...pair.split(" "));
      i++;
      continue;
    }
    out.push(...(CANONICAL.get(words[i]) ?? words[i]).split(" "));
  }
  return out;
}

const terms = (text: string) => canonical(tokens(text));

/** Damerau edit distance of at most `max`, with an early exit once every cell in a row passes it. */
function withinEdits(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return false;
  }
  return d[a.length][b.length] <= max;
}

const typoBudget = (word: string) => (word.length >= 8 ? 2 : word.length >= 4 ? 1 : 0);

type PreparedDoc = SearchDoc & {
  readonly terms: Readonly<Record<SearchField, readonly string[]>>;
  readonly titleTerms: ReadonlySet<string>;
  readonly questionTerms: readonly { readonly text: string; readonly terms: ReadonlySet<string> }[];
};

export type SearchIndex = {
  readonly docs: readonly PreparedDoc[];
  readonly vocabulary: readonly string[];
  readonly documentFrequency: ReadonlyMap<string, number>;
};

export function prepareIndex(docs: readonly SearchDoc[]): SearchIndex {
  const prepared = docs.map(
    (doc): PreparedDoc => ({
      ...doc,
      terms: Object.fromEntries(SEARCH_FIELDS.map((field) => [field, terms(doc.fields[field])])) as Record<SearchField, string[]>,
      titleTerms: new Set(terms(doc.title)),
      questionTerms: doc.questions.map((text) => ({ text, terms: new Set(terms(text)) })),
    }),
  );
  const documentFrequency = new Map<string, number>();
  for (const doc of prepared) {
    for (const term of new Set(SEARCH_FIELDS.flatMap((field) => doc.terms[field]))) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }
  return { docs: prepared, vocabulary: [...documentFrequency.keys()], documentFrequency };
}

/** The vocabulary words a query term could mean: itself, a completion of the last term, and words within its typo budget. */
function expand(term: string, index: SearchIndex, isLast: boolean): Map<string, number> {
  const out = new Map([[term, 1]]);
  for (const word of index.vocabulary) {
    if (word === term) continue;
    if (isLast && term.length >= 3 && word.startsWith(term)) out.set(word, Math.max(out.get(word) ?? 0, PREFIX_CLOSENESS));
    else if (typoBudget(term) > 0 && withinEdits(term, word, typoBudget(term))) {
      out.set(word, Math.max(out.get(word) ?? 0, TYPO_CLOSENESS));
    }
  }
  return out;
}

function termScore(doc: PreparedDoc, variants: ReadonlyMap<string, number>, index: SearchIndex): number {
  let best = 0;
  for (const [word, closeness] of variants) {
    const df = index.documentFrequency.get(word) ?? 0;
    const idf = Math.log(1 + (index.docs.length - df + 0.5) / (df + 0.5));
    for (const field of SEARCH_FIELDS) {
      if (closeness === TYPO_CLOSENESS && !TYPO_FIELDS.has(field)) continue;
      const tf = doc.terms[field].filter((term) => term === word).length;
      if (tf > 0) best = Math.max(best, FIELD_WEIGHTS[field] * idf * closeness * (tf / (tf + 1.2)));
    }
  }
  return best;
}

/** The question this guide answers that shares most of the query, when the query has two or more terms. */
function matchedQuestion(doc: PreparedDoc, query: readonly string[]): { text: string; share: number } | null {
  if (query.length < 2) return null;
  let best: { text: string; share: number } | null = null;
  for (const question of doc.questionTerms) {
    const share = query.filter((term) => question.terms.has(term)).length / query.length;
    if (share >= QUESTION_MATCH_SHARE && (!best || share > best.share)) best = { text: question.text, share };
  }
  return best;
}

/** Ranks every document against `query`, best first, dropping the tail under a fifth of the top score. */
export function search(query: string, index: SearchIndex, limit = RESULT_LIMIT): SearchResult[] {
  const queryTerms = [...new Set(terms(query))];
  if (queryTerms.length === 0) return [];
  const expanded = queryTerms.map((term, i) => expand(term, index, i === queryTerms.length - 1));

  const scored = index.docs.flatMap((doc): SearchResult[] => {
    const perTerm = expanded.map((variants) => termScore(doc, variants, index));
    const sum = perTerm.reduce((total, value) => total + value, 0);
    if (sum === 0) return [];
    const coverage = perTerm.filter((value) => value > 0).length / queryTerms.length;
    const question = matchedQuestion(doc, queryTerms);
    const factor = doc.kind === "article" ? ARTICLE_FACTOR : 1;
    const score = (sum * coverage * coverage + (question ? QUESTION_BONUS * question.share : 0)) * factor;
    return [
      {
        kind: doc.kind,
        slug: doc.slug,
        url: doc.url,
        title: doc.title,
        group: doc.group,
        score: Math.round(score * 100) / 100,
        matchedQuestion: question?.text ?? null,
        titleMatch: queryTerms.every((term) => isContentWord(term) && doc.titleTerms.has(term)),
      },
    ];
  });

  const sorted = scored.sort((a, b) => b.score - a.score);
  const top = sorted[0]?.score ?? 0;
  return sorted.filter((result) => result.score >= top * TAIL_CUT).slice(0, limit);
}

/** The words of `text`, each marked when it means one of the query's terms. Spaces and punctuation stay with the word before. */
export function markQueryWords(text: string, query: string): { readonly text: string; readonly mark: boolean }[] {
  const wanted = new Set(terms(query));
  return text.split(/(?<=\s)/).map((word) => ({ text: word, mark: terms(word).some((term) => wanted.has(term)) }));
}

export type SearchOutcome = "none" | "weak" | "strong";

export function outcomeOf(results: readonly SearchResult[], query: string): SearchOutcome {
  if (results.length === 0) return "none";
  if (!terms(query).some(isContentWord)) return "weak";
  return results[0].score >= WEAK_SCORE || results[0].titleMatch ? "strong" : "weak";
}
