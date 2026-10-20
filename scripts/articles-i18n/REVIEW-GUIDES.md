# Review a translation of the Learn guides

You review the translation of the Learn guides into one language, `<locale>`. Another agent made it by
following `TRANSLATE-GUIDES.md`. Read that recipe first, so you know the rules the translation had to obey.
You are the last reader before search engines and AI assistants see these pages. Approve only what you
would sign.

Run every command from the repo root, with Node 22.18 or newer. Keep each shell command plain. Read JSON
files with your file-reading tool, because a long file printed in the shell is cut short.

## What you may write

- `src/lib/seo/learn/translations/<locale>/<name>.json`: the strings under `text`, and `sameAsEnglish`.

Never edit `sourceHash` or `approvedHash` by hand. Do not edit an English guide, another locale, a script, a
message catalogue or a recipe, and do not commit. If the English text itself looks wrong, say so in your
report and leave it.

## Steps

1. Export the English text and confirm the translation passes the scripted check before you start.

	```
	node scripts/articles-i18n.mjs --guides export .verify-evidence/guides-i18n/english
	node scripts/articles-i18n.mjs --guides check <locale>
	```

	If the check fails, the translator's work is not finished. Report the lines and stop.

2. Read each translated guide alone, from the title to the last FAQ answer, as a native reader. Note every
   sentence that is wrong, stiff, or reads like a translation, and every word your language's chess writers
   do not use. A term built by translating an English compound piece by piece is the most common fault.

3. Read each guide again beside its `<slug>.source.json`, string by string. Confirm each point.

	- Every English sentence has its counterpart, and no sentence was added.
	- Every number is the one in the English text, including numbers written as words: piece counts,
	  seconds, minutes, days, weeks, percentages, ratings and pass marks.
	- Every button name is the game's label in your language, as `messages/<locale>.json` shows it under
	  `game.result` and `game.round`. "Try again" keeps the board size and "Next round" changes it, so a
	  drill that says to press one must not say the other.
	- A claim is as strong or as careful as the English. "About", "often", "most", "may", "only" and "never"
	  survive. A study or a person is named as the English names them.
	- Chess terms are the ones your language's chess writers use, and one term is translated one way in all
	  five guides and the chrome.
	- The words for pieces, board, round and memorizing, and the form of address, match
	  `messages/<locale>.json`.
	- `meta.title` and `meta.description` read as a search result would show them, and the description
	  leads with the answer and its number.
	- `chrome.translationNote` says exactly what the English says.

4. Fix what is wrong in the files under "What you may write", then run the check again.

	```
	node scripts/articles-i18n.mjs --guides check <locale>
	```

5. Approve only when the check passes and you have no open doubt about a fact.

	```
	node scripts/articles-i18n.mjs --guides approve <locale>
	node scripts/articles-i18n.mjs --guides check <locale>
	```

	The approval holds only for that exact text in that place. Any later edit makes `verify` and the build
	fail until `approve` runs again, so make every repair before you approve. If the translation needs more
	than repairs, do not approve. Report what is wrong and stop.

6. Report: approved or not, the last line each command of step 5 printed, every change you made as path,
   before, after and reason, and anything you could not judge.

## What the check proves and what it does not

The check proves structure: the same shape as the English text, every digit kept, every tag, placeholder and
plural form present, every named button in its translated form, no value left in English by accident, and
the title and description within their limits. It cannot read. A translation that passes can still say the
wrong thing, and finding that is your job.
