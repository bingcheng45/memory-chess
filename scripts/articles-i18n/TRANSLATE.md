# Translate the articles into one language

You translate every article and every string of the Articles section into one language. This recipe calls
that language `<locale>`, for example `de`. A second agent reviews your work after you, following
`REVIEW.md`. The tool `scripts/articles-i18n.mjs` checks a translation and writes it into the repo.

A translated article is served to readers and is never offered to search. Each one says on the page that
it was translated from English with AI assistance. A weak translation is worse than none, because a
reader in that language sees it as the site's own voice.

Run every command from the repo root. Use Node 22.18 or newer.

## What you may write

- Your working directory, `.verify-evidence/i18n/<locale>/`. Git ignores it.
- Nothing else by hand. `import` writes `src/lib/articles/translations/<locale>/` and the `articles` key of
  `messages/<locale>.json` for you.

Do not edit an English entry, another locale, another key of `messages/<locale>.json`, a script, or this
recipe. Do not run `approve`. The reviewer runs it. If the tool or this recipe looks wrong, stop and say so
in your report.

## Steps

1. Export the English sources.

	```
	node scripts/articles-i18n.mjs export .verify-evidence/i18n/english
	```

	You get one `<slug>.source.json` for each article and one `chrome.source.json`.

2. Read `messages/<locale>.json` for the words the game already uses in your language. Use the same words
   in the articles. These keys hold them: `game.config.pieceCount` (pieces), `home.cta.playFree` (round),
   `game.memorize.title` (memorize, position), `leaderboard.columns.memorizeTime` (memorize time),
   `game.memorize.hint` (board), `game.presets.grandmaster.label` (grandmaster), `game.config.seconds`
   (how seconds are written).

3. For each `<slug>.source.json`, write `.verify-evidence/i18n/<locale>/<slug>.json`. The file holds the
   `text` object of the source and nothing else: the same keys, the same number of sections, paragraphs
   and sources, in the same order, with every string translated.

4. Write `.verify-evidence/i18n/<locale>/chrome.json`. It is one flat object from each `key` in
   `chrome.source.json` to its translation, for example `{ "list.heading": "Artikel" }`.

5. If a value is right when it is identical to the English one, list its path in
   `.verify-evidence/i18n/<locale>/same-as-english.json`:

	```
	{ "chrome": ["page.sources"], "adriaan-de-groot": ["facts.knownFor"] }
	```

	Use it for a book title that has no translation, or a label that is the same word in your language.
	Do not use it to skip work.

6. Check the translation. Fix every line the check prints, then run it again until it prints `ok`.

	```
	node scripts/articles-i18n.mjs check <locale> .verify-evidence/i18n/<locale>
	```

7. Read each translated article from top to bottom as a reader would, without the English beside it. Fix
   every sentence that reads like a translation. Run the check again.

8. Write the translation into the repo, then check what was written.

	```
	node scripts/articles-i18n.mjs import <locale> .verify-evidence/i18n/<locale>
	node scripts/articles-i18n.mjs check <locale>
	npm run validate:messages
	```

9. Commit only your locale's files.

	```
	/usr/bin/git add src/lib/articles/translations/<locale> messages/<locale>.json
	/usr/bin/git commit -m "feat(articles): translate the articles into <language>"
	```

10. Report: the last line of each command in step 8, the commit SHA, every path you listed in
    `same-as-english.json` and why, and every sentence you were unsure about.

## How to translate

- Translate the meaning, not the word order. Write plain prose that a native reader would not take for a
  translation. Short sentences are fine. Do not add a sentence and do not drop one.
- Keep every fact: each number, date, year, score, name of a person, book, paper, tournament and place.
  Write numbers as digits wherever the English text has digits. Use your language's own separators and
  date order (`50.000`, `19. Februar 2012`).
- Write the name of a person in the form your language's press uses. In a language with another script
  that is the established transcription (for example the usual Russian, Japanese, Korean, Chinese and
  Hindi forms of Magnus Carlsen, Judit Polgár, Adriaan de Groot, Max Euwe, Garry Kasparov). If you are
  not sure a form is established, keep the Latin form.
- Use the chess terms your language's chess writers use for blindfold chess, grandmaster, simultaneous
  display, opening, middlegame, pawn chain and castled king. Do not coin a term.
- Keep the title of a book, paper, film, programme or website in its original language.
- In `sources`, keep every `title` exactly as it is in English. Translate only the `note`.
- In `photo`, keep a licence name such as `CC BY 4.0` exactly. Translate `Public domain`, `Unknown
  photographer` and the `changes` text.
- Keep `Memory Chess` in Latin letters wherever the English text has it.
- A quotation is translated like any other sentence. Use your language's quotation marks.
- Do not use an em dash or an en dash. Write a range with a hyphen (`2013-2023`) and split a sentence
  where English would use a dash.
- A title has at most 90 characters.
- In `chrome.json`, keep every `{placeholder}` and every `<tag>...</tag>` pair. You may move them inside
  the sentence. A plural message keeps its `plural` and needs every plural form your language has. The
  check names the forms that are missing.

## What the check proves and what it does not

The check proves structure: the same shape as the English text, every number kept, every placeholder and
plural form present, no value left in English by accident, no long dash, the right script for a language
that does not use Latin letters. It cannot tell whether a sentence is correct or natural. That part is
yours, and then the reviewer's.
