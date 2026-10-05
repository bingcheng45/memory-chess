const THIS_FILE = "scripts/articles-i18n/language.mjs";
const WORD = /[\p{L}\p{M}]+/gu;
const LETTER = /\p{L}/gu;

const wordsOf = (text) => text.toLowerCase().match(WORD) ?? [];
const lettersOf = (text) => text.match(LETTER) ?? [];

function byWords(list) {
  const words = new Set(list.split(" "));
  return { unit: "words", tokensOf: wordsOf, has: (word) => words.has(word) };
}

const byCharacters = (pattern) => ({ unit: "characters", tokensOf: lettersOf, has: (letter) => pattern.test(letter) });

/**
 * What tells each locale from the others that are written alike. A locale
 * read by words has the commonest function words of its language, the ones it
 * shares with a neighbour included: two locales are told apart by the words
 * only one of the two lists has, so a missing shared word would count against
 * the neighbour. A locale read by characters has the characters only it uses
 * among the locales written with Han characters: the simplified or the
 * traditional form of the same common characters, and the kana of Japanese.
 */
const PROFILES = {
  es: byWords("de la que el en y a los se del las un por con no una su para es al lo como más pero sus le ya o fue este ha porque esta son entre está cuando muy sin sobre ser también hasta hay donde desde había era dos años"),
  "pt-BR": byWords("de a o que e do da em um para é com não uma os no se na por mais as dos como mas foi ao ele das tem à seu sua ou ser quando muito há nos já está também só pelo pela até isso ela entre era depois sem mesmo aos seus tinha foram anos"),
  it: byWords("di e il la che in a per un è del non una le con si da i più come ma al dei anche o lo ha della nel gli sono alla questo se delle su l d dell nell all era fu suo sua loro tra due essere dopo quando cui dal dalla degli alle aveva anni"),
  fr: byWords("de la le et les des en un du une que est pour qui dans a par plus pas au sur ne se ce il sont avec son à ou comme mais été aux cette d l qu n s ont elle était ses leur deux y on sa fait être c lui entre sans après ans aussi"),
  de: byWords("der die und in den von zu das mit sich des auf für ist im dem nicht ein eine als auch es an werden aus er hat dass sie nach wird bei einer um am sind noch wie einem über einen so zum war haben nur oder aber vor zur bis mehr durch wurde du"),
  nl: byWords("de van het een en in is dat op te zijn met voor niet aan er om ook als dan maar bij of uit nog naar door over ze zich tot was heeft hij worden wordt die deze dit werd na hun had waren meer geen jaar"),
  sv: byWords("och i att det som en på är av för med till den har de inte om ett han men var sig från så kan man när år hade efter hon vid också ut än eller sin nu över under upp mot skulle där blev varit mellan någon mycket spelade du sa"),
  no: byWords("og i å at det som en på er av for med til den har de ikke om et han men var seg fra så kan man når år hadde etter hun ved også ut enn eller sin nå over under opp mot skulle der ble vært hva noe blitt uten mer mellom noen mye spilte husket du sa"),
  da: byWords("og i at det som en på er af for med til den har de ikke om et han men var sig fra så kan man når år havde efter hun ved også ud end eller sin nu over under op mod skulle der blev været hvad noget blevet uden mere mellem nogen meget spillede huskede du"),
  fi: byWords("ja on oli että ei se hän myös kuin mutta kun jossa sekä joka ovat tai vain hänen niin sen ole jo mukaan vuonna olivat tämä jotka sitä kanssa ennen jälkeen he ne nyt vielä kuitenkin sillä siitä"),
  pl: byWords("w i z na się nie do to że jest o a jak po od za przez ale co tak dla jego są był oraz czy tym być ich ma lub który już jej tego też przy pod tylko były roku ze które"),
  cs: byWords("a v se na je že s z o do i to ve pro jako ale za by si po byl jsou jeho tak už ze který které od však při aby jen být bylo také k u mezi roce roku jej"),
  ro: byWords("de și în a la cu să pe o nu un că din care se este mai au pentru ca al sau ale lui fost dar prin fi era după sunt ei cele până cel între iar le spre fără când doar"),
  hu: byWords("a az és hogy nem is egy volt meg csak mint még vagy ez már azt ő pedig de el ki be ha van volna után között amely amikor majd mert több két által lehet ezt akkor szerint"),
  tr: byWords("ve bir bu için ile olarak çok daha gibi kadar sonra ancak ise her olan da de en o ne ama ya hem ki değil var yıl iki ilk kendi bunu onun arasında tarafından göre"),
  id: byWords("yang dan di dari dengan untuk pada ini itu tidak dalam ia juga oleh sebagai atau karena adalah ke para akan telah lebih dapat saat tahun bahwa ada mereka sudah hanya seorang namun setelah tersebut bisa menjadi"),
  vi: byWords("và của là một có trong không được cho với các này đã ông người những khi như để từ ra đó cũng vào về lại ở bà nhưng năm còn hai nhiều trên sau đến thì mà"),
  ru: byWords("и в не на что он с как это по но из у за от же был его она они"),
  "zh-CN": byCharacters(/[这们说个时国为来对会发现记忆盘书岁际长]/u),
  "zh-TW": byCharacters(/[這們說個時國為來對會發現記憶盤書歲際長]/u),
  ja: byCharacters(/[\p{Script=Hiragana}\p{Script=Katakana}]/u),
};

