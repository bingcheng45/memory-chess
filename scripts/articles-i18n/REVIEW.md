# Review a translation of the articles

You review the translation of the articles into one language, `<locale>`. Another agent made it by
following `TRANSLATE.md`. Read that recipe first, so you know the rules the translation had to obey. You
are the last reader before the public. When you approve, the pages can go up, so approve only what you
would sign.

Run every command from the repo root, with Node 22.18 or newer. Keep each shell command plain: one
command, or plain commands joined with `&&`. Read JSON files with your file-reading tool, because a long
file printed in the shell is cut short.

## What you may write

- `src/lib/articles/translations/<locale>/<slug>.json`: the strings under `text`, and `sameAsEnglish`.
- `src/lib/articles/translations/<locale>/chrome.json`: `sameAsEnglish` only.
- `messages/<locale>.json`: the strings under `articles` only.

Never edit `sourceHash` or `reviewed` by hand. Do not edit an English entry, another locale, a script, or
a recipe. If the English text itself looks wrong, say so in your report and leave it.

## Where the files are

- The English text: `.verify-evidence/i18n/english/<slug>.source.json` and `chrome.source.json`, written
  by step 1.
- A translated article: `src/lib/articles/translations/<locale>/<slug>.json`.
- The translated strings of the section: `messages/<locale>.json`, under `articles`. The file
  `translations/<locale>/chrome.json` holds only their bookkeeping.

## Steps

1. Export the English text and confirm the translation passes the scripted check before you start.

	```
	node scripts/articles-i18n.mjs export .verify-evidence/i18n/english
	node scripts/articles-i18n.mjs check <locale>
	```

	If the check fails, the translator's work is not finished. Report the lines and stop.

2. Read each translated article alone, from the title to the last source note, as a native reader. Note
   every sentence that is wrong, stiff, or reads like a translation, and every word that your language's
   writers do not use. A word built by translating an English compound piece by piece is the most common
   fault.

3. Read each article again beside its `<slug>.source.json`, paragraph by paragraph. Confirm each point.

	- Every English sentence has its counterpart, and no sentence was added.
	- Every number, date, score, name and place is the one in the English text.
	- The meaning is the same. The English text is careful about who reported what. A phrase such as
	  "according to", "reported" or "suggests" must survive, and so must "about" before a number. A fact
	  must not become a reported claim either.
	- A quotation says what the English quotation says, with no word added.
	- One term is translated one way in all three articles.
	- Names of people are in the form your language's press uses. Titles of books, papers, films and
	  websites are in their original language.
	- Chess terms are the ones your language's chess writers use.
	- The words for pieces, round, board and memorizing, and the form of address, match the rest of
	  `messages/<locale>.json`. Step 2 of `TRANSLATE.md` lists the keys.
	- Spacing before a percent sign or a unit, quotation marks and date forms follow your language's rules
	  and are the same everywhere.

4. Read every string under `articles` in `messages/<locale>.json` beside `chrome.source.json`. Three of them
   are disclosures and must say exactly what the English says: `page.authorshipNote`,
   `page.translationNote` and `list.about3`. Check each plural message with the numbers 1, 2, 5 and 21 in
   your head.

5. Read every path under `sameAsEnglish`. Each one must be right when it is identical to English. The
   check refuses a path of running text there: `description`, `drill.why`, a section heading or paragraph,
   and a source note.
   `person.name`, `photo.author` and `photo.license` may be identical without an entry.

6. Fix what is wrong in the files listed under "What you may write". A repeated term may be replaced in
   one pass over the files. Then run the check again.

	```
	node scripts/articles-i18n.mjs check <locale>
	```

7. Approve only when the check passes and you have no open doubt about a fact.

	```
	node scripts/articles-i18n.mjs approve <locale>
	node scripts/articles-i18n.mjs check <locale>
	npm run validate:messages
	```

	`approve` covers the whole locale at once. It sets `reviewed` to `true` in every article file and in
	`chrome.json`, so your commit shows that change in each of them. If the translation needs more than
	repairs, do not approve. Report what is wrong and stop.

8. Commit only your locale's files.

	```
	/usr/bin/git add src/lib/articles/translations/<locale> messages/<locale>.json
	/usr/bin/git commit -m "feat(articles): review the <language> articles"
	```

9. Report: approved or not, the last line each command of step 7 printed, the commit SHA, every change you
   made as path, before, after and reason, and anything you could not judge.

## What the check proves and what it does not

The check proves structure: the same shape as the English text, every number kept, every placeholder and
plural form present, no value left in English by accident. Names, titles and loanwords kept in Latin letters exactly as in the English text do not count against the script check, and a decade such as "the 1980s" may be written the way the language writes it (`anni Ottanta`, `lata 80.`). It fails a value that keeps four in five of the words of its English value, and
any value full of words only English has, such as `the`, `with` and `which`. It cannot read. A translation that passes can
still say the wrong thing, and finding that is your job.
