const CONTAINED_ANYWHERE = [
  'fuck', 'fvck', 'phuck', 'penis', 'pussy', 'bitch', 'whore', 'vagina', 'nigger', 'nigga', 'niqqer',
  'faggot', 'hitler', 'dildo', 'asshole', 'dickhead', 'bigdick', 'bigcock', 'pedophile',
];

const WHOLE_WORD = [
  'dick', 'cock', 'cunt', 'cvnt', 'cum', 'anus', 'ass', 'tit', 'slut', 'rape', 'rapist', 'nazi', 'fag', 'twat',
  'wank', 'wanker', 'porn', 'fck', 'fuk', 'retard', 'retarded', 'pedo',
];

const COMPOUNDS_WITHIN_WORD = ['bullshit', 'horseshit', 'dipshit', 'batshit', 'apeshit'];

/** "shit" hides inside real names (Matsushita, Takeshita), so it counts only at the start of a word, and not before a, i, o or u (Shitara, Shitij). */
const SHIT_AT_WORD_START = /^shit(?![aiou])/;

const WHOLE_WORDS = new Set(WHOLE_WORD.flatMap((word) => [word, `${word}s`]));

/** Real words and places that contain a blocked term. */
const ALLOWED_WORD = /^(shi+takes?|mishits?|snigger(s|ed|ing)?|peniston(e)?|bitchin|pussycats?)$/;

const MIN_LENGTH_ACROSS_WORDS = 5;

const LOOKALIKES: Record<string, string> = { '0': 'o', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '!': 'i' };

function plainWords(name: string): string[] {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/(?<=\p{Ll})(?=\p{Lu})|(?<=\p{Lu})(?=\p{Lu}\p{Ll})/gu, ' ')
    .toLowerCase()
    .split(/[^a-z0-9@$!]+/)
    .filter((word) => word !== '' && !ALLOWED_WORD.test(word));
}

/** Digits alone are numbers, not letters, so "455" is not read as "ass". A one is read as an i and as an l, since leetspeak uses it for both. */
function readings(text: string): string[] {
  if (!/\p{L}/u.test(text)) return [text];
  const mapped = [...text].map((char) => LOOKALIKES[char] ?? char).join('');
  return [mapped.replaceAll('1', 'i'), mapped.replaceAll('1', 'l')];
}

const PUSSY_CAT_NAME = /^pussy cats?$/;

function hasTerm(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term));
}

/**
 * Whole-word terms such as "dick" and "ass" would flag "Cassandra" or "Scunthorpe" if they matched inside a word,
 * so they match only a name's separate words, camel-case parts included ("BigDick"). Longer terms match anywhere,
 * including across separators ("p.e.n.i.s"). Spaced short terms ("f u c k") are not caught, since joining words
 * would flag "Mass Hit".
 */
export function isBlockedName(name: string): boolean {
  const words = plainWords(name);
  if (PUSSY_CAT_NAME.test(words.join(' '))) return false;
  const wordsHit = words.some((word) =>
    readings(word).some(
      (reading) =>
        WHOLE_WORDS.has(reading) ||
        SHIT_AT_WORD_START.test(reading) ||
        hasTerm(reading, CONTAINED_ANYWHERE) ||
        hasTerm(reading, COMPOUNDS_WITHIN_WORD),
    ),
  );
  if (wordsHit) return true;
  const longTerms = CONTAINED_ANYWHERE.filter((term) => term.length >= MIN_LENGTH_ACROSS_WORDS);
  return readings(words.join('')).some((reading) => hasTerm(reading, longTerms));
}
