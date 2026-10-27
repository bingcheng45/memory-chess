# Content Security Policy reports

The site enforces `frame-ancestors 'none'` and sends a full policy as `Content-Security-Policy-Report-Only`. That policy now names `report-uri /api/csp-report` and `report-to csp-endpoint`, and the `Reporting-Endpoints` header defines `csp-endpoint`. Chrome and Edge send the Reporting API format (`application/reports+json`); Firefox and Safari send the report-uri format (`application/csp-report`). The endpoint takes both.

## When it stores anything

`POST /api/csp-report` always answers 204 for a well-formed report. It writes only when both are true:

1. `SUPABASE_SERVICE_ROLE_KEY` in Production holds the `service_role` JWT (never the anon key; this route does not fall back to it).
2. Migration 0007 is applied (`docs/migrations/2026-10-server-errors.md`).

Until then it is inert: 204, no write, one warning in the runtime log. With the key set but the table missing, each stored report logs `Server error report not stored:` (at most 20 a minute).

## What a row holds

Table `server_errors`, `route = 'POST /api/csp-report'`, `kind = 'violation'`. `message` reads `<directive> blocked <origin>`. `detail` holds `directive`, `blocked` (origin only, or `inline`, `eval`, `data`), `path` (document path, no query string), `disposition` (`report` or `enforce`) and `sample` (first 80 characters of the script sample, redacted). No IP, user agent, full URL or query string is kept. Reports from browser extensions (`chrome-extension:`, `moz-extension:`, `safari-web-extension:`) are dropped.

Limits: 8 KB per request (413), `application/csp-report` or `application/reports+json` only (415), 30 requests a minute per address (429 with `Retry-After`), and the shared 20 rows a minute for this route.

## Reading them

```sql
SELECT detail->>'directive' AS directive, detail->>'blocked' AS blocked, detail->>'path' AS path, count(*)::int AS reports, max(created_at) AS last_seen
FROM public.server_errors
WHERE route = 'POST /api/csp-report' AND created_at > now() - interval '7 days'
GROUP BY 1, 2, 3
ORDER BY reports DESC;
```

## Plan to enforce

1. Collect at least two weeks of reports across the busiest pages (home, `/game`, `/leaderboard`, a Learn page, an article) and with ads and consent shown.
2. Add every origin that is a real dependency to the matching directive in `next.config.ts`. Ignore blocked origins that are not ours (injected by extensions or ISPs).
3. Once a week shows no report from a page we serve, move the directives one at a time from Report-Only to enforced, starting with `object-src`, `base-uri` and `form-action`, then `frame-src`, `connect-src`, `img-src`, and last `script-src`. `script-src` keeps `'unsafe-inline'` until the inline scripts Next writes into static pages can be nonced or hashed, so it enforces little until then.
4. Keep the Report-Only copy alongside any newly enforced directive for a week so a regression shows up as a report.
