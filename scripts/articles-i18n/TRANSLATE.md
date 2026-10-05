# Translate the articles into one language

You translate every article and every string of the Articles section into one language. This recipe calls
that language `<locale>`, for example `de`. A second agent reviews your work after you, following
`REVIEW.md`. The tool `scripts/articles-i18n.mjs` checks a translation and writes it into the repo.

A translated article is served to readers and is never offered to search. Each one says on the page that
it was translated from English with AI assistance. A weak translation is worse than none, because a
reader in that language sees it as the site's own voice.

Run every command from the repo root, with Node 22.18 or newer. Keep each shell command plain: one
command, or plain commands joined with `&&`. Write files with your file-writing tool, not with a shell
heredoc. Read JSON files with your file-reading tool, because a long file printed in the shell is cut
short.

## What you may write

- Your working directory, `.verify-evidence/i18n/<locale>/`. Git ignores it.
- Nothing else by hand. `import` writes `src/lib/articles/translations/<locale>/` and the `articles` key of
  `messages/<locale>.json` for you.

Do not edit an English entry, another locale, another key of `messages/<locale>.json`, a script, or this
recipe. Do not run `approve`. The reviewer runs it. If the tool or this recipe looks wrong, stop and say so
in your report.

## Steps

1. Export the English text.

	```
	node scripts/articles-i18n.mjs export .verify-evidence/i18n/english
	```

	You get one `<slug>.source.json` for each article and one `chrome.source.json`, all in
	`.verify-evidence/i18n/english/`.

2. Read `messages/<locale>.json` for the words the game already uses in your language, and for how it
   addresses the player. Use the same words and the same form of address in the articles. These keys hold
   the words: `game.config.pieceCount` (pieces), `home.cta.playFree` (round), `game.memorize.title`
   (memorize, position), `leaderboard.columns.memorizeTime` (memorize time), `game.memorize.hint` (board),
   `game.presets.grandmaster.label` (grandmaster). The game writes seconds in a short form on its buttons
   (`game.config.seconds`). In the articles, write the full word.

3. For each `<slug>.source.json`, write `.verify-evidence/i18n/<locale>/<slug>.json`. The source file is
   `{ "slug", "sourceHash", "text": { ... } }`. Your file is the `text` object alone, with the same keys,
   the same number of sections, paragraphs and sources, in the same order, and every string translated:

	```
	{
	  "title": "...",
	  "description": "...",
	  "person": { "name": "...", "role": "..." },
	  "photo": { "alt": "...", "author": "...", "license": "...", "changes": "..." },
	  "facts": { "born": "...", "country": "..." },
	  "drill": { "why": "..." },
	  "sections": [{ "heading": "...", "paragraphs": ["...", "..."] }],
	  "sources": [{ "title": "...", "note": "..." }]
	}
	```

4. Write `.verify-evidence/i18n/<locale>/chrome.json`. It is one flat object from each `key` in
   `chrome.source.json` to its translation:

	```
	{ "list.heading": "Artikel", "pager.page": "Seite {page}" }
	```

	A string in `chrome.source.json` lists its `placeholders`, `tags` and `plurals` when it has any. Your
	translation must keep each of them.

5. If a value is right when it is identical to the English one, list its path in
   `.verify-evidence/i18n/<locale>/same-as-english.json`:

	```
	{ "chrome": ["page.sources"], "adriaan-de-groot": ["facts.knownFor"] }
	```

	Use it for a book title, or for a label that is the same word in your language. Do not use it to skip
	work. The check refuses it for running text: `description`, `drill.why`, a section heading or
	paragraph, and a source note. Four kinds of value may always stay as they are and need no entry: `person.name`,
	`photo.author`, `photo.license`, and a value with no letters such as `2882 (2014)`.

6. Check the translation. Fix every line the check prints, then run it again until its last line starts
   with `ok check`.

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

	`import` writes one file for each article, `chrome.json`, and the `articles` key of
	`messages/<locale>.json`. Every other line of that catalogue stays as it was.

