const CONTAINED_ANYWHERE = [
  'fuck', 'fvck', 'phuck', 'shit', 'penis', 'pussy', 'bitch', 'whore', 'vagina', 'nigger', 'nigga', 'niqqer',
  'faggot', 'hitler', 'dildo', 'asshole', 'dickhead', 'bigdick', 'bigcock', 'pedophile',
];

const WHOLE_WORD = [
  'dick', 'cock', 'cunt', 'cvnt', 'cum', 'anus', 'ass', 'tit', 'slut', 'rape', 'rapist', 'nazi', 'fag', 'twat',
  'wank', 'wanker', 'porn', 'fck', 'fuk', 'retard', 'retarded', 'pedo',
];

const WHOLE_WORDS = new Set(WHOLE_WORD.flatMap((word) => [word, `${word}s`]));

/** Real words and places that contain a blocked term. */
const ALLOWED_WORD = /^(shi+takes?|mishits?|snigger(s|ed|ing)?|penistone|bitchin)$/;

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
  const wordsHit = words.some((word) =>
    readings(word).some((reading) => WHOLE_WORDS.has(reading) || hasTerm(reading, CONTAINED_ANYWHERE)),
  );
  if (wordsHit) return true;
  const longTerms = CONTAINED_ANYWHERE.filter((term) => term.length >= MIN_LENGTH_ACROSS_WORDS);
  return readings(words.join('')).some((reading) => hasTerm(reading, longTerms));
}
