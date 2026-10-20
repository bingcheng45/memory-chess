# Bing Webmaster Tools

Why: Bing runs its own Copilot answer box, which cited rival chess sites for several of our target queries when we checked on 2026-10-20 (research notes, not a Bing statement). Whether Bing's index feeds ChatGPT search is unconfirmed: OpenAI's own pages do not say. On 2026-10-20 Bing still ranked the old `memory-chess.vercel.app` address first for "best app to train chess memory and visualization". That host redirects permanently (308) to `thememorychess.com`, so the page Bing shows has not moved to the real domain yet.

Nothing here needs code.

## Verify the site by importing from Google Search Console

1. Open https://www.bing.com/webmasters and sign in with the account that owns the Search Console property.
2. Choose **Import your sites from GSC** and allow access to Search Console.
3. Select the `thememorychess.com` property and import it. Bing verifies it with the Search Console proof, so no meta tag or file is added.
4. Confirm `thememorychess.com` shows as verified in the site list.

Keep the Search Console connection. Bing states it "will periodically validate your site ownership status by syncing with your Google Search Console account", and if access is revoked you must import again or verify another way ([Bing Webmaster blog, September 2019](https://blogs.bing.com/webmaster/september-2019/Import-sites-from-Search-Console-to-Bing-Webmaster-Tools)). Do not remove the Bing account's access to the Search Console property.

## Submit the sitemap

1. In the site's left menu open **Sitemaps**.
2. Submit `https://thememorychess.com/sitemap.xml`.
3. Check back later that the status is Success and the discovered URL count matches the sitemap.

## Check the old Vercel address

1. Open **URL Inspection** and enter `https://memory-chess.vercel.app/`. If Bing refuses it, add that host as its own site and verify it first. It should show the permanent redirect to `https://thememorychess.com/`.
2. Then inspect `https://thememorychess.com/` and, if it is not indexed or shows the old title, use **Request indexing**.

## Push changes with IndexNow

The key file is served at `https://thememorychess.com/5a02a3bb61bac459c5a10034038b50f9.txt`.

- Every production deploy runs `.github/workflows/indexnow.yml`. It reads the live sitemap and compares each URL's `lastmod` with `.indexnow/state.json`, a map of URL to the `lastmod` recorded when that URL was last submitted. Only URLs that are new, or whose `lastmod` is newer than the recorded one, are sent. A deploy that changes no page sends nothing, in line with the IndexNow FAQ advice not to resubmit unchanged URLs ([indexnow.org/faq](https://www.indexnow.org/faq)).
- The state is kept with `actions/cache` (key `indexnow-state-<run id>`, restored from the newest `indexnow-state-` entry) and is saved only after IndexNow answers 200 or 202. A failed submission leaves the old state, so the same URLs are tried again on the next deploy.
- The first run has no cache, so it submits the whole sitemap once. GitHub also deletes caches not used for 7 days, so after a quiet week the next deploy submits everything once more. That is well under the 10,000 URL limit.
- Removed URLs are dropped from the state. A URL that comes back is submitted as new.
- To submit the whole sitemap by hand, run `npm run indexnow:submit` locally, or start the IndexNow workflow from the Actions tab, which sends the whole sitemap and records it in the state. Add `--state .indexnow/state.json` to a local run to use the diff and record it.
- To see the payload without sending it, run `npm run indexnow:submit -- --dry-run`. Use `--urls a,b` for a subset.
- IndexNow shares the submission with Bing and the other participating engines. A 200 or 202 answer means received, not indexed: the documentation says the 200 code "only indicates that the search engine has received your URL" ([indexnow.org/documentation](https://www.indexnow.org/documentation)).
- Any answer other than 200 or 202 fails the run and prints the response body. The status meanings come from the same documentation table: 400 invalid format, 403 key not valid, 422 a URL does not belong to the host or the key is not matching the schema, 429 too many requests (potential spam).

## After merge

After the first two Production deploys, run `gh api repos/bingcheng45/memory-chess/actions/caches` and check that an `indexnow-state-*` entry exists, and that the second run logged "nothing to submit". If it did not, the cache is not restoring for `deployment_status` runs.