9. Commit only your locale's files.

	```
	/usr/bin/git add src/lib/articles/translations/<locale> messages/<locale>.json
	/usr/bin/git commit -m "feat(articles): translate the articles into <language>"
	```

10. Report: the last line each command of step 8 printed, the commit SHA, every path you listed in
    `same-as-english.json` and why, and every sentence or term you were unsure about. The reviewer reads
    that list first.

## How to translate

- Translate the meaning, not the word order. Write plain prose that a native reader would not take for a
  translation. Short sentences are fine. Do not add a sentence and do not drop one.
- Use the words your language's writers use. If a phrase exists only because you translated it word for
  word, it is wrong. A loanword that your language's chess or psychology writers use, such as `Chunk` in
  German, is fine.
- Keep every fact: each number, date, year, score, name of a person, book, paper, tournament and place.
  Write numbers as digits wherever the English text has digits. Use your language's own separators, date
  order, month names and spacing before a unit or a percent sign (`50.000`, `19. Februar 2012`).
- The English text is careful about who said what. Keep every "according to", "reported", "suggests" and
  "about". Do not turn a reported claim into a fact, or a fact into a reported claim.
- A quotation says exactly what the English quotation says, with nothing added. Use your language's
  quotation marks.
- Write the name of a person in the form your language's press uses. In a language with another script
  that is the established transcription (for example the usual Russian, Japanese, Korean, Chinese and
  Hindi forms of Magnus Carlsen, Judit Polgár, Adriaan de Groot, Max Euwe, Garry Kasparov). A language
  in Latin script can have its own form too, as German has `Garri Kasparow`. If you are not sure a form
  is established, keep the Latin form.
- Use the chess terms your language's chess writers use for blindfold chess, grandmaster, simultaneous
  display, opening, middlegame, pawn chain and castled king. Do not coin a term.
- Keep the title of a book, paper, film, programme or website in its original language.
- In `sources`, keep every `title` exactly as it is in English. Translate only the `note`.
- In `photo`, keep a licence name such as `CC BY 4.0` exactly. Translate `Public domain`, `Unknown
  photographer` and the `changes` text. The page prints `changes` inside a sentence and adds the full
  stop, so `changes` starts with a capital letter and has no full stop.
- A heading, a fact or a label has no full stop at its end unless the English one has.
- Keep `Memory Chess` in Latin letters wherever the English text has it.
- Do not use an em dash or an en dash. Write a range with a hyphen (`2013-2023`) and split a sentence
  where English would use a dash.
- A title has at most 90 characters. No other value has a length limit.
- In `chrome.json`, keep every `{placeholder}` and every `<tag>...</tag>` pair. You may move them inside
  the sentence. A plural message keeps its `plural` and needs every plural form your language has. The
  check names the forms that are missing.

## What the check proves and what it does not

The check proves structure: the same shape as the English text, every number kept, every placeholder and
plural form present, no value left in English by accident, no long dash, and the script of your language
in at least half the letters of a value of 40 letters or more, which is Latin script for a language written
in it. Names, titles and loanwords kept exactly as in the English text do not count against the script check, and a decade such as "the 1980s" may be written the way the language writes it (`anni Ottanta`, `lata 80.`). It fails a value that still reads as English. That is a value that keeps four in five of the words of
its English value, or a value with a sentence in which English function words such as `the`, `with` and
`which` outnumber your language's own by more than three. One sentence left in English inside a translated
paragraph fails this way. A fact, a role or a caption of up to five English
words may be a name or a title and may keep them. A title or a saying that you keep exactly as the English
text has it at that path, inside a sentence you translated, is not counted. A sentence that keeps four in
five of the words of an English sentence was left in English, and all of it counts. It fails text in another language of this site: an article as a whole, the strings of the section as
a whole, and a value of 40 words or more that reads as that other language, so Danish does not pass as
Norwegian or Simplified Chinese as Traditional. It fails a long paragraph that is much shorter, against its English paragraph, than the rest of your
translation, which is how a dropped sentence shows. It cannot tell whether a sentence is correct or natural. That part is
yours, and then the reviewer's.
