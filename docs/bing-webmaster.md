# Bing Webmaster Tools

Why: Bing's index feeds Copilot and ChatGPT search. On 2026-10-20 Bing still ranked the old `memory-chess.vercel.app` address first for "best app to train chess memory and visualization". That host redirects permanently (308) to `thememorychess.com`, so the page Bing shows has not moved to the real domain yet.

Nothing here needs code.

## Verify the site by importing from Google Search Console

1. Open https://www.bing.com/webmasters and sign in with the account that owns the Search Console property.
2. Choose **Import your sites from GSC** and allow access to Search Console.
3. Select the `thememorychess.com` property and import it. Bing verifies it with the Search Console proof, so no meta tag or file is added.
4. Confirm `thememorychess.com` shows as verified in the site list.

## Submit the sitemap

1. In the site's left menu open **Sitemaps**.
2. Submit `https://thememorychess.com/sitemap.xml`.
3. Check back later that the status is Success and the discovered URL count matches the sitemap.

## Check the old Vercel address

1. Open **URL Inspection** and enter `https://memory-chess.vercel.app/`. Bing can only inspect hosts you have verified. If Bing refuses it, add that host as its own site and verify it first. It should show the permanent redirect to `https://thememorychess.com/`.
2. Then inspect `https://thememorychess.com/` and, if it is not indexed or shows the old title, use **Request indexing**.

## Push changes with IndexNow

The key file is served at `https://thememorychess.com/5a02a3bb61bac459c5a10034038b50f9.txt`.

- Every production deploy runs `.github/workflows/indexnow.yml`, which submits sitemap URLs whose `lastmod` is within the last two days.
- To submit the whole sitemap by hand, run `npm run indexnow:submit` locally, or start the IndexNow workflow from the Actions tab.
- To see the payload without sending it, run `npm run indexnow:submit -- --dry-run`. Use `--urls a,b` for a subset.
- IndexNow shares the submission with Bing and the other participating engines. A 200 or 202 answer means received, not indexed.
