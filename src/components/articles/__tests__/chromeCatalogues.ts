import english from "../../../../messages/en.json";

const GERMAN_ARTICLES = {
  meta: {
    title: "Artikel über Schachspieler",
    description: "Porträts von Schachspielern.",
  },
  list: {
    heading: "Artikel",
    sub: "Schachspieler und Gedächtnisforscher, ein Porträt nach dem anderen.",
    aboutHeading: "So entstehen diese Artikel",
    about1: "Jeder Artikel folgt einer Person und einer Frage zu ihrem Gedächtnis.",
    about2: "Jeder Artikel hat dieselben Teile.",
    about3: "Die Artikel werden mit KI-Unterstützung recherchiert und geprüft.",
    corrections: "Wenn hier etwas nicht stimmt, <link>schick uns eine Korrektur</link>.",
  },
  sort: {
    label: "Reihenfolge",
    group: "Artikel ordnen",
    options: { newest: "Neueste", views: "Meistgesehen", likes: "Beliebteste" },
  },
  pager: {
    label: "Seiten",
    previous: "Vorherige Seite",
    next: "Nächste Seite",
    page: "Seite {page}",
    showing: "{first} bis {last} von {total}",
  },
  counts: {
    views: "{count, plural, one {# Aufruf} other {# Aufrufe}}",
    likes: "{count, plural, one {# Empfehlung} other {# Empfehlungen}}",
  },
  like: {
    button: "Artikel empfehlen",
    failed: "Das wurde nicht gespeichert. Versuch es noch einmal.",
  },
  page: {
    backToList: "Alle Artikel",
    showAll: "Ganzen Text zeigen",
    byline: "Von <author>{name}</author>",
    authorshipNote: "Mit KI-Unterstützung aus den unten genannten Quellen recherchiert und entworfen.",
    translationNote: "Mit KI-Unterstützung aus dem Englischen übersetzt. Maßgeblich ist der englische Artikel.",
    readInEnglish: "Auf Englisch lesen",
    photoCredit: "Foto: {author}, <licenseLink>{license}</licenseLink>, über <source>Wikimedia Commons</source>. {changes}.",
    factFile: "Steckbrief",
    facts: {
      born: "Geboren",
      died: "Gestorben",
      country: "Land",
      title: "Titel",
      peakRating: "Höchste Wertung",
      worldChampion: "Weltmeister",
      knownFor: "Bekannt für",
      memoryFeat: "Gedächtnisleistung",
    },
    drillHeading: "Du bist dran",
    drillAction:
      "{pieces, plural, one {# Figur} other {# Figuren}}, {seconds, plural, one {# Sekunde} other {# Sekunden}} spielen",
    sources: "Quellen",
    nextArticle: "Nächster Artikel",
  },
};

export const GERMAN_MESSAGES = { ...english, articles: { ...english.articles, ...GERMAN_ARTICLES } };

export const TOKEN = /^«articles\.[\w.]+»$/;

function tokensFor(value: unknown, keyPath: string): unknown {
  if (typeof value === "string") return `«${keyPath}»`;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, tokensFor(entry, `${keyPath}.${key}`)]),
  );
}

// Every `articles` string is its own key path, so a hard-coded literal has no token.
export const TOKEN_MESSAGES = { ...english, articles: tokensFor(english.articles, "articles") };
