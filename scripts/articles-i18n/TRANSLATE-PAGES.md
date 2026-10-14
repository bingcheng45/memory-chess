# Translate the trust pages into one language

You translate the About page, the Privacy Policy, the Terms of Service and the strings their reading page
draws around them into one language. This recipe calls that language `<locale>`, for example `de`. A second
agent reviews your work after you. The tool `scripts/articles-i18n.mjs --pages` checks a translation and
writes it into the repo.

A translated trust page is served to readers and is never offered to search. Each one says under its lede
that it was translated with AI assistance and links to the English page. On the privacy policy and the
terms the note also says that the English version governs. These pages tell a reader what the site does
with their data and what they agree to, so a sentence that says something the English does not is a real
harm, not a style problem.

Run every command from the repo root, with Node 22.18 or newer. Keep each shell command plain: one
command, or plain commands joined with `&&`. Write files with your file-writing tool, not with a shell
heredoc. Read JSON files with your file-reading tool, because a long file printed in the shell is cut short.

## What you may write

- Your working directory, `.verify-evidence/pages-i18n/<locale>/`. Git ignores it.
- Nothing else by hand. `import` writes `src/lib/pages/translations/<locale>/` for you.

Do not edit an English page in `src/lib/pages/`, another locale, a script, or this recipe. Do not run
`approve`, and do not add your locale to `TRANSLATED_PAGE_LOCALES`. The reviewer and the integrator do that.
If the tool or this recipe looks wrong, stop and say so in your report.

## Steps

1. Export the English text.

	```
	node scripts/articles-i18n.mjs --pages export .verify-evidence/pages-i18n/english
	```

	You get `about.source.json`, `privacy.source.json`, `terms.source.json` and `chrome.source.json`, each
	`{ "name", "sourceHash", "text": { ... } }`.

2. Read `messages/<locale>.json` for the words the game already uses in your language and for how it
   addresses the player, and use the same words and the same form of address.

3. For each source file, write `.verify-evidence/pages-i18n/<locale>/<name>.json`: the `text` object alone,
   with the same keys in the same order, the same sections, the same number of paragraphs (`p`) and list
   items (`ul`) in each section, and every string translated. Section keys such as `"short-version"` are
   anchor ids. Keep them exactly as they are.

4. Check the directory, fix every line it prints, and check again until it prints `ok`.

	```
	node scripts/articles-i18n.mjs --pages check <locale> .verify-evidence/pages-i18n/<locale>
	```

5. Install it. `import` runs the same check and writes nothing when it fails.

	```
	node scripts/articles-i18n.mjs --pages import <locale> .verify-evidence/pages-i18n/<locale>
	```

The reviewer then runs `node scripts/articles-i18n.mjs --pages approve <locale>`. The integrator adds the
locale to `TRANSLATED_PAGE_LOCALES` in `src/lib/pages/translatedLocales.ts`, and the build runs
`node scripts/articles-i18n.mjs --pages verify`. A locale serves all three pages or none.

## Tags and placeholders

Every string is an ICU message. Links and bold text are rich tags, and values the page fills in are
placeholders:

```
"Write to me at <mail>{email}</mail> or use the <contact>contact form</contact>."
"The <learn>Learn library</learn> holds {count, plural, one {# guide} other {# guides}} on board vision."
"Last updated: <time>{date}</time>"
```

- Keep every tag and every placeholder, with the same names. Translate the words inside a tag; move the
  tag to where the linked words fall in your sentence. The page decides where a tag links, so you cannot
  and need not write a URL.
- Never translate a placeholder name. `{email}` prints the address, `{date}` the date in your language,
  `{count}` a number.
- A plural keeps `#` and needs every category your language uses (the check names the missing ones).
- An apostrophe followed by `{` or `<` starts quoted ICU text. Write such a phrase so the apostrophe is not
  next to a brace or a tag.

## What stays as it is

- The brand "Memory Chess", which the check requires in every string whose English has it, and the handle
  `@TheMemoryChess`.
- Product and company names: Google AdSense, Google Analytics, Google Sheets, My Ad Center, YourAdChoices,
  DoubleClick, DART, Vercel, Vercel Analytics, Vercel Speed Insights, Ahrefs, Ahrefs Analytics, Supabase,
  Tont, X, Facebook, LinkedIn, Reddit, WhatsApp, Threads, Bluesky, IndexedDB.
- The analytics names on the privacy page: event names such as `lab_dashboard_share` and `result_share`,
  method values such as `native`, `copy_image` and `post`, the network values `x`, `facebook` and the
  others, and the path `/share/result/`. They name what the code sends, so a translated one would be false.
- Legal names: GDPR, CCPA, and "Do Not Sell or Share My Personal Information" may keep the English title
  in quotes or parentheses after your translation of it, if that is how your language's law refers to it.
- The person's name, Bing Cheng.

A string that must equal its English text, such as a lone product name, goes in
`.verify-evidence/pages-i18n/<locale>/same-as-english.json` as `{ "<name>": ["<path>"] }`, with the path the
check printed.

## Tone

- Privacy and terms are legal text written plainly. Translate what each sentence commits to, not its
  rhythm. Do not add a promise, a right, a limit or a hedge the English does not state, and do not drop one.
  "May", "only", "never", "do not" and "unless" carry the meaning; keep each of them.
- Use your language's standard terms for the legal ideas: data controller, legitimate interests, consent,
  supervisory authority, personal information, sale or sharing.
- About is the developer speaking in the first person. Keep "I".
- Numbers, years and dates must match: the check fails a translation that loses or changes a number.
- No em dash or en dash. Use the punctuation your language uses for a pause.
