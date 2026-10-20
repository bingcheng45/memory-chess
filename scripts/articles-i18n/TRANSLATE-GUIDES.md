# Translate the Learn guides into one language

You translate the Learn guides listed in `src/lib/seo/learn/translatedGuides.ts` and the strings their page
draws around them into one language. This recipe calls that language `<locale>`, for example `de`. A second
agent reviews your work after you. The tool `scripts/articles-i18n.mjs --guides` checks a translation and
writes it into the repo.

A translated guide is read by players and AI assistants, which quote it to players who ask in your language.
It is kept out of search until its locale is turned on in `GUIDE_LOCALE_INDEXING`, and may be indexed then. Every number, setting and claim must stay exactly what the English says. A drill that tells
a reader the wrong piece count or the wrong button sends them to the wrong round.

Run every command from the repo root, with Node 22.18 or newer. Keep each shell command plain: one command,
or plain commands joined with `&&`. Write files with your file-writing tool, not with a shell heredoc. Read
JSON files with your file-reading tool, because a long file printed in the shell is cut short.

## What you may write

- Your working directory, `.verify-evidence/guides-i18n/<locale>/`. Git ignores it.
- Nothing else by hand. `import` writes `src/lib/seo/learn/translations/<locale>/` for you.

Do not edit an English guide, another locale, a script, a message catalogue or this recipe. Do not run
`approve`, and do not commit. If the tool or this recipe looks wrong, stop and say so in your report.

## Steps

1. Export the English text.

	```
	node scripts/articles-i18n.mjs --guides export .verify-evidence/guides-i18n/english
	```

	You get one `<slug>.source.json` per guide and `chrome.source.json`, each `{ "name", "sourceHash", "text" }`.
	Open `src/lib/seo/learn/guides/<slug>.ts` too when you need context: it shows each string next to the
	board, drill or round it belongs to.

2. Read `messages/<locale>.json` for the words the game already uses in your language: the pieces, the board,
   a round, memorizing, accuracy, and how it addresses the player (`game`, `home`, `dashboard`). Use the same
   words and the same form of address. The button names are in `game.result` and `game.round`.

3. Find how chess writers in your language name the ideas the guides use, before you write: blindfold chess,
   board vision, visualization, calculation, a blunder, a hanging or loose piece, a fork, a pin, a check, a
   capture, a threat, candidate moves, algebraic notation, a tempo. Search the web for your language's
   Wikipedia chess articles and its national federation or chess press, and use what they use. For example,
   German writes "Blindschach" or "Blindspiel", French "partie à l'aveugle" or "jouer à l'aveugle", Spanish
   "ajedrez a ciegas", Portuguese "xadrez às cegas", Russian "игра вслепую". Note the terms you chose and
   where you saw them, for your report. Piece letters in notation (`Nf3`, `Bc4`) stay as the English text has
   them: the site and its boards use English notation. Where a guide first uses a piece letter, add one short
   legend in your language that says the site writes pieces with the English letters K, Q, R, B, N and gives
   your language's letters, as the installed translations in `src/lib/seo/learn/translations/de/` do.

4. For each source file, write `.verify-evidence/guides-i18n/<locale>/<name>.json`: the `text` object alone,
   with the same keys in the same order and the same number of items in every list, and every string
   translated. Section keys such as `"why-games-collapse"` are anchor ids. Keep them exactly as they are.

5. Check the directory, fix every line it prints, and check again until it prints `ok`.

	```
	node scripts/articles-i18n.mjs --guides check <locale> .verify-evidence/guides-i18n/<locale>
	```

6. Install it. `import` runs the same check and writes nothing when it fails.

	```
	node scripts/articles-i18n.mjs --guides import <locale> .verify-evidence/guides-i18n/<locale>
	```

## Tags and placeholders

Every string is an ICU message.

- A link in running text is a numbered tag, `<l0>blindfold chess training</l0>`. Keep each tag once, with its
  number. Translate the words inside it and move it to where the linked words fall in your sentence.
- Chrome strings have placeholders such as `{minutes}`, `{date}` and plurals such as
  `{count, plural, one {# piece} other {# pieces}}`. Never translate a placeholder name. A plural keeps `#`
  and needs every category your language uses (the check names the missing ones).
- An apostrophe next to `{` or `<` starts quoted ICU text. Write such a phrase so the apostrophe is not next
  to a brace or a tag. Never write `{` or `}` in a guide text.

## What must stay true

- Every number stays, written as digits where the English has digits: piece counts, seconds, minutes, days,
  weeks, percentages, years, ratings. The check fails a translation that loses or changes one. A number the
  English writes as a word ("six pieces", "ten seconds") stays the same number in words.
- Button names are the game's own labels in your language, exactly as `game.result` and `game.round` show
  them, such as `game.result.tryAgain` and `game.result.nextRound`. The check fails a string whose English
  names a button and whose translation lacks that button's label. Put the label in your language's usual
  quotation marks if that reads better.
- A claim stays as strong or as careful as the English. "About", "often", "most", "may", "only", "never" and
  "in the classic test" carry meaning. Do not add an example, a reason, a statistic or advice the English
  does not give, and do not drop one.
- A study, a book or a person stays named as the English names them. A source note keeps who found what.
- The brand "Memory Chess" stays in every string whose English has it.
- `chrome.translationNote` is a disclosure. It must say exactly what the English says: translated from
  English with AI assistance, checked by a second AI, not yet read by a native speaker.
- `meta.title` stays at 60 characters or fewer and `meta.description` at 160 or fewer, so search engines do
  not cut them. Lead the description with the direct answer and its number, as the English does.
- The keywords (`meta.keywords`) are the phrases a player in your language types into a search box for this
  topic. Use what people actually search, not a word-for-word copy of the English phrase.
- No em dash or en dash. Use the punctuation your language uses for a pause.

A string that must equal its English text, such as a lone name, goes in
`.verify-evidence/guides-i18n/<locale>/same-as-english.json` as `{ "<name>": ["<path>"] }`, with the path the
check printed.

## Tone

The guides are written in short, plain, direct sentences for a beginner. Keep that: one idea per sentence,
concrete verbs, no filler. Write the way a good chess coach in your language writes for beginners, not the
way a manual is translated. Reorder a sentence when your language puts things in another order. The reader
should not be able to tell it was translated.

## Report

The guides you translated and the last line `import` printed, the chess terms you chose with the source you
checked for each, and anything you could not translate truthfully.