/** No other shipped locale is written in the script of these, so the script rule of `checks.mjs` reads their language. */
const READ_BY_SCRIPT_ALONE = ["hi", "ko"];

export const LANGUAGE_LIMITS = {
  /** A whole article is read from this many words, or letters for a locale read by its characters. */
  minSizeOfAWhole: 100,
  /** One leaf is read from this many. A shorter leaf can be a list of names. */
  minSizeOfALeaf: 40,
  /** How many more signs of another locale than of its own a leaf may have before it reads as that locale. */
  maxLeadInALeaf: 3,
  /**
   * The least share of an article that is its locale's own words or characters:
   * about half the lowest share of an installed article, which is 15.8% in
   * Turkish and 7.9% in Traditional Chinese.
   */
  minShareOfAWhole: { words: 0.08, characters: 0.04 },
};

const countOf = (tokens, isCounted) => tokens.filter(isCounted).length;

/**
 * How `text` reads in `locale`: its size in the locale's unit, the share of it
 * that is the locale's own, and against each locale written alike the count of
 * what only one of the two has. Undefined for a locale with no profile.
 */
export function readingOf(locale, text) {
  const profile = PROFILES[locale];
  if (profile === undefined) return undefined;
  const tokens = profile.tokensOf(text);
  const rivals = Object.entries(PROFILES).filter(([other, { unit }]) => other !== locale && unit === profile.unit);

  return {
    unit: profile.unit,
    size: tokens.length,
    share: countOf(tokens, profile.has) / Math.max(tokens.length, 1),
    rivals: rivals.map(([other, rival]) => ({
      locale: other,
      own: countOf(tokens, (token) => profile.has(token) && !rival.has(token)),
      theirs: countOf(tokens, (token) => rival.has(token) && !profile.has(token)),
    })),
  };
}

const leadOf = ({ own, theirs }) => theirs - own;

/** Why `text` does not read as `locale`. A text under `minSize` and a locale with no profile are not read. */
function languageProblems(locale, text, { minSize, maxLead, minShare }) {
  const reading = readingOf(locale, text);
  if (reading === undefined || reading.size < minSize) return [];
  const { unit, size, share, rivals } = reading;
  const closest = rivals.reduce((top, rival) => (leadOf(rival) > leadOf(top) ? rival : top));

  if (leadOf(closest) > maxLead) {
    return [`reads as ${closest.locale}, not ${locale}: ${closest.theirs} ${unit} of ${closest.locale} that ${locale} does not have, and ${closest.own} the other way`];
  }
  if (share < minShare) {
    return [`does not read as ${locale}: ${(share * 100).toFixed(1)}% of its ${size} ${unit} are common in ${locale}, the least is ${minShare * 100}%`];
  }
  return [];
}

export function missingLanguageRuleProblems(locale) {
  if (Object.hasOwn(PROFILES, locale) || READ_BY_SCRIPT_ALONE.includes(locale)) return [];
  return [`${locale}: no language rule, add one to ${THIS_FILE}`];
}

/**
 * Why the running text of one article, or the strings of the section, is not
 * written in the language of `locale`: the text as a whole reads as another
 * locale's or has too little of its own, and each long leaf that reads as
 * another locale's. A short leaf is not read by itself, because a quoted
 * title or a list of names says nothing about the language around it.
 *
 * @param {string} locale
 * @param {string} name the article's slug, or `chrome`
 * @param {[path: string, text: string][]} leaves the text a reader reads as prose
 * @returns {string[]}
 */
export function languageFailures(locale, name, leaves) {
  const unit = PROFILES[locale]?.unit;
  const whole = { minSize: LANGUAGE_LIMITS.minSizeOfAWhole, maxLead: 0, minShare: LANGUAGE_LIMITS.minShareOfAWhole[unit] };
  const oneLeaf = { minSize: LANGUAGE_LIMITS.minSizeOfALeaf, maxLead: LANGUAGE_LIMITS.maxLeadInALeaf, minShare: 0 };
  const everyLeaf = leaves.map(([, text]) => text).join(" ");

  return [
    ...languageProblems(locale, everyLeaf, whole).map((problem) => `${name}: the text as a whole ${problem}`),
    ...leaves.flatMap(([path, text]) => languageProblems(locale, text, oneLeaf).map((problem) => `${name} ${path}: ${problem}`)),
  ];
}
